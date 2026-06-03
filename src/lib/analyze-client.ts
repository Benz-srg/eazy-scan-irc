"use client";

import type { Analysis } from "./types";
import { AnalysisSchema } from "./types";
import { SAMPLE_ANALYSIS } from "./sample-data";

export type StageKey = "upload" | "transcribe" | "analyze" | "finalize";

export type StageEvent =
  | { type: "stage"; key: StageKey; state: "start" }
  | { type: "stage"; key: StageKey; state: "done"; ms: number; preview?: string }
  | { type: "queue"; message?: string; queued?: number }
  | { type: "result"; id?: string; audioUrl?: string }
  | { type: "error"; message: string };

export type AnalyzeOutcome = {
  analysis: Analysis | null;
  source: "api" | "sample" | "error";
  error?: string;
  audioUrl?: string;
  id?: string;
  transcript?: string;
  timing?: { sttMs: number; llmMs: number; finMs?: number; provider: string };
};

type Session = {
  audioBlob: Blob | null;
  audioName: string;
  provider: "local" | "openai";
  apiKey: string;
  depth?: "fast" | "deep";
  durationSec?: number;
};

/**
 * Streams the real pipeline (NDJSON) and reports each stage via onStage so the
 * UI can follow actual progress + timing.
 *
 * The bundled sample is used ONLY for the explicit demo (no audio). When real
 * audio is provided and the pipeline fails, we return an ERROR — never silently
 * swap in unrelated mock data (that hid setup problems from the user).
 */
export async function runAnalysis(
  session: Session,
  onStage?: (ev: StageEvent) => void,
): Promise<AnalyzeOutcome> {
  if (!session.audioBlob) {
    return { analysis: SAMPLE_ANALYSIS, source: "sample" };
  }
  try {
    const fd = new FormData();
    fd.append("audio", session.audioBlob, session.audioName || "audio.webm");
    fd.append("provider", session.provider);
    fd.append("depth", session.depth ?? "fast");
    if (session.durationSec && session.durationSec > 0)
      fd.append("duration", String(session.durationSec));
    if (session.provider === "openai" && session.apiKey)
      fd.append("apiKey", session.apiKey);

    const res = await fetch("/api/analyze", { method: "POST", body: fd });
    if (!res.ok || !res.body) throw new Error(`analyze failed: ${res.status}`);

    type ResultMsg = {
      analysis?: unknown;
      id?: string;
      audioUrl?: string;
      transcript?: string;
      timing?: AnalyzeOutcome["timing"];
    };
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let result: ResultMsg | null = null;
    let errMsg: string | null = null;

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let ev: Record<string, unknown>;
      try {
        ev = JSON.parse(trimmed);
      } catch {
        return;
      }
      if (ev.type === "result") {
        result = ev as ResultMsg;
      } else if (ev.type === "error") {
        errMsg = String(ev.message ?? "analyze error");
      } else if ((ev.type === "stage" || ev.type === "queue") && onStage) {
        onStage(ev as StageEvent);
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        handleLine(buf.slice(0, nl));
        buf = buf.slice(nl + 1);
      }
    }
    handleLine(buf);

    if (errMsg) throw new Error(errMsg);
    const r = result as unknown as ResultMsg | null;
    if (!r) throw new Error("no result from stream");

    const parsed = AnalysisSchema.safeParse(r.analysis);
    if (!parsed.success) throw new Error("invalid analysis shape");

    return {
      analysis: parsed.data,
      source: "api",
      audioUrl: r.audioUrl,
      id: r.id,
      transcript: r.transcript,
      timing: r.timing,
    };
  } catch (err) {
    // real audio failed → surface the error, do NOT fake a sample result
    return {
      analysis: null,
      source: "error",
      error: err instanceof Error ? err.message : "วิเคราะห์ไม่สำเร็จ",
    };
  }
}
