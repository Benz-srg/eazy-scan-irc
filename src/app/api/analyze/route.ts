import { transcribe } from "@/lib/server/transcribe";
import { analyzeTranscript } from "@/lib/server/analyze";
import { saveAudio } from "@/lib/server/storage";
import { getDb } from "@/lib/server/db";

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
  const filename =
    (form.get("audio") as File)?.name || `requirement-${Date.now()}.webm`;

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      const fail = (message: string, status = "error") => {
        send({ type: status === "error" ? "error" : "warn", message });
      };

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

        // 1. upload received
        send({ type: "stage", key: "upload", state: "done", ms: 0 });

        // 2. transcribe
        send({ type: "stage", key: "transcribe", state: "start" });
        const tStt = Date.now();
        const transcript = await transcribe(audio, {
          provider,
          apiKey,
          filename,
        });
        const sttMs = Date.now() - tStt;
        if (!transcript?.trim()) {
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

        // 3. analyze (LLM)
        send({ type: "stage", key: "analyze", state: "start" });
        const tLlm = Date.now();
        const analysis = await analyzeTranscript(transcript, { apiKey, depth });
        const llmMs = Date.now() - tLlm;
        send({ type: "stage", key: "analyze", state: "done", ms: llmMs });

        // 4. finalize: persist audio + DB
        send({ type: "stage", key: "finalize", state: "start" });
        const tFin = Date.now();
        const stored = await saveAudio(audio, filename);
        const db = getDb();
        let id = stored.id;
        if (db) {
          try {
            const row = await db.project.create({
              data: {
                title: analysis.title,
                client: analysis.client,
                audioName: filename,
                audioPath: stored.filename,
                transcript,
                confidence: Math.round(analysis.confidence),
                mandayMin: analysis.mandayMin,
                mandayMax: analysis.mandayMax,
                features: analysis.features.length,
                tag: analysis.integrations[0]?.cat ?? "Project",
                analysis,
              },
            });
            id = row.id;
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
          id,
          analysis,
          transcript,
          audioUrl: stored.url,
          timing: { sttMs, llmMs, finMs, provider },
        });
      } catch (err) {
        fail(err instanceof Error ? err.message : "วิเคราะห์ไม่สำเร็จ");
      } finally {
        controller.close();
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
