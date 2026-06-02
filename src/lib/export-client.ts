"use client";

import type { Analysis } from "./types";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) =>
  s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
  "eazyscan";

export async function exportDoc(fmt: string, a: Analysis): Promise<void> {
  const base = slug(a.title);

  if (fmt === "json") {
    download(
      new Blob([JSON.stringify(a, null, 2)], { type: "application/json" }),
      `${base}.json`,
    );
    return;
  }

  try {
    const res = await fetch(`/api/export/${fmt}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(a),
    });
    if (!res.ok) throw new Error(`export ${fmt} failed`);
    const blob = await res.blob();
    const ext = fmt === "docx" ? "docx" : "pdf";
    download(blob, `${base}.${ext}`);
  } catch {
    // fallback so the button never dead-ends before the export API exists
    download(
      new Blob([JSON.stringify(a, null, 2)], { type: "application/json" }),
      `${base}.json`,
    );
  }
}
