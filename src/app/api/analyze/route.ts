import { transcribe } from "@/lib/server/transcribe";
import { analyzeTranscript, llmPreflight } from "@/lib/server/analyze";
import { saveAudio } from "@/lib/server/storage";
import { getDb } from "@/lib/server/db";
import { acquireSlot, slots, QueueFullError } from "@/lib/server/concurrency";
import { estimateTotalSec } from "@/lib/estimate";

export const runtime = "nodejs";
// large-v3 STT (~280s on CPU) + LLM can exceed 5min; allow headroom locally.
export const maxDuration = 600;

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Streams the pipeline as NDJSON so the UI can follow REAL stages and show how
 * long each one actually takes. One JSON object per line:
 *   {type:"stage", key, state:"start"|"done", ms?}
 *   {type:"result", id, analysis, transcript, audioUrl, timing}
 *   {type:"error", message}
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const audio = form.get("audio");
  const provider =
    (form.get("provider") as string) === "openai" ? "openai" : "local";
  const apiKey = (form.get("apiKey") as string) || undefined;
  const depth: "fast" | "deep" =
    (form.get("depth") as string) === "deep" ? "deep" : "fast";
  const durationSec = Number(form.get("duration")) || 0;
  const filename =
    (form.get("audio") as File)?.name || `requirement-${Date.now()}.webm`;

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Swallow enqueue failures: if the client disconnects (tab closed mid-run)
      // the controller errors, but the pipeline below MUST keep running so the
      // job still reaches done/error in the DB and shows up in History.
      const send = (obj: unknown) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          /* client gone — keep computing */
        }
      };
      const fail = (message: string, status = "error") => {
        send({ type: status === "error" ? "error" : "warn", message });
      };

      let release: (() => void) | null = null;
      try {
        if (!(audio instanceof Blob)) {
          fail("ไม่พบไฟล์เสียง");
          controller.close();
          return;
        }
        if (audio.size > MAX_BYTES) {
          fail("ไฟล์เสียงใหญ่เกิน 100MB");
          controller.close();
          return;
        }
        // accept audio only — by mime or known extension
        const okExt = /\.(webm|mp3|wav|m4a|ogg)$/i.test(filename);
        const okMime = (audio.type || "").startsWith("audio/");
        if (!okExt && !okMime) {
          fail("ชนิดไฟล์ไม่รองรับ — รองรับเฉพาะไฟล์เสียง (.mp3 .wav .m4a)");
          controller.close();
          return;
        }

        // 1. upload received — persist audio + create a "processing" record up
        // front so it appears in History immediately and survives the user
        // leaving the page (the compute below runs to completion regardless of
        // whether the client stays connected).
        const stored = await saveAudio(audio, filename);
        const db = getDb();
        let jobId = stored.id;
        if (db) {
          try {
            const row = await db.project.create({
              data: {
                title: filename.replace(/\.[^.]+$/, ""),
                client: "กำลังประมวลผล…",
                audioName: filename,
                audioPath: stored.filename,
                status: "processing",
                tag: "Processing",
                estFinishAt: new Date(
                  Date.now() +
                    estimateTotalSec(
                      durationSec,
                      provider === "openai" ? "openai" : "local",
                    ) *
                      1000,
                ),
                analysis: undefined,
              },
            });
            jobId = row.id;
          } catch {
            /* DB optional */
          }
        }
        const markError = async (msg: string) => {
          if (!db) return;
          try {
            await db.project.update({
              where: { id: jobId },
              data: { status: "error", error: msg.slice(0, 300) },
            });
          } catch {}
        };
        send({ type: "job", id: jobId, audioUrl: stored.url });
        send({ type: "stage", key: "upload", state: "done", ms: 0 });

        // 1a. preflight the LLM up front — if it's not wired up, tell the user
        // now instead of after a minute of transcription.
        const llmProvider = (process.env.LLM_PROVIDER || "claude-cli").toLowerCase();
        const llmApiKey = llmProvider === "openai" ? apiKey : undefined;
        const llmIssue = llmPreflight({ apiKey: llmApiKey });
        if (llmIssue) {
          await markError(llmIssue);
          fail(llmIssue);
          controller.close();
          return;
        }

        // 1b. wait for a compute slot so concurrent uploads can't peg the host.
        // The row already exists as "processing", so a queued job still shows in
        // History; queued jobs are not cancelled if the client leaves.
        try {
          const s = slots();
          if (s.active >= s.max)
            send({ type: "queue", message: "กำลังรอคิวประมวลผล", queued: s.queued + 1 });
          release = await acquireSlot();
        } catch (e) {
          if (e instanceof QueueFullError) {
            await markError(e.message);
            fail(e.message);
            controller.close();
            return;
          }
          throw e;
        }

        // 2. transcribe
        send({ type: "stage", key: "transcribe", state: "start" });
        const tStt = Date.now();
        let transcript: string;
        try {
          transcript = await transcribe(audio, { provider, apiKey, filename });
        } catch (e) {
          await markError(e instanceof Error ? e.message : "ถอดเสียงไม่สำเร็จ");
          throw e;
        }
        const sttMs = Date.now() - tStt;
        if (!transcript?.trim()) {
          await markError("ถอดเสียงไม่สำเร็จ (ข้อความว่าง)");
          fail("ถอดเสียงไม่สำเร็จ (ข้อความว่าง)");
          controller.close();
          return;
        }
        send({
          type: "stage",
          key: "transcribe",
          state: "done",
          ms: sttMs,
          preview: transcript.slice(0, 160),
        });

        // 3. analyze (LLM) — llmApiKey computed in the preflight above (the
        // OpenAI STT key is only forwarded when the LLM provider is OpenAI too).
        send({ type: "stage", key: "analyze", state: "start" });
        const tLlm = Date.now();
        let analysis;
        try {
          analysis = await analyzeTranscript(transcript, {
            apiKey: llmApiKey,
            depth,
          });
        } catch (e) {
          await markError(e instanceof Error ? e.message : "วิเคราะห์ไม่สำเร็จ");
          throw e;
        }
        const llmMs = Date.now() - tLlm;
        send({ type: "stage", key: "analyze", state: "done", ms: llmMs });

        // 4. finalize: mark the processing record done with the result
        send({ type: "stage", key: "finalize", state: "start" });
        const tFin = Date.now();
        if (db) {
          try {
            await db.project.update({
              where: { id: jobId },
              data: {
                title: analysis.title,
                client: analysis.client,
                transcript,
                status: "done",
                error: null,
                confidence: Math.round(analysis.confidence),
                mandayMin: analysis.mandayMin,
                mandayMax: analysis.mandayMax,
                features: analysis.features.length,
                tag: analysis.integrations[0]?.cat ?? "Project",
                durationMs: sttMs + llmMs,
                analysis,
              },
            });
          } catch {
            /* DB optional */
          }
        }
        const finMs = Date.now() - tFin;
        send({ type: "stage", key: "finalize", state: "done", ms: finMs });

        console.log(
          `[analyze] provider=${provider} stt=${(sttMs / 1000).toFixed(1)}s llm=${(llmMs / 1000).toFixed(1)}s fin=${(finMs / 1000).toFixed(1)}s`,
        );

        send({
          type: "result",
          id: jobId,
          analysis,
          transcript,
          audioUrl: stored.url,
          timing: { sttMs, llmMs, finMs, provider },
        });
      } catch (err) {
        fail(err instanceof Error ? err.message : "วิเคราะห์ไม่สำเร็จ");
      } finally {
        release?.(); // free the compute slot for the next queued job
        try {
          controller.close();
        } catch {
          /* already errored/closed by a client disconnect */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
