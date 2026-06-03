"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Card, Tag } from "@/components/ui/primitives";
import { OpenAI } from "@/components/ui/logos";
import { TopBar } from "@/components/app/AppShell";
import { useAtom, useSetAtom } from "jotai";
import { useRecorder } from "@/lib/useRecorder";
import { PROJECT } from "@/lib/sample-data";
import { apiKeyAtom, providerAtom, sessionAtom, maskApiKey } from "@/lib/atoms";
import { useIsMobile } from "@/lib/useMediaQuery";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const BAR_COUNT = 56;

function Spectrum({ levels }: { levels: number[] }) {
  const bars =
    levels.length === BAR_COUNT
      ? levels
      : Array.from({ length: BAR_COUNT }, () => 0.08);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        height: 110,
        width: "100%",
      }}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: `${h * 100}%`,
            minHeight: 4,
            borderRadius: 4,
            background: "var(--grad)",
            transition: "height .08s linear",
            opacity: 0.5 + h * 0.5,
          }}
        />
      ))}
    </div>
  );
}

function PlaybackWave({ progress }: { progress: number }) {
  const heights = useRef(
    Array.from(
      { length: 80 },
      (_, i) => 0.2 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.3)) * 0.8,
    ),
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        height: 56,
        flex: 1,
      }}
    >
      {heights.current.map((h, i) => {
        const filled = i / heights.current.length <= progress;
        return (
          <span
            key={i}
            style={{
              flex: 1,
              height: `${h * 100}%`,
              borderRadius: 3,
              background: filled ? "var(--brand)" : "var(--line)",
              transition: "background .1s",
            }}
          />
        );
      })}
    </div>
  );
}

