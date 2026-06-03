import "server-only";

// Bound how many analyze pipelines (Whisper STT + LLM) run at once. Each run can
// peg every CPU core (local large-v3), so unbounded concurrency from rapid /
// repeated uploads overloads the host. Queued jobs are NOT cancelled when the
// client disconnects — an abandoned job still finishes (see route.ts).
const MAX = Math.max(1, Number(process.env.ANALYZE_CONCURRENCY ?? 2) || 2);
// reject (don't grow forever) once this many are already waiting for a slot
const MAX_QUEUE = Math.max(0, Number(process.env.ANALYZE_MAX_QUEUE ?? 8) || 8);

let active = 0;
const queue: Array<() => boolean> = [];

export function slots() {
  return { active, max: MAX, queued: queue.length };
}

export class QueueFullError extends Error {
  constructor() {
    super("ระบบกำลังประมวลผลงานอื่นอยู่เต็ม กรุณาลองใหม่อีกครั้ง");
    this.name = "QueueFullError";
  }
}

/**
 * Wait for a free slot. Resolves with a release() that is safe to call once.
 * Throws QueueFullError immediately when the wait queue is already full.
 */
export async function acquireSlot(): Promise<() => void> {
  if (active >= MAX && queue.length >= MAX_QUEUE) throw new QueueFullError();

  await new Promise<void>((resolve) => {
    const tryRun = () => {
      if (active >= MAX) return false;
      active += 1;
      resolve();
      return true;
    };
    if (!tryRun()) queue.push(tryRun);
  });

  let released = false;
  return () => {
    if (released) return;
    released = true;
    active = Math.max(0, active - 1);
    while (queue.length) {
      const next = queue.shift();
      if (next && next()) break; // granted to the next waiter
    }
  };
}
