import { readAudio } from "@/lib/server/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const file = await readAudio(filename);
  if (!file) return new Response("Not found", { status: 404 });
  // filename is allowlist-validated (uuid.ext); encode for the header regardless
  const safe = encodeURIComponent(filename);
  return new Response(new Uint8Array(file.buf), {
    headers: {
      "content-type": file.type, // pinned to an audio/* type by readAudio
      "cache-control": "private, max-age=3600",
      // force download (never render inline) + block content sniffing
      "content-disposition": `attachment; filename="${safe}"; filename*=UTF-8''${safe}`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
