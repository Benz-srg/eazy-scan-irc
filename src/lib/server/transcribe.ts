import "server-only";
import OpenAI from "openai";

export type TranscribeOpts = {
  provider: "local" | "openai";
  apiKey?: string;
  filename: string;
};

/** Raised on a speech-to-text failure, with a clear user-facing message. */
export class SttError extends Error {
  constructor(
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = "SttError";
  }
}

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
    if (!key)
      throw new SttError(
        "ยังไม่ได้ใส่ OpenAI API key สำหรับถอดเสียง (STT) — ใส่ใน ตั้งค่า หรือสลับเป็น Local Whisper",
      );
    const client = new OpenAI({ apiKey: key });
    const file = new File([audio], opts.filename || "audio.webm", {
      type: audio.type || "audio/webm",
    });
    try {
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
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error("[transcribe] OpenAI Whisper failed:", detail);
      const badKey =
        /401|invalid.*api key|incorrect api key|authentication|unauthorized/i.test(
          detail,
        );
      throw new SttError(
        badKey
          ? "OpenAI API key สำหรับถอดเสียง (STT) ไม่ถูกต้อง — แก้ใน ตั้งค่า หรือสลับเป็น Local Whisper"
          : "ถอดเสียงด้วย OpenAI Whisper (STT) ไม่สำเร็จ — ลองใหม่ หรือสลับเป็น Local Whisper",
        detail,
      );
    }
  }

  // local Python Whisper service
  const url = process.env.PYTHON_WHISPER_URL;
  if (!url)
    throw new SttError(
      "ยังไม่ได้ตั้งค่า Local Whisper (PYTHON_WHISPER_URL) สำหรับถอดเสียง (STT)",
    );
  const fd = new FormData();
  fd.append("file", audio, opts.filename || "audio.webm");
  let res: Response;
  try {
    res = await fetch(`${url.replace(/\/$/, "")}/transcribe`, {
      method: "POST",
      body: fd,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[transcribe] Local Whisper unreachable:", detail);
    throw new SttError(
      `เชื่อมต่อ Local Whisper (STT) ไม่ได้ที่ ${url} — ตรวจว่า service รันอยู่ (พอร์ต 8000) หรือสลับเป็น OpenAI Whisper`,
      detail,
    );
  }
  if (!res.ok)
    throw new SttError(
      `Local Whisper (STT) ถอดเสียงไม่สำเร็จ (HTTP ${res.status}) — ตรวจ service ที่ ${url}`,
    );
  const json = (await res.json()) as { text: string };
  return json.text;
}
