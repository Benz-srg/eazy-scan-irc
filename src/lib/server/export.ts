import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Analysis } from "@/lib/types";

const FONT = "Noto Sans Thai";

/* ------------------------------- DOCX ------------------------------- */

function p(text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: (opts.size ?? 11) * 2, // docx uses half-points
        font: FONT,
        color: opts.color,
      }),
    ],
    spacing: { after: 120 },
  });
}

function cell(
  text: string,
  opts: {
    bold?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    width?: number;
  } = {},
) {
  return new TableCell({
    width:
      opts.width !== undefined
        ? { size: opts.width, type: WidthType.DXA }
        : undefined,
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [new TextRun({ text, bold: opts.bold, font: FONT, size: 20 })],
      }),
    ],
  });
}

// usable A4 width minus 1" margins ≈ 9026 twips
const SOW_COLS = [2400, 5226, 1400];
const MANDAY_COLS = [3000, 4626, 1400];

export async function buildDocx(a: Analysis): Promise<Buffer> {
  const totMin = a.manday.reduce((s, m) => s + m.min, 0);
  const totMax = a.manday.reduce((s, m) => s + m.max, 0);

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: a.title, font: FONT, bold: true, size: 36 })],
          }),
          p(`ลูกค้า: ${a.client}`, { color: "6f6f86" }),
          p(`ประเมินรวม: ${a.mandayMin}–${a.mandayMax} Manday · ความมั่นใจ ${a.confidence}%`, {
            bold: true,
            color: "4f46e5",
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "สรุปสำหรับผู้บริหาร", font: FONT, bold: true, size: 26 })],
          }),
          p(a.summary.overview),
          p("เป้าหมายหลัก", { bold: true }),
          ...a.summary.goals.map((g) => p(`•  ${g}`)),
          p(`ขนาดโครงการ: ${a.summary.scale}`),
          p(`ระยะเวลาโดยประมาณ: ${a.summary.timeline}`),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "Scope of Work (ฟีเจอร์)", font: FONT, bold: true, size: 26 })],
          }),
          new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: SOW_COLS,
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  cell("ฟีเจอร์", { bold: true, width: SOW_COLS[0] }),
                  cell("รายละเอียด", { bold: true, width: SOW_COLS[1] }),
                  cell("ประเมิน", { bold: true, width: SOW_COLS[2] }),
                ],
              }),
              ...a.features.map(
                (f) =>
                  new TableRow({
                    children: [
                      cell(f.name, { bold: true, width: SOW_COLS[0] }),
                      cell(f.desc, { width: SOW_COLS[1] }),
                      cell(f.est, { width: SOW_COLS[2] }),
                    ],
                  }),
              ),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "ตารางประเมิน Manday", font: FONT, bold: true, size: 26 })],
          }),
          new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: MANDAY_COLS,
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  cell("โมดูล", { bold: true, width: MANDAY_COLS[0] }),
                  cell("หมายเหตุ", { bold: true, width: MANDAY_COLS[1] }),
                  cell("Manday", { bold: true, align: AlignmentType.RIGHT, width: MANDAY_COLS[2] }),
                ],
              }),
              ...a.manday.map(
                (m) =>
                  new TableRow({
                    children: [
                      cell(m.module, { width: MANDAY_COLS[0] }),
                      cell(m.note, { width: MANDAY_COLS[1] }),
                      cell(`${m.min}–${m.max}`, {
                        align: AlignmentType.RIGHT,
                        width: MANDAY_COLS[2],
                      }),
                    ],
                  }),
              ),
              new TableRow({
                children: [
                  cell("รวมทั้งโครงการ", { bold: true, width: MANDAY_COLS[0] }),
                  cell("", { width: MANDAY_COLS[1] }),
                  cell(`${totMin}–${totMax}`, {
                    bold: true,
                    align: AlignmentType.RIGHT,
                    width: MANDAY_COLS[2],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "ความเสี่ยง", font: FONT, bold: true, size: 26 })],
          }),
          ...a.risks.map((r) => p(`•  [${r.level}] ${r.title} — ${r.desc}`)),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "สมมติฐาน", font: FONT, bold: true, size: 26 })],
          }),
          ...a.assumptions.map((s) => p(`•  ${s}`)),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "ข้อมูลที่ยังขาด & คำถามที่ควรถามลูกค้า", font: FONT, bold: true, size: 26 })],
          }),
          ...a.missing.map((m) => p(`•  ${m.q}  (${m.why})`)),
          ...a.questions.map((q) => p(`•  ${q}`)),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/* -------------------------------- PDF -------------------------------- */

let cachedFont: Buffer | null = null;
async function thaiFont(): Promise<Buffer> {
  if (cachedFont) return cachedFont;
  cachedFont = await fs.readFile(
    path.join(process.cwd(), "src/lib/server/assets/NotoSansThai-Regular.ttf"),
  );
  return cachedFont;
}

export async function buildPdf(a: Analysis): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await thaiFont(), { subset: true });

  const margin = 48;
  const width = 595.28; // A4
  const height = 841.89;
  const maxW = width - margin * 2;
  const ink = rgb(0.09, 0.09, 0.14);
  const brand = rgb(0.31, 0.31, 0.86);
  const muted = rgb(0.44, 0.44, 0.53);

  let page = pdf.addPage([width, height]);
  let y = height - margin;

  const wrap = (text: string, size: number): string[] => {
    const lines: string[] = [];
    let cur = "";
    for (const ch of Array.from(text)) {
      const next = cur + ch;
      if (font.widthOfTextAtSize(next, size) > maxW) {
        if (cur) lines.push(cur);
        cur = ch;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  };

  const draw = (
    text: string,
    size: number,
    color = ink,
    gap = 6,
    indent = 0,
  ) => {
    for (const line of wrap(text, size)) {
      if (y < margin + 40) {
        page = pdf.addPage([width, height]);
        y = height - margin;
      }
      page.drawText(line, { x: margin + indent, y, size, font, color });
      y -= size + gap;
    }
  };

  draw(a.title, 20, ink, 8);
  draw(`ลูกค้า: ${a.client}`, 11, muted, 4);
  draw(
    `ประเมินรวม ${a.mandayMin}–${a.mandayMax} Manday · ความมั่นใจ ${a.confidence}%`,
    13,
    brand,
    14,
  );

  draw("สรุปสำหรับผู้บริหาร", 14, ink, 8);
  draw(a.summary.overview, 11, ink, 10);

  draw("ตารางประเมิน Manday", 14, ink, 8);
  const totMin = a.manday.reduce((s, m) => s + m.min, 0);
  const totMax = a.manday.reduce((s, m) => s + m.max, 0);
  for (const m of a.manday) {
    draw(`• ${m.module}  —  ${m.min}–${m.max} วัน`, 11, ink, 3);
    draw(`   ${m.note}`, 9, muted, 5);
  }
  draw(`รวมทั้งโครงการ: ${totMin}–${totMax} วัน`, 12, brand, 14);

  draw("ฟีเจอร์ (Scope of Work)", 14, ink, 8);
  for (const f of a.features) {
    draw(`• ${f.name} (${f.est}) — ${f.desc}`, 10, ink, 6);
  }

  draw("ความเสี่ยง", 14, ink, 8);
  for (const r of a.risks) draw(`• [${r.level}] ${r.title}`, 10, ink, 5);

  draw("คำถามที่ควรถามลูกค้า", 14, ink, 8);
  for (const q of a.questions) draw(`• ${q}`, 10, ink, 5);

  return Buffer.from(await pdf.save());
}
