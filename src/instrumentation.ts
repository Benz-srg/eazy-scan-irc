// Runs once when the server boots (Next.js instrumentation hook). Prints a
// banner so it's obvious which LLM / STT / DB the running server is wired to —
// no need to start an analysis to find out.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { llmStartupInfo } = await import("@/lib/server/analyze");
  const stt = process.env.PYTHON_WHISPER_URL
    ? `Local Whisper @ ${process.env.PYTHON_WHISPER_URL} (+ OpenAI option)`
    : "OpenAI Whisper only (PYTHON_WHISPER_URL not set)";
  const db = process.env.DATABASE_URL
    ? "on — MongoDB"
    : "off — History persists in the browser only";

  console.log(
    [
      "",
      "┌─ EazyScan ────────────────────────────────────",
      `│ LLM analyze : ${llmStartupInfo()}`,
      `│ STT default : ${stt}`,
      `│ Database    : ${db}`,
      "└───────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}
