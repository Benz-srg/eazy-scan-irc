import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no database" }, { status: 404 });
  try {
    const row = await db.project.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({
      id: row.id,
      analysis: row.analysis,
      transcript: row.transcript,
      audioUrl: row.audioPath ? `/api/audio/${row.audioPath}` : undefined,
      audioName: row.audioName,
    });
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  if (!db) return NextResponse.json({ ok: true });
  try {
    await db.project.delete({ where: { id } });
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
