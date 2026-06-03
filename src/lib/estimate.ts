// Rough projection of how long the pipeline will take, used to show an ETA on
// the Processing screen. Calibrated from ONE measured local run (31.5s audio ->
// 63s Whisper large-v3 on CPU + 87s claude-cli/haiku) on a single machine, so
// the constants are deliberately coarse and lean conservative (over-estimate):
// a job that finishes before the promised clock reads as fast, a late one reads
// as broken. The display anchors to the real "transcribe start" event and
// re-tightens once the real STT time is known, so this only needs to be roughly
// right — see Processing.tsx.

export type SttProvider = "local" | "openai";

/** Whisper STT seconds. Local large-v3 on CPU is ~2x realtime; OpenAI is fast. */
export function estimateSttSec(durationSec: number, provider: SttProvider): number {
  const d = Math.max(0, durationSec);
  return provider === "openai"
    ? Math.round(10 + 0.25 * d)
    : Math.round(5 + 2.2 * d);
}

/**
 * LLM analyze seconds. The LLM provider + depth are server-side env the client
 * can't see (calibration is claude-cli/haiku); kept conservative so other
 * providers / deep mode still tend to finish before the estimate.
 */
export function estimateLlmSec(durationSec: number): number {
  return Math.round(70 + 1.2 * Math.max(0, durationSec));
}

/** Whole pipeline (STT + LLM + finalize) seconds. */
export function estimateTotalSec(durationSec: number, provider: SttProvider): number {
  return estimateSttSec(durationSec, provider) + estimateLlmSec(durationSec) + 3;
}

/** Wall-clock finish time, minute-resolution (the literal "~กี่โมง" ask). */
export function fmtClock(at: Date): string {
  return at.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Coarse "time left" — never second-by-second (we don't have that precision). */
export function fmtRemain(sec: number): string {
  if (sec <= 20) return "ใกล้เสร็จแล้ว";
  return `~${Math.ceil(sec / 60)} นาที`;
}
