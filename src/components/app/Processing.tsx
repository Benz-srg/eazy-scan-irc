"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { Icon, Card, Tag, Btn } from "@/components/ui/primitives";
import { TopBar } from "@/components/app/AppShell";
import {
  sessionAtom,
  historyAtom,
  providerAtom,
  apiKeyAtom,
} from "@/lib/atoms";
import { runAnalysis, type StageKey } from "@/lib/analyze-client";
import {
  estimateTotalSec,
  estimateLlmSec,
  fmtClock,
  fmtRemain,
} from "@/lib/estimate";
import { invalidate } from "@/lib/swr";
import { useIsMobile } from "@/lib/useMediaQuery";
import type { Analysis, HistoryItem } from "@/lib/types";

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
  const session = useAtomValue(sessionAtom);
  const provider = useAtomValue(providerAtom);
  const apiKey = useAtomValue(apiKeyAtom);
  const setSession = useSetAtom(sessionAtom);
  const setHistory = useSetAtom(historyAtom);
  const isMobile = useIsMobile();
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
  const [error, setError] = useState<string | null>(null);
  // ETA: anchored to the REAL transcribe-start event (a queued job hasn't begun
  // computing yet, so counting from mount would lie), then re-tightened to the
  // LLM-only estimate once STT actually finishes. null = no clock yet.
  const [finishAt, setFinishAt] = useState<number | null>(null);
  const [queued, setQueued] = useState(false);

  const startedRef = useRef(false);
  const navigatedRef = useRef(false);
  const activeStartRef = useRef(0);
  // id of the optimistic "processing" row we add to History up front, so the
  // job is visible there even with no DB (graceful degradation); reconciled to
  // the final row on done/error.
  const clientIdRef = useRef("");

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
    // flip the optimistic History row to "error" (no-DB visibility)
    const markClientError = () =>
      setHistory((prev) =>
        prev.map((h) =>
          h.id === clientIdRef.current
            ? { ...h, status: "error", client: "ผิดพลาด", tag: "Error" }
            : h,
        ),
      );

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
            setTimeout(() => {
              if (window.location.pathname === "/processing")
                router.push("/results/sample");
            }, 600);
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

    // add an optimistic "processing" row to History immediately, so the job is
    // visible there even if the user leaves and even with no DB.
    const clientId = crypto.randomUUID();
    clientIdRef.current = clientId;
    setHistory((prev) => [
      {
        id: clientId,
        title: audioName.replace(/\.[^.]+$/, ""),
        client: "กำลังประมวลผล…",
        audio: audioName,
        audioUrl: session.audioUrl ?? undefined,
        date: THAI_DATE.format(new Date()),
        mandayMin: 0,
        mandayMax: 0,
        features: 0,
        tag: "Processing",
        status: "processing",
        estFinishAt:
          session.durationSec > 0
            ? new Date(
                Date.now() + estimateTotalSec(session.durationSec, provider) * 1000,
              ).toISOString()
            : undefined,
      },
      ...prev.filter((h) => h.id !== clientId),
    ]);

    runAnalysis(
      {
        audioBlob: session.audioBlob,
        audioName: session.audioName,
        provider,
        apiKey,
        durationSec: session.durationSec,
      },
      (ev) => {
        if (ev.type === "queue") {
          setQueued(true);
          return;
        }
        if (ev.type !== "stage") return;
        if (ev.state === "start") {
          setQueued(false);
          markStart(ev.key);
          // anchor the ETA when STT compute actually begins (not at mount —
          // the job may have waited in the queue). Need a known duration.
          if (ev.key === "transcribe" && session.durationSec > 0)
            setFinishAt(
              Date.now() + estimateTotalSec(session.durationSec, provider) * 1000,
            );
        } else {
          markDone(ev.key, ev.ms);
          if (ev.key === "transcribe") {
            if ("preview" in ev && ev.preview) setPreview(ev.preview);
            // STT done → remaining is the LLM stage only (valid even if the
            // upload's duration never resolved)
            setFinishAt(Date.now() + (estimateLlmSec(session.durationSec) + 3) * 1000);
          }
          if (ev.key === "analyze") setFinishAt(Date.now() + 3000);
        }
      },
    )
      .then((out) => {
        if (navigatedRef.current) return;

        // real audio failed → show the error, never fake a sample result
        if (out.source === "error" || !out.analysis) {
          setActiveKey(null);
          setError(out.error ?? "วิเคราะห์ไม่สำเร็จ");
          markClientError();
          invalidate("projects"); // surface the error row in History too
          return;
        }

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
        setSession((s) => ({
          ...s,
          analysis: a,
          transcript: out.transcript ?? s.transcript,
        }));
        const item: HistoryItem = {
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
          durationMs: out.timing
            ? out.timing.sttMs + out.timing.llmMs
            : undefined,
        };
        setHistory((prev) => [
          item,
          ...prev.filter((h) => h.id !== id && h.id !== clientIdRef.current),
        ]);
        invalidate("projects"); // fresh History after a new run
        // only auto-open results if the user is STILL waiting here — if they
        // left (the job kept running server-side), don't yank them back later.
        setTimeout(() => {
          if (window.location.pathname === "/processing")
            router.push(`/results/${id}`);
        }, 700);
      })
      .catch((e) => {
        if (navigatedRef.current) return;
        setActiveKey(null);
        setError(e instanceof Error ? e.message : "วิเคราะห์ไม่สำเร็จ");
        markClientError();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = STAGES.filter((s) => states[s.key] === "done").length;
  const pct = Math.round((doneCount / STAGES.length) * 100);
  const C = 2 * Math.PI * 42;

  const isLlmError = !!error && /LLM/.test(error);
  const isSttError = !!error && /STT/.test(error);
  const errTitle = isSttError
    ? "ถอดเสียงไม่สำเร็จ"
    : isLlmError
      ? "เชื่อมต่อ AI วิเคราะห์ไม่ได้"
      : "วิเคราะห์ไม่สำเร็จ";

  if (error) {
    return (
      <>
        <TopBar
          title={errTitle}
          sub={audioName}
          right={
            <Tag color="var(--rose)" bg="var(--rose-soft)" icon="triangle-alert">
              ผิดพลาด
            </Tag>
          }
        />
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "32px 12px" : "60px 24px" }}>
          <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "var(--rose-soft)",
                color: "var(--rose)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <Icon name="triangle-alert" size={34} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{errTitle}</h2>
            <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8, lineHeight: 1.65 }}>
              {isSttError
                ? "แปลงเสียงเป็นข้อความ (STT) ไม่สำเร็จ จึงยังไม่ได้เริ่มวิเคราะห์ — ดูรายละเอียดและวิธีแก้ด้านล่าง"
                : isLlmError
                  ? "ระบบถอดเสียงสำเร็จ แต่เชื่อมต่อเครื่องมือวิเคราะห์ AI (LLM) ไม่ได้ จึงยังไม่ได้ผลลัพธ์"
                  : "ระบบถอดเสียง/วิเคราะห์มีปัญหา จึงยังไม่ได้ผลลัพธ์จริง (ระบบจะไม่แสดงข้อมูลตัวอย่างแทน เพื่อไม่ให้เข้าใจผิด)"}
            </p>
            <div
              className="mono"
              style={{
                marginTop: 14,
                padding: "12px 14px",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                fontSize: 12.5,
                color: "var(--ink-2)",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              {error}
            </div>
            <div style={{ marginTop: 16, fontSize: 13.5, color: "var(--faint)", textAlign: "left", lineHeight: 1.7 }}>
              ตรวจสอบ: STT พร้อมไหม (Local Whisper ที่ :8000 หรือ OpenAI key) · เครื่องมือ
              วิเคราะห์พร้อมไหม (Claude CLI ล็อกอิน หรือ API key) — ดู README
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
              <Btn icon="rotate-cw" onClick={() => router.push("/workspace")}>
                ลองใหม่
              </Btn>
              <Btn variant="ghost" icon="history" onClick={() => router.push("/history")}>
                ดูประวัติ
              </Btn>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="กำลังวิเคราะห์"
        sub={audioName}
        right={
          done ? (
            <Tag color="var(--green)" bg="var(--green-soft)" icon="circle-check">
              เสร็จสิ้น
            </Tag>
          ) : (
            <Tag color="var(--amber)" bg="var(--amber-soft)" icon="sparkles">
              AI กำลังทำงาน
            </Tag>
          )
        }
      />
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "22px 10px 56px" : "36px 24px 60px" }}>
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
            {!done && !error && session.audioBlob && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: queued ? "var(--amber)" : "var(--brand-ink)",
                  background: queued ? "var(--amber-soft)" : "var(--brand-soft)",
                }}
              >
                <Icon
                  name={queued ? "loader-circle" : "clock"}
                  size={15}
                  className={queued ? "spin" : ""}
                />
                {queued ? (
                  "รอคิวประมวลผล — จะเริ่มเมื่อมีช่องว่าง"
                ) : finishAt ? (
                  <span>
                    คาดว่าเสร็จ ~{fmtClock(new Date(finishAt))}{" "}
                    <span style={{ color: "var(--faint)", fontWeight: 500 }}>
                      · เหลือ {fmtRemain((finishAt - Date.now()) / 1000)}
                    </span>
                  </span>
                ) : (
                  "กำลังเริ่มประมวลผล…"
                )}
              </div>
            )}
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
