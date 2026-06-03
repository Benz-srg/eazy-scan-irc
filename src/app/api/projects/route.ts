import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

const THAI_DATE = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ items: [] });
  try {
    const rows = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      client: r.client,
      audio: r.audioName,
      audioUrl: r.audioPath ? `/api/audio/${r.audioPath}` : undefined,
      date: THAI_DATE.format(r.createdAt),
      mandayMin: r.mandayMin,
      mandayMax: r.mandayMax,
      features: r.features,
      tag: r.tag,
      status: r.status,
      estFinishAt:
        r.status === "processing" ? r.estFinishAt?.toISOString() : undefined,
      durationMs: r.durationMs ?? undefined,
    }));
    return NextResponse.json(
      { items },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ items: [] });
  }
}
