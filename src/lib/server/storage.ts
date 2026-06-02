import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function extFor(name: string, type: string): string {
  const fromName = path.extname(name).replace(".", "");
  if (fromName) return fromName;
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4") || type.includes("m4a")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

export type StoredAudio = { id: string; filename: string; url: string };

/** Persists the audio to ./uploads and returns an id + served URL. */
export async function saveAudio(
  audio: Blob,
  originalName: string,
): Promise<StoredAudio> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const ext = extFor(originalName, audio.type);
  const filename = `${id}.${ext}`;
  const buf = Buffer.from(await audio.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
  return { id, filename, url: `/api/audio/${filename}` };
}

export async function readAudio(
  filename: string,
): Promise<{ buf: Buffer; type: string } | null> {
  // guard against path traversal — only a bare filename is allowed
  if (filename.includes("/") || filename.includes("..")) return null;
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, filename));
    const ext = path.extname(filename).replace(".", "");
    const type =
      ext === "mp3"
        ? "audio/mpeg"
        : ext === "wav"
          ? "audio/wav"
          : ext === "m4a"
            ? "audio/mp4"
            : ext === "ogg"
              ? "audio/ogg"
              : "audio/webm";
    return { buf, type };
  } catch {
    return null;
  }
}
