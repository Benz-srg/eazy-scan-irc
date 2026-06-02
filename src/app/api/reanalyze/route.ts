import { NextResponse } from "next/server";
import { analyzeTranscript } from "@/lib/server/analyze";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Re-runs LLM analysis on an existing transcript with a chosen engine/depth —
 * no re-transcription. Lets the user retry with a different AI if the first
 * result isn't satisfying. Updates the stored project when id + DB are present.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      transcript?: string;
      provider?: string; // overrides LLM_PROVIDER for this call
      depth?: "fast" | "deep";
      apiKey?: string;
      id?: string;
    };
    const transcript = (body.transcript || "").trim();
    if (!transcript) {
      return NextResponse.json({ error: "ไม่มี transcript" }, { status: 400 });
    }

    // engine override is passed explicitly (no global env mutation)
    const analysis = await analyzeTranscript(transcript, {
      apiKey: body.apiKey,
      depth: body.depth ?? "fast",
      provider: body.provider,
    });

    // update the stored record if we have an id + DB
    if (body.id) {
      const db = getDb();
      if (db) {
        // SECURITY (IDOR): this updates a project by id with no ownership check
        // because the app has no auth yet (single-user / guest mode). When auth
        // ships, scope every DB write by owner, e.g.
        //   where: { id: body.id, userId: session.user.id }
        // and return 403 when the caller is not the owner. Same applies to
        // /api/analyze (create) and /api/projects/[id] (delete).
        try {
          await db.project.update({
            where: { id: body.id },
            data: {
              title: analysis.title,
              client: analysis.client,
              confidence: Math.round(analysis.confidence),
              mandayMin: analysis.mandayMin,
              mandayMax: analysis.mandayMax,
              features: analysis.features.length,
              tag: analysis.integrations[0]?.cat ?? "Project",
              analysis,
            },
          });
        } catch {
          /* DB optional */
        }
      }
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "วิเคราะห์ใหม่ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
