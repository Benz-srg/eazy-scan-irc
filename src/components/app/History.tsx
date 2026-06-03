"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Card, Tag } from "@/components/ui/primitives";
import { TopBar } from "@/components/app/AppShell";
import { useAtom } from "jotai";
import { historyAtom } from "@/lib/atoms";
import { useSWR, mutate, invalidate } from "@/lib/swr";
import { fmtClock } from "@/lib/estimate";
import { useIsMobile } from "@/lib/useMediaQuery";
import type { HistoryItem } from "@/lib/types";

async function fetchProjects(): Promise<HistoryItem[]> {
  const r = await fetch("/api/projects");
  if (!r.ok) throw new Error("projects fetch failed");
  const j = await r.json();
  return (j?.items as HistoryItem[]) ?? [];
}

type Sort = "date" | "name" | "manday";

function fmtDur(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} วิ`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} นาที`;
}

export function History() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [items, setItems] = useAtom(historyAtom);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<Sort>("date");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const doDelete = (id: string) => {
    setItems((arr) => arr.filter((x) => x.id !== id));
    setConfirmId(null);
    fetch(`/api/projects/${id}`, { method: "DELETE" })
      .catch(() => {})
      .finally(() => invalidate("projects"));
  };

  // SWR: instant paint from cache, revalidate in background + on window focus.
  // DB is the source of truth when it has rows; never wipe client-only history
  // (no-DB mode → /api/projects returns []).
  const { data: projects } = useSWR<HistoryItem[]>("projects", fetchProjects);
  useEffect(() => {
    if (projects?.length) setItems(projects);
  }, [projects]);

  // stop any playing preview audio when leaving the page
  useEffect(() => () => audioRef.current?.pause(), []);

  // while any job is processing, force-revalidate so the list flips to done
  const hasProcessing = items.some((h) => h.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const t = setInterval(() => {
      mutate("projects", fetchProjects).catch(() => {});
    }, 4000);
    return () => clearInterval(t);
  }, [hasProcessing]);

  const tags = useMemo(
    () => ["all", ...Array.from(new Set(items.map((h) => h.tag)))],
    [items],
  );

  const filtered = useMemo(() => {
    const list = items.filter(
      (h) =>
        (tag === "all" || h.tag === tag) &&
        (h.title.toLowerCase().includes(q.toLowerCase()) ||
          h.client.toLowerCase().includes(q.toLowerCase()) ||
          h.audio.toLowerCase().includes(q.toLowerCase())),
    );
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.title.localeCompare(b.title, "th"));
    else if (sort === "manday") sorted.sort((a, b) => b.mandayMax - a.mandayMax);
    return sorted;
  }, [items, tag, q, sort]);

  const startEdit = (h: HistoryItem) => {
    setEditId(h.id);
    setEditVal(h.title);
    setMenuId(null);
  };
  const saveEdit = () => {
    if (editId)
      setItems((arr) =>
        arr.map((x) => (x.id === editId ? { ...x, title: editVal } : x)),
      );
    setEditId(null);
  };

  const togglePlay = (h: HistoryItem) => {
    if (!h.audioUrl) return;
    if (playingId === h.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const el = new Audio(h.audioUrl);
    audioRef.current = el;
    el.onended = () => setPlayingId(null);
    el.play().catch(() => setPlayingId(null));
    setPlayingId(h.id);
  };

  return (
    <>
      <TopBar
        title="ประวัติการวิเคราะห์"
        sub={`${items.length} โครงการในคลังเอกสารของคุณ`}
        right={
          <Btn size="sm" icon="plus" onClick={() => router.push("/workspace")}>
            วิเคราะห์ใหม่
          </Btn>
        }
      />
      <div
        style={{ flex: 1, overflowY: "auto", padding: isMobile ? "18px 10px 56px" : "28px 24px 60px" }}
        onClick={() => setMenuId(null)}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 22,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                flex: 1,
                minWidth: 240,
                boxShadow: "var(--sh-sm)",
              }}
            >
              <Icon name="search" size={18} style={{ color: "var(--faint)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาชื่อโครงการ ลูกค้า หรือไฟล์เสียง…"
                aria-label="ค้นหา"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "none",
                  fontSize: 14.5,
                }}
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="ล้างคำค้นหา" style={{ color: "var(--faint)" }}>
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "7px 12px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                boxShadow: "var(--sh-sm)",
              }}
            >
              <Icon name="arrow-down-up" size={16} style={{ color: "var(--faint)" }} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="เรียงลำดับ"
                style={{
                  border: "none",
                  outline: "none",
                  background: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-2)",
                  cursor: "pointer",
                }}
              >
                <option value="date">วันที่ล่าสุด</option>
                <option value="name">ชื่อโครงการ</option>
                <option value="manday">Manday สูงสุด</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
            {tags.map((t) => {
              const on = tag === t;
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  style={{
                    padding: "7px 15px",
                    borderRadius: 999,
                    fontSize: 13.5,
                    fontWeight: 600,
                    border: `1px solid ${on ? "var(--brand)" : "var(--line)"}`,
                    background: on ? "var(--brand-soft)" : "var(--surface)",
                    color: on ? "var(--brand-ink)" : "var(--ink-2)",
                    transition: "all .15s",
                  }}
                >
                  {t === "all" ? "ทั้งหมด" : t}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--muted)" }}>
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
              <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบผลลัพธ์</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                ลองเปลี่ยนคำค้นหาหรือตัวกรอง
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((h) => (
                <Card
                  key={h.id}
                  pad={18}
                  hover
                  onClick={() =>
                    editId !== h.id &&
                    h.status !== "processing" &&
                    router.push(`/results/${h.id}`)
                  }
                  style={{
                    position: "relative",
                    cursor: h.status === "processing" ? "default" : "pointer",
                    // lift the open row above sibling cards (their hover transform
                    // makes a stacking context that would otherwise cover the menu)
                    zIndex: menuId === h.id ? 40 : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: isMobile ? "stretch" : "center",
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? 12 : 16,
                    }}
                  >
                   <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, paddingRight: isMobile ? 38 : 0 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        background:
                          h.status === "error"
                            ? "var(--rose-soft)"
                            : h.status === "processing"
                              ? "var(--amber-soft)"
                              : "var(--grad-soft)",
                        color:
                          h.status === "error"
                            ? "var(--rose)"
                            : h.status === "processing"
                              ? "var(--amber)"
                              : "var(--brand-ink)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "none",
                      }}
                    >
                      <Icon
                        name={
                          h.status === "processing"
                            ? "loader-circle"
                            : h.status === "error"
                              ? "triangle-alert"
                              : "file-text"
                        }
                        size={24}
                        className={h.status === "processing" ? "spin" : ""}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editId === h.id ? (
                        <input
                          autoFocus
                          value={editVal}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
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
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {h.title}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: 14,
                          marginTop: 4,
                          fontSize: 13,
                          color: "var(--muted)",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                          <Icon name="building-2" size={14} /> {h.client}
                        </span>
                        <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                          <Icon name="file-audio" size={14} /> {h.audio}
                        </span>
                        <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                          <Icon name="calendar" size={14} /> {h.date}
                        </span>
                        {h.durationMs != null && (
                          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                            <Icon name="timer" size={14} /> ใช้เวลา {fmtDur(h.durationMs)}
                          </span>
                        )}
                      </div>
                    </div>
                   </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? 8 : 16,
                        rowGap: isMobile ? 8 : undefined,
                        flex: "none",
                        flexWrap: isMobile ? "wrap" : "nowrap",
                        justifyContent: "flex-start",
                        paddingLeft: 0,
                      }}
                      className="hist-meta"
                    >
                      {h.audioUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(h);
                          }}
                          aria-label={playingId === h.id ? "หยุดเล่นเสียง" : "เล่นเสียง"}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--brand-ink)",
                            background: "var(--brand-soft)",
                            flex: "none",
                          }}
                        >
                          <Icon name={playingId === h.id ? "pause" : "play"} size={16} />
                        </button>
                      )}
                      {h.status === "processing" ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <Tag color="var(--amber)" bg="var(--amber-soft)" icon="loader-circle" size={12}>
                            กำลังประมวลผล
                          </Tag>
                          {h.estFinishAt && (
                            <span style={{ fontSize: 12.5, color: "var(--faint)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Icon name="clock" size={13} />
                              {Date.parse(h.estFinishAt) > Date.now()
                                ? `เสร็จ ~${fmtClock(new Date(h.estFinishAt))}`
                                : "ใกล้เสร็จ…"}
                            </span>
                          )}
                        </div>
                      ) : h.status === "error" ? (
                        <Tag color="var(--rose)" bg="var(--rose-soft)" icon="triangle-alert" size={12}>
                          ผิดพลาด
                        </Tag>
                      ) : (
                        <>
                          <Tag color="var(--green)" bg="var(--green-soft)" icon="circle-check" size={12}>
                            เสร็จสิ้น
                          </Tag>
                          <Tag size={12}>{h.tag}</Tag>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: "var(--brand-ink)",
                                whiteSpace: "nowrap",
                              }}
                              className="mono"
                            >
                              {h.mandayMin}–{h.mandayMax}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--faint)" }}>Manday</div>
                          </div>
                        </>
                      )}
                      <div
                        style={{
                          // pin the kebab to the card's top-right on mobile so it
                          // never wraps to a second line; inline on desktop
                          position: isMobile ? "absolute" : "relative",
                          top: isMobile ? 14 : undefined,
                          right: isMobile ? 14 : undefined,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuId(menuId === h.id ? null : h.id);
                          }}
                          aria-label="ตัวเลือก"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--faint)",
                          }}
                        >
                          <Icon name="more-vertical" size={19} />
                        </button>
                        {menuId === h.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              top: 38,
                              right: 0,
                              background: "var(--surface)",
                              border: "1px solid var(--line)",
                              borderRadius: 14,
                              boxShadow: "var(--sh-lg)",
                              padding: 6,
                              width: 178,
                              zIndex: "var(--z-dropdown)" as unknown as number,
                              animation: "pop .18s ease both",
                            }}
                          >
                            {(
                              [
                                ["square-pen", "เปลี่ยนชื่อ", () => startEdit(h)],
                                ["folder-open", "เปิดดู", () => router.push(`/results/${h.id}`)],
                              ] as [string, string, () => void][]
                            ).map(([ic, t, fn], i) => (
                              <button
                                key={i}
                                onClick={fn}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  width: "100%",
                                  padding: "9px 11px",
                                  borderRadius: 9,
                                  fontSize: 14,
                                  color: "var(--ink-2)",
                                  textAlign: "left",
                                }}
                              >
                                <Icon name={ic} size={16} /> {t}
                              </button>
                            ))}
                            {h.audioUrl && (
                              <a
                                href={h.audioUrl}
                                download={h.audio}
                                onClick={() => setMenuId(null)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  width: "100%",
                                  padding: "9px 11px",
                                  borderRadius: 9,
                                  fontSize: 14,
                                  color: "var(--ink-2)",
                                  textAlign: "left",
                                }}
                              >
                                <Icon name="download" size={16} /> ดาวน์โหลดเสียง
                              </a>
                            )}
                            <div
                              style={{ height: 1, background: "var(--line-2)", margin: "5px 0" }}
                            />
                            <button
                              onClick={() => {
                                setMenuId(null);
                                setConfirmId(h.id);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                width: "100%",
                                padding: "9px 11px",
                                borderRadius: 9,
                                fontSize: 14,
                                color: "var(--rose)",
                                textAlign: "left",
                              }}
                            >
                              <Icon name="trash-2" size={16} /> ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmId && (
        <div
          onClick={() => setConfirmId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23,23,40,.42)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "var(--z-modal)" as unknown as number,
            padding: 20,
            animation: "fadeIn .2s",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="ยืนยันการลบ"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--r-xl)",
              padding: 26,
              width: "100%",
              maxWidth: 400,
              boxShadow: "var(--sh-lg)",
              textAlign: "center",
              animation: "pop .35s cubic-bezier(.2,.8,.3,1) both",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "var(--rose-soft)",
                color: "var(--rose)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Icon name="trash-2" size={28} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800 }}>ลบประวัติการวิเคราะห์?</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
              ลบ “<b>{items.find((x) => x.id === confirmId)?.title ?? "รายการนี้"}</b>”
              ออกถาวร — กู้คืนไม่ได้
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <Btn variant="ghost" onClick={() => setConfirmId(null)} style={{ flex: 1, justifyContent: "center" }}>
                ยกเลิก
              </Btn>
              <Btn variant="danger" icon="trash-2" onClick={() => doDelete(confirmId)} style={{ flex: 1, justifyContent: "center" }}>
                ลบถาวร
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
