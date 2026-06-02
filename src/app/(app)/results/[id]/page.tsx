"use client";

import { use, useEffect, useState } from "react";
import { Results } from "@/components/app/Results";
import { useStore } from "@/lib/store";
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
  const session = useStore((s) => s.session);
  const history = useStore((s) => s.history);

  // initial: the just-run session analysis, or the bundled sample
  const fromSession = id !== "sample" && session.analysis ? session.analysis : null;
  const histItem = id !== "sample" ? history.find((h) => h.id === id) : undefined;
  const [analysis, setAnalysis] = useState<Analysis>(fromSession ?? SAMPLE_ANALYSIS);
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

  // for DB-backed history items, hydrate the real record by id
  useEffect(() => {
    if (id === "sample" || fromSession) return;
    let active = true;
    fetch(`/api/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json) return;
        const parsed = AnalysisSchema.safeParse(json.analysis);
        if (parsed.success) {
          setAnalysis(parsed.data);
          if (json.audioName) setAudioName(json.audioName);
          if (json.audioUrl) setAudioUrl(json.audioUrl);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, fromSession]);

  return (
    <Results
      analysis={analysis}
      id={id}
      duration={duration}
      audioName={audioName}
      audioUrl={audioUrl}
    />
  );
}
