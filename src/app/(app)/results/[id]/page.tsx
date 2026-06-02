"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Results } from "@/components/app/Results";
import { TopBar } from "@/components/app/AppShell";
import { Icon, Btn } from "@/components/ui/primitives";
import { useAtomValue } from "jotai";
import { sessionAtom, historyAtom } from "@/lib/atoms";
import { SAMPLE_ANALYSIS, PROJECT } from "@/lib/sample-data";
import { AnalysisSchema, type Analysis } from "@/lib/types";

function fmtDuration(sec: number) {
  if (!sec || !Number.isFinite(sec)) return PROJECT.duration;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const session = useAtomValue(sessionAtom);
  const history = useAtomValue(historyAtom);

  const isSample = id === "sample";
  // the just-run analysis from the in-memory session (survives client nav)
  const fromSession = !isSample && session.analysis ? session.analysis : null;
  const histItem = !isSample ? history.find((h) => h.id === id) : undefined;

  // SAMPLE is ONLY for the explicit demo route. A real id never falls back to
  // mock data — it loads the real record or shows a not-found state.
  const [analysis, setAnalysis] = useState<Analysis | null>(
    isSample ? SAMPLE_ANALYSIS : fromSession,
  );
  const [loading, setLoading] = useState(!isSample && !fromSession);
  const [duration] = useState(
    fromSession ? fmtDuration(session.durationSec) : PROJECT.duration,
  );
  const [audioName, setAudioName] = useState(
    fromSession && session.audioName
      ? session.audioName
      : histItem?.audio ?? PROJECT.audioName,
  );
  const [audioUrl, setAudioUrl] = useState<string | undefined>(
    fromSession ? session.audioUrl ?? undefined : histItem?.audioUrl,
  );
  const [transcript, setTranscript] = useState<string | undefined>(
    fromSession ? session.transcript || undefined : undefined,
  );

  // for DB-backed records, hydrate by id (poll while processing)
  useEffect(() => {
    if (isSample || fromSession) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = () => {
      fetch(`/api/projects/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (!active) return;
          if (!json) {
            setLoading(false); // no DB / not found → not-found state (no mock)
            return;
          }
          if (json.audioName) setAudioName(json.audioName);
          if (json.audioUrl) setAudioUrl(json.audioUrl);
          if (json.transcript) setTranscript(json.transcript);
          const parsed = AnalysisSchema.safeParse(json.analysis);
          if (parsed.success) setAnalysis(parsed.data);
          if (json.status === "processing") {
            timer = setTimeout(load, 4000);
          } else {
            setLoading(false);
          }
        })
        .catch(() => active && setLoading(false));
    };
    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, isSample, fromSession]);

  if (analysis) {
    return (
      <Results
        analysis={analysis}
        id={id}
        duration={duration}
        audioName={audioName}
        audioUrl={audioUrl}
        transcript={transcript}
      />
    );
  }

  // loading or not-found — never a mock result
  return (
    <>
      <TopBar title="ผลการวิเคราะห์" sub={audioName} />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--muted)" }}>
            <Icon
              name="loader-circle"
              size={30}
              className="spin"
              style={{ color: "var(--brand-ink)" }}
            />
            <div style={{ marginTop: 12, fontSize: 15 }}>กำลังโหลดผลการวิเคราะห์…</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "var(--surface-2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Icon name="search-x" size={30} style={{ color: "var(--faint)" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>ไม่พบผลการวิเคราะห์นี้</h2>
            <p style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.65 }}>
              ข้อมูลอาจถูกลบ หรือยังไม่ได้เชื่อมฐานข้อมูล (ประวัติที่ไม่ได้บันทึกถาวร
              จะหายเมื่อรีเฟรช)
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
              <Btn icon="plus" onClick={() => router.push("/workspace")}>
                วิเคราะห์ใหม่
              </Btn>
              <Btn variant="ghost" icon="history" onClick={() => router.push("/history")}>
                ดูประวัติ
              </Btn>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
