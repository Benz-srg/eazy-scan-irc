import "server-only";
import OpenAI from "openai";

export type TranscribeOpts = {
  provider: "local" | "openai";
  apiKey?: string;
  filename: string;
};

/**
 * Speech-to-text.
 * - openai: OpenAI Whisper (whisper-1), key from request or env.
 * - local : delegates to a Python FastAPI Whisper service (PYTHON_WHISPER_URL).
 * Throws on misconfiguration so the caller can fall back cleanly.
 */
export async function transcribe(
  audio: Blob,
  opts: TranscribeOpts,
): Promise<string> {
  if (opts.provider === "openai") {
    const key = opts.apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error("missing OpenAI API key");
    const client = new OpenAI({ apiKey: key });
    const file = new File([audio], opts.filename || "audio.webm", {
      type: audio.type || "audio/webm",
    });
    const res = await client.audio.transcriptions.create({
      file,
      model: process.env.OPENAI_STT_MODEL || "whisper-1",
      language: "th",
      // biases vocabulary toward Thai requirement context (parity with local
      // Whisper's initial_prompt) — reduces code-switching Thai words to English
      prompt:
        process.env.WHISPER_INITIAL_PROMPT ||
        "นี่คือบันทึกการประชุมเก็บความต้องการของลูกค้าเป็นภาษาไทย พูดถึงธุรกิจ ร้านค้า ทำเล สินค้า ระบบงาน และการให้บริการ เช่น หมูปิ้ง ร้านกาแฟ คลินิก ออเดอร์ สต็อก แดชบอร์ด",
      temperature: 0,
    });
    return res.text;
  }

  // local Python Whisper service
  const url = process.env.PYTHON_WHISPER_URL;
  if (!url) throw new Error("PYTHON_WHISPER_URL not configured");
  const fd = new FormData();
  fd.append("file", audio, opts.filename || "audio.webm");
  const res = await fetch(`${url.replace(/\/$/, "")}/transcribe`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`local whisper failed: ${res.status}`);
  const json = (await res.json()) as { text: string };
  return json.text;
}
