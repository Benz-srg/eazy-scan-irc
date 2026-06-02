"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Card, Tag } from "@/components/ui/primitives";
import { TopBar } from "@/components/app/AppShell";
import { store, useStore } from "@/lib/store";
import { runAnalysis, type StageKey } from "@/lib/analyze-client";
import { invalidate } from "@/lib/swr";
import type { Analysis } from "@/lib/types";

type StageDef = { key: StageKey; t: string; d: string; icon: string };

const STAGES: StageDef[] = [
  { key: "upload", t: "รับไฟล์เสียง", d: "อัปโหลดไฟล์เข้าระบบ", icon: "upload-cloud" },
  { key: "transcribe", t: "ถอดเสียงเป็นข้อความ", d: "แปลงเสียงด้วย Whisper (STT)", icon: "file-text" },
  { key: "analyze", t: "วิเคราะห์ด้วย AI", d: "สกัด SOW · ประเมิน Manday · ความเสี่ยง · คำถาม", icon: "brain" },
  { key: "finalize", t: "บันทึกและสร้างรายงาน", d: "เก็บผลและไฟล์เสียง", icon: "file-check" },
];

type StageState = "pending" | "active" | "done";

const THAI_DATE = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function fmtMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function Processing() {
  const router = useRouter();
  const session = useStore((s) => s.session);
  const audioName = session.audioName || "Requirement.m4a";

  const [states, setStates] = useState<Record<StageKey, StageState>>({
    upload: "pending",
    transcribe: "pending",
    analyze: "pending",
    finalize: "pending",
  });
  const [durations, setDurations] = useState<Partial<Record<StageKey, number>>>({});
  const [activeKey, setActiveKey] = useState<StageKey | null>(null);
  const [elapsed, setElapsed] = useState(0); // live seconds for active stage
  const [preview, setPreview] = useState<string>("");
  const [done, setDone] = useState(false);

  const startedRef = useRef(false);
  const navigatedRef = useRef(false);
  const activeStartRef = useRef(0);

  // live ticking timer for the active stage
  useEffect(() => {
    if (!activeKey || done) return;
    activeStartRef.current = performance.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed((performance.now() - activeStartRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [activeKey, done]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const markStart = (key: StageKey) => {
      setActiveKey(key);
      setStates((s) => ({ ...s, [key]: "active" }));
    };
    const markDone = (key: StageKey, ms: number) => {
      setStates((s) => ({ ...s, [key]: "done" }));
      setDurations((d) => ({ ...d, [key]: ms }));
    };

    // Demo path (no audio): run a brief animated sequence then show the sample.
    if (!session.audioBlob) {
      let i = 0;
      const tick = () => {
        if (i > 0) markDone(STAGES[i - 1].key, 400 + i * 150);
        if (i >= STAGES.length) {
          setActiveKey(null);
          setDone(true);
          if (!navigatedRef.current) {
            navigatedRef.current = true;
            setTimeout(() => router.push("/results/sample"), 600);
          }
          return;
        }
        markStart(STAGES[i].key);
        i += 1;
        setTimeout(tick, 650);
      };
      tick();
      return;
    }

    runAnalysis(
      {
        audioBlob: session.audioBlob,
        audioName: session.audioName,
        provider: session.provider,
        apiKey: session.apiKey,
        depth: session.depth,
      },
      (ev) => {
        if (ev.type !== "stage") return;
        if (ev.state === "start") markStart(ev.key);
        else {
          markDone(ev.key, ev.ms);
          if (ev.key === "transcribe" && "preview" in ev && ev.preview)
            setPreview(ev.preview);
        }
      },
    )
      .then((out) => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        setActiveKey(null);
        setStates({
          upload: "done",
          transcribe: "done",
          analyze: "done",
          finalize: "done",
        });
        setDone(true);

        const a: Analysis = out.analysis;
        const id = out.id ?? crypto.randomUUID();
        store.setAnalysis(a);
        if (out.transcript) store.setSession({ transcript: out.transcript });
        store.addHistory({
          id,
          title: a.title,
          client: a.client,
          audio: audioName,
          audioUrl: out.audioUrl ?? session.audioUrl ?? undefined,
          date: THAI_DATE.format(new Date()),
          mandayMin: a.mandayMin,
          mandayMax: a.mandayMax,
          features: a.features.length,
          tag: a.integrations[0]?.cat ?? "Project",
        });
        invalidate("projects"); // fresh History after a new run
        setTimeout(() => router.push(`/results/${id}`), 700);
      })
      .catch(() => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        router.push("/results/sample");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = STAGES.filter((s) => states[s.key] === "done").length;
  const pct = Math.round((doneCount / STAGES.length) * 100);
  const C = 2 * Math.PI * 42;

  return (
    <>
      <TopBar
        title="กำลังวิเคราะห์"
        sub={audioName}
        right={
          <Tag color="var(--brand-ink)" bg="var(--brand-soft)" icon="sparkles">
            {done ? "เสร็จสิ้น" : "AI กำลังทำงาน"}
          </Tag>
        }
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 24px 60px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 18px" }}>
              <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="48" cy="48" r="42" fill="none" stroke="var(--line)" strokeWidth="7" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="url(#pg)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1)" }}
                />
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done ? (
                  <Icon name="check" size={36} style={{ color: "var(--green)" }} />
                ) : (
                  <span style={{ fontSize: 24, fontWeight: 800 }}>
                    {pct}
                    <span style={{ fontSize: 14 }}>%</span>
                  </span>
                )}
              </div>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>
              {done ? "วิเคราะห์เสร็จสมบูรณ์" : "AI กำลังวิเคราะห์ Requirement"}
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 6 }}>
              {done
                ? "กำลังเปิดผลการวิเคราะห์ของคุณ…"
                : "ระบบทำงานตามขั้นตอนจริง — เวลาที่ใช้แต่ละขั้นแสดงด้านล่าง"}
            </p>
          </div>

          <Card pad={10} style={{ overflow: "hidden" }}>
            {STAGES.map((s, i) => {
              const state = states[s.key];
              const isActive = state === "active";
              const liveSec = isActive ? elapsed : undefined;
              const finalMs = durations[s.key];
              return (
                <div key={s.key}>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "14px 14px",
                      alignItems: "flex-start",
                      opacity: state === "pending" ? 0.5 : 1,
                      transition: "opacity .3s",
                    }}
                  >
                    <div style={{ position: "relative", flex: "none" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background:
                            state === "done"
                              ? "var(--green-soft)"
                              : isActive
                                ? "var(--brand)"
                                : "var(--surface-2)",
                          color:
                            state === "done"
                              ? "var(--green)"
                              : isActive
                                ? "#fff"
                                : "var(--faint)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: state === "pending" ? "1px solid var(--line)" : "none",
                          transition: "all .3s",
                          boxShadow: isActive ? "0 6px 16px rgba(99,102,241,.3)" : "none",
                        }}
                      >
                        {state === "done" ? (
                          <Icon name="check" size={20} />
                        ) : isActive ? (
                          <Icon name="loader-circle" size={20} className="spin" />
                        ) : (
                          <Icon name={s.icon} size={19} />
                        )}
                      </div>
                      {i < STAGES.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: 44,
                            width: 2,
                            height: 20,
                            transform: "translateX(-50%)",
                            background: state === "done" ? "var(--green)" : "var(--line)",
                            transition: "background .3s",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingTop: 2, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 15.5, fontWeight: state === "pending" ? 500 : 700 }}>
                          {s.t}
                        </span>
                        {isActive && (
                          <Tag size={11} color="var(--brand-ink)" bg="var(--brand-soft)">
                            กำลังทำงาน
                          </Tag>
                        )}
                        <div style={{ flex: 1 }} />
                        {/* real elapsed time */}
                        {isActive && liveSec !== undefined && (
                          <span
                            className="mono"
                            style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-ink)" }}
                          >
                            {liveSec.toFixed(1)}s
                          </span>
                        )}
                        {state === "done" && finalMs !== undefined && (
                          <span
                            className="mono"
                            style={{ fontSize: 12.5, color: "var(--faint)" }}
                          >
                            {fmtMs(finalMs)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>
                        {s.d}
                      </div>
                      {s.key === "transcribe" && preview && (
                        <div
                          className="fadeUp"
                          style={{
                            marginTop: 10,
                            padding: 14,
                            background: "var(--surface-2)",
                            border: "1px solid var(--line-2)",
                            borderRadius: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "var(--faint)",
                              letterSpacing: "0.04em",
                              marginBottom: 6,
                            }}
                          >
                            ตัวอย่างข้อความที่ถอดได้
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--ink-2)",
                              lineHeight: 1.7,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {preview}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </>
  );
}