export function Workspace() {
  const router = useRouter();
  const rec = useRecorder(BAR_COUNT);
  const [name, setName] = useState(PROJECT.audioName);
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useAtom(providerAtom);
  const [savedKey, setSavedKey] = useAtom(apiKeyAtom); // persisted (localStorage)
  const setSession = useSetAtom(sessionAtom);
  const [draftKey, setDraftKey] = useState(""); // input buffer when entering
  const [editingKey, setEditingKey] = useState(false);
  const isMobile = useIsMobile();
  const [dragOver, setDragOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stage = rec.status;

  // mirror the shared key atom: show the masked saved key when one exists
  // (incl. when it was saved from Settings), the entry field when it doesn't.
  // Two-way sync so this page never gets stuck on an empty input.
  useEffect(() => {
    setEditingKey(!savedKey);
  }, [savedKey]);

  const commitKey = () => {
    const v = draftKey.trim();
    if (!v) return;
    setSavedKey(v); // atomWithStorage persists automatically
    setDraftKey("");
    setEditingKey(false);
  };
  const changeKey = () => {
    setDraftKey(savedKey);
    setEditingKey(true);
  };
  const removeKey = () => {
    setSavedKey(""); // clears localStorage via atom
    setDraftKey("");
    setEditingKey(true);
  };

  // playback driven by the real audio element when we have a url
  useEffect(() => {
    if (stage !== "recorded") {
      setPlaying(false);
      setProg(0);
    }
  }, [stage]);

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().catch(() => {});
      setPlaying(true);
    }
  };

  const onFile = (file?: File | null) => {
    if (!file) return;
    setName(file.name);
    rec.loadFile(file);
  };

  const downloadAudio = () => {
    if (!rec.url) return;
    let filename = name || "requirement";
    if (!/\.[a-z0-9]+$/i.test(filename)) {
      const t = rec.blob?.type || "";
      const ext = t.includes("mpeg")
        ? "mp3"
        : t.includes("wav")
          ? "wav"
          : t.includes("mp4") || t.includes("m4a")
            ? "m4a"
            : t.includes("ogg")
              ? "ogg"
              : "webm";
      filename = `${filename}.${ext}`;
    }
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const analyze = () => {
    // if user typed a key but didn't hit save, still use + persist it
    const key = editingKey && draftKey.trim() ? draftKey.trim() : savedKey;
    if (provider === "openai" && key && key !== savedKey) setSavedKey(key);
    setSession({
      audioBlob: rec.blob,
      audioUrl: rec.url,
      audioName: name,
      durationSec: rec.seconds,
      transcript: "",
      analysis: null,
    });
    router.push("/processing");
  };

  return (
    <>
      <TopBar
        title="พื้นที่ทำงาน"
        sub="อัปโหลดหรืออัดเสียง Requirement เพื่อเริ่มวิเคราะห์"
      />
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 10px 56px" : "32px 24px 60px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {stage === "idle" && (
            <div className="fadeUp">
              <div
                style={{
                  position: "relative",
                  textAlign: "center",
                  padding: "44px 24px 40px",
                  background: "var(--surface)",
                  borderRadius: "var(--r-xl)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--sh-md)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -80,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 460,
                    height: 320,
                    background:
                      "radial-gradient(ellipse, rgba(99,102,241,.12), transparent 65%)",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative" }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    เริ่มจากเสียงของลูกค้า
                  </h2>
                  <p
                    style={{
                      fontSize: 15.5,
                      color: "var(--muted)",
                      marginTop: 8,
                      marginBottom: 30,
                    }}
                  >
                    กดอัดเสียง หรืออัปโหลดไฟล์ที่บันทึกไว้
                  </p>
                  <button
                    onClick={() => rec.start()}
                    aria-label="เริ่มอัดเสียง"
                    style={{
                      position: "relative",
                      width: 116,
                      height: 116,
                      borderRadius: 99,
                      background: "var(--grad)",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "var(--sh-glow)",
                      transition: "transform .2s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 99,
                        border: "2px solid var(--brand)",
                        animation: "pulseRing 2.4s ease-out infinite",
                      }}
                    />
                    <Icon name="mic" size={46} />
                  </button>
                  <div
                    style={{ fontSize: 14, color: "var(--faint)", marginTop: 18 }}
                  >
                    คลิกเพื่อเริ่มอัดเสียง
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  margin: "26px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span
                  style={{ fontSize: 13.5, color: "var(--faint)", fontWeight: 600 }}
                >
                  หรือ
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,audio/*"
                hidden
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  fileInputRef.current?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onFile(e.dataTransfer.files?.[0]);
                }}
                style={{
                  border: `2px dashed ${dragOver ? "var(--brand)" : "var(--line)"}`,
                  borderRadius: "var(--r-lg)",
                  padding: "36px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "var(--brand-soft)" : "var(--surface-2)",
                  transition: "all .2s",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "var(--brand-soft)",
                    color: "var(--brand-ink)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <Icon name="upload-cloud" size={28} />
                </div>
                <div style={{ fontSize: 16.5, fontWeight: 700 }}>
                  ลากไฟล์เสียงมาวางที่นี่
                </div>
                <div
                  style={{ fontSize: 14, color: "var(--muted)", marginTop: 5 }}
                >
                  รองรับ .mp3 .wav .m4a · สูงสุด 100MB
                </div>
              </div>
            </div>
          )}

          {stage === "recording" && (
            <div
              className="fadeUp"
              style={{
                textAlign: "center",
                padding: "40px 24px",
                background: "var(--surface)",
                borderRadius: "var(--r-xl)",
                border: "1px solid var(--line)",
                boxShadow: "var(--sh-lg)",
              }}
            >
              <Tag color="var(--rose)" bg="var(--rose-soft)" icon="circle">
                <span style={{ animation: "fadeIn 1s ease-in-out infinite alternate" }}>
                  {rec.live ? "กำลังบันทึก" : "กำลังบันทึก (จำลอง)"}
                </span>
              </Tag>
              <div
                className="mono"
                style={{
                  fontSize: 44,
                  fontWeight: 500,
                  margin: "20px 0 6px",
                  letterSpacing: "0.02em",
                }}
              >
                {fmt(rec.seconds)}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>
                พูดได้เลย — เรากำลังฟังอยู่
              </div>
              <Spectrum levels={rec.levels} />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  marginTop: 30,
                }}
              >
                <Btn variant="ghost" icon="x" onClick={rec.reset}>
                  ยกเลิก
                </Btn>
                <Btn
                  variant="danger"
                  icon="square"
                  onClick={rec.stop}
                  style={{ background: "var(--rose)", color: "#fff" }}
                >
                  หยุดบันทึก
                </Btn>
              </div>
            </div>
          )}

          {stage === "recorded" && (
            <div className="fadeUp">
              {rec.url && (
                <audio
                  ref={audioElRef}
                  src={rec.url}
                  onTimeUpdate={(e) => {
                    const el = e.currentTarget;
                    if (el.duration)
                      setProg(Math.min(1, el.currentTime / el.duration));
                  }}
                  onEnded={() => {
                    setPlaying(false);
                    setProg(0);
                  }}
                  hidden
                />
              )}
              <Card pad={24} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      background: "var(--brand-soft)",
                      color: "var(--brand-ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <Icon name="file-audio" size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editing ? (
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setEditing(false)}
                        onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          padding: "4px 8px",
                          border: "1px solid var(--brand)",
                          borderRadius: 8,
                          width: "100%",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {name}
                        </span>
                        <button
                          onClick={() => setEditing(true)}
                          aria-label="เปลี่ยนชื่อไฟล์"
                          style={{ color: "var(--faint)", flex: "none" }}
                        >
                          <Icon name="pencil" size={15} />
                        </button>
                      </div>
                    )}
                    <div
                      style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}
                    >
                      {fmt(rec.seconds)} · บันทึกเมื่อสักครู่
                    </div>
                  </div>
                  <Tag color="var(--green)" bg="var(--green-soft)" icon="check-circle">
                    พร้อม
                  </Tag>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    background: "var(--surface-2)",
                    borderRadius: 14,
                    border: "1px solid var(--line-2)",
                  }}
                >
                  <button
                    onClick={togglePlay}
                    aria-label={playing ? "หยุดเล่น" : "เล่นเสียง"}
                    disabled={!rec.url}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 99,
                      background: "var(--grad)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                      boxShadow: "0 4px 12px rgba(99,102,241,.3)",
                      opacity: rec.url ? 1 : 0.5,
                    }}
                  >
                    <Icon name={playing ? "pause" : "play"} size={20} />
                  </button>
                  <PlaybackWave progress={prog} />
                  <span
                    className="mono"
                    style={{ fontSize: 13, color: "var(--muted)", flex: "none" }}
                  >
                    {fmt(prog * rec.seconds)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <Btn variant="ghost" size="sm" icon="pencil" onClick={() => setEditing(true)}>
                    เปลี่ยนชื่อ
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    icon="download"
                    onClick={downloadAudio}
                    disabled={!rec.url}
                  >
                    ดาวน์โหลด
                  </Btn>
                  <Btn variant="danger" size="sm" icon="trash-2" onClick={rec.reset}>
                    ลบ
                  </Btn>
                </div>
              </Card>

              <Card pad={22} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  เลือกบริการถอดเสียง
                </div>
                <p
                  style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}
                >
                  เลือกว่าจะถอดเสียงด้วยโมเดลในเครื่องหรือผ่าน OpenAI
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {(
                    [
                      { id: "local", t: "Local Whisper", d: "ฟรี · ประมวลผลในเครื่อง", icon: "cpu" },
                      { id: "openai", t: "OpenAI Whisper", d: "เร็วและแม่นยำกว่า", icon: "sparkles" },
                    ] as const
                  ).map((o) => {
                    const on = provider === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setProvider(o.id)}
                        style={{
                          textAlign: "left",
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: `1.5px solid ${on ? "var(--brand)" : "var(--line)"}`,
                          background: on ? "var(--brand-soft)" : "var(--surface)",
                          display: "flex",
                          gap: 11,
                          alignItems: "flex-start",
                          transition: "all .15s",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: on ? "var(--surface)" : "var(--surface-2)",
                            color: "var(--brand-ink)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "none",
                          }}
                        >
                          {o.id === "openai" ? (
                            <OpenAI style={{ width: 18, height: 18 }} />
                          ) : (
                            <Icon name={o.icon} size={18} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{o.t}</div>
                          <div
                            style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 1 }}
                          >
                            {o.d}
                          </div>
                        </div>
                        <Icon
                          name={on ? "check-circle-2" : "circle"}
                          size={18}
                          style={{ color: on ? "var(--brand)" : "var(--line)", flex: "none" }}
                        />
                      </button>
                    );
                  })}
                </div>
                {provider === "openai" && (
                  <div className="fadeUp" style={{ marginTop: 14 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      OpenAI API Key
                    </label>

                    {savedKey && !editingKey ? (
                      // saved state — masked, with change / remove
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          background: "var(--green-soft)",
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                        }}
                      >
                        <Icon name="badge-check" size={17} style={{ color: "var(--green)" }} />
                        <span className="mono" style={{ flex: 1, fontSize: 14, color: "var(--ink-2)" }}>
                          {maskApiKey(savedKey)}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                          จดจำในเครื่องนี้แล้ว
                        </span>
                        <button
                          onClick={changeKey}
                          style={{ color: "var(--brand-ink)", fontSize: 12.5, fontWeight: 600, padding: "4px 8px", borderRadius: 8 }}
                        >
                          เปลี่ยน
                        </button>
                        <button
                          onClick={removeKey}
                          style={{ color: "var(--rose)", fontSize: 12.5, fontWeight: 600, padding: "4px 8px", borderRadius: 8 }}
                        >
                          ลบ
                        </button>
                      </div>
                    ) : (
                      // edit state — enter / replace the key
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                        }}
                      >
                        <Icon name="key-round" size={17} style={{ color: "var(--faint)" }} />
                        <input
                          type="password"
                          value={draftKey}
                          onChange={(e) => setDraftKey(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && commitKey()}
                          placeholder="sk-..."
                          className="mono"
                          style={{
                            flex: 1,
                            border: "none",
                            background: "none",
                            outline: "none",
                            fontSize: 14,
                          }}
                        />
                        {draftKey.trim() && (
                          <button
                            onClick={commitKey}
                            style={{ color: "var(--brand-ink)", fontSize: 12.5, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}
                          >
                            บันทึก
                          </button>
                        )}
                        {savedKey && (
                          <button
                            onClick={() => {
                              setEditingKey(false);
                              setDraftKey("");
                            }}
                            aria-label="ยกเลิก"
                            style={{ color: "var(--faint)" }}
                          >
                            <Icon name="x" size={15} />
                          </button>
                        )}
                      </div>
                    )}

                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--faint)",
                        marginTop: 9,
                        display: "flex",
                        gap: 5,
                        alignItems: "flex-start",
                      }}
                    >
                      <Icon name="shield" size={13} style={{ marginTop: 2, flex: "none" }} /> เก็บในเบราว์เซอร์นี้เท่านั้น ส่งให้เซิร์ฟเวอร์เฉพาะตอนถอดเสียง · จัดการได้ที่เมนู “ตั้งค่า”
                    </p>
                  </div>
                )}
              </Card>

              <Btn
                full
                size="lg"
                icon="sparkles"
                iconRight="arrow-right"
                onClick={analyze}
              >
                วิเคราะห์ Requirement
              </Btn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
