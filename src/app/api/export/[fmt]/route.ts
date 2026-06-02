import { NextResponse } from "next/server";
import { AnalysisSchema } from "@/lib/types";
import { buildDocx, buildPdf } from "@/lib/server/export";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ fmt: string }> },
) {
  const { fmt } = await params;
  const parsed = AnalysisSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลวิเคราะห์ไม่ถูกต้อง" }, { status: 400 });
  }
  const a = parsed.data;

  try {
    if (fmt === "docx") {
      const buf = await buildDocx(a);
      return new Response(new Uint8Array(buf), {
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "content-disposition": `attachment; filename="estimate.docx"`,
        },
      });
    }
    if (fmt === "pdf") {
      const buf = await buildPdf(a);
      return new Response(new Uint8Array(buf), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="estimate.pdf"`,
        },
      });
    }
    return NextResponse.json({ error: "รูปแบบไม่รองรับ" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ส่งออกไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
