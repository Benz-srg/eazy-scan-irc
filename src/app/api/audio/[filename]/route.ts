import { readAudio } from "@/lib/server/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const file = await readAudio(filename);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.buf), {
    headers: {
      "content-type": file.type,
      "cache-control": "private, max-age=3600",
      "content-disposition": `inline; filename="${filename}"`,
    },
  });
}
