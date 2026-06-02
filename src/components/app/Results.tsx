"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import {
  Icon,
  Btn,
  Card,
  Tag,
  CardHead,
  CountUp,
  IMPACT,
  PromptFooter,
} from "@/components/ui/primitives";
import { TopBar } from "@/components/app/AppShell";
import { PROMPTS } from "@/lib/sample-data";
import { exportDoc } from "@/lib/export-client";
import { apiKeyAtom } from "@/lib/atoms";
import { invalidate } from "@/lib/swr";
import { useIsMobile } from "@/lib/useMediaQuery";
import { AnalysisSchema, type Analysis } from "@/lib/types";

type Props = {
  analysis: Analysis;
  id: string;
  duration?: string;
  audioName?: string;
  audioUrl?: string;
  transcript?: string;
};

function ResultHero({
  a,
  duration,
  audioName,
  audioUrl,
}: {
  a: Analysis;
  duration: string;
  audioName: string;
  audioUrl?: string;
}) {
  const isMobile = useIsMobile();
  const total = `${a.mandayMin}–${a.mandayMax}`;
  const stats = [
    { label: "ฟีเจอร์", value: a.features.length, icon: "layers" },
    { label: "โมดูล", value: a.manday.length, icon: "boxes" },
    { label: "ความเสี่ยง", value: a.risks.length, icon: "triangle-alert" },
    {
      label: "คำถามที่ควรถาม",
      value: a.questions.length + a.missing.length,
      icon: "message-circle-question",
    },
  ];
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        background: "var(--grad)",
        padding: isMobile ? "22px 18px" : "30px 30px",
        color: "#fff",
        boxShadow: "0 18px 44px rgba(99,102,241,.3)",
        marginBottom: 22,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -90,
          right: -40,
          width: 280,
          height: 280,
          borderRadius: 99,
          background: "rgba(255,255,255,.10)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <Tag color="#fff" bg="rgba(255,255,255,.18)" icon="building-2">
            {a.client}
          </Tag>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginTop: 12,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            {a.title}
          </h2>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 12,
              flexWrap: "wrap",
              fontSize: 13.5,
              color: "rgba(255,255,255,.85)",
            }}
          >
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Icon name="file-audio" size={15} /> {audioName}
            </span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Icon name="clock" size={15} /> {duration} นาที
            </span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Icon name="sparkles" size={15} /> ความมั่นใจ {a.confidence}%
            </span>
            {audioUrl && (
              <a
                href={audioUrl}
                download={audioName}
                style={{
                  display: "inline-flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "3px 11px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.18)",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                <Icon name="download" size={14} /> ดาวน์โหลดเสียง
              </a>
            )}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,.15)",
            borderRadius: 20,
            padding: "18px 26px",
            textAlign: "center",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,.2)",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
            ประเมินรวม
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.1,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {total}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.9)" }}>Manday</div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 12,
          marginTop: 22,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,.13)",
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon name={s.icon} size={19} style={{ color: "rgba(255,255,255,.9)" }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
                <CountUp to={s.value} />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceNote({ evidence }: { evidence: string }) {
  if (!evidence) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginTop: 16,
        padding: "12px 14px",
        background: "var(--surface-2)",
        border: "1px solid var(--line-2)",
        borderRadius: 12,
      }}
    >
      <Icon name="file-text" size={16} style={{ color: "var(--faint)", flex: "none", marginTop: 2 }} />
      <div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--faint)",
            letterSpacing: "0.04em",
            marginBottom: 3,
          }}
        >
          อ้างอิงจาก TRANSCRIPT
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.65 }}>
          “{evidence}”
        </p>
      </div>
    </div>
  );
}

function ExecSummary({ a }: { a: Analysis }) {
  const isMobile = useIsMobile();
  return (
    <Card pad={24}>
      <CardHead
        icon="clipboard-list"
        title="สรุปสำหรับผู้บริหาร"
        sub="ภาพรวมของโครงการจาก Requirement"
      />
      <p style={{ fontSize: 15.5, color: "var(--ink-2)", lineHeight: 1.75 }}>
        {a.summary.overview}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
          marginTop: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--faint)",
              letterSpacing: "0.04em",
              marginBottom: 10,
            }}
          >
            เป้าหมายหลัก
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 9,
            }}
          >
            {a.summary.goals.map((g, i) => (
              <li
                key={i}
                style={{ display: "flex", gap: 9, fontSize: 14.5, color: "var(--ink-2)" }}
              >
                <Icon
                  name="target"
                  size={17}
                  style={{ color: "var(--brand-ink)", flex: "none", marginTop: 2 }}
                />{" "}
                {g}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(
            [
              ["users", "ขนาดโครงการ", a.summary.scale],
              ["calendar-clock", "ระยะเวลาโดยประมาณ", a.summary.timeline],
            ] as [string, string, string][]
          ).map(([ic, l, v], i) => (
            <div
              key={i}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: 5,
                }}
              >
                <Icon name={ic} size={15} /> {l}
              </div>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <EvidenceNote evidence={a.evidence} />
      <PromptFooter prompt={PROMPTS.summary} />
    </Card>
  );
}

function FeaturesCard({ a }: { a: Analysis }) {
  return (
    <Card pad={24}>
      <CardHead
        icon="layers"
        title="ฟีเจอร์ที่สกัดได้"
        sub={`${a.features.length} ฟีเจอร์จาก Requirement`}
        right={<Tag icon="check">SOW</Tag>}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: 12,
        }}
      >
        {a.features.map((f, i) => {
          const im = IMPACT[f.impact];
          return (
            <div
              key={i}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: 16,
                background: "var(--surface-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: "var(--surface)",
                    color: "var(--brand-ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                    border: "1px solid var(--line)",
                  }}
                >
                  <Icon name={f.icon} size={19} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                    {f.name}
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--faint)" }}>
                    {f.en}
                  </div>
                </div>
                {/* manday estimate — top-right for clear scanning */}
                <div
                  style={{
                    flex: "none",
                    textAlign: "right",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "var(--brand-ink)",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.est.replace(/\s*วัน\s*$/, "").replace(/\s*days?\s*$/i, "")}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--faint)", fontWeight: 600 }}>
                    วัน
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  margin: "11px 0 12px",
                }}
              >
                {f.desc}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag color={im.color} bg={im.bg} size={12}>
                  {im.label}
                </Tag>
              </div>
            </div>
          );
        })}
      </div>
      <PromptFooter prompt={PROMPTS.features} />
    </Card>
  );
}

function MandayCard({ a }: { a: Analysis }) {
  const isMobile = useIsMobile();
  const max = Math.max(...a.manday.map((m) => m.max), 1);
  const totMin = a.manday.reduce((acc, m) => acc + m.min, 0);
  const totMax = a.manday.reduce((acc, m) => acc + m.max, 0);
  const bar = (m: { max: number }) => (
    <div
      style={{
        height: 8,
        background: "var(--line-2)",
        borderRadius: 99,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${(m.max / max) * 100}%`,
          height: "100%",
          background: "var(--grad)",
          borderRadius: 99,
        }}
      />
    </div>
  );
  return (
    <Card pad={24}>
      <CardHead
        icon="calculator"
        title="ตารางประเมิน Manday"
        sub="แยกตามโมดูล (หน่วย: วันทำงาน)"
        right={
          <Tag color="var(--brand-ink)" bg="var(--brand-soft)">
            {totMin}–{totMax} วัน
          </Tag>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {a.manday.map((m, i) =>
          isMobile ? (
            // mobile: name + number on top, full-width bar below
            <div
              key={i}
              style={{
                padding: "12px 12px",
                borderRadius: 12,
                background: i % 2 ? "transparent" : "var(--surface-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.module}</div>
                  <div style={{ fontSize: 12, color: "var(--faint)" }}>{m.note}</div>
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 800, color: "var(--brand-ink)", flex: "none" }}
                  className="mono"
                >
                  {m.min}–{m.max}
                </div>
              </div>
              <div style={{ marginTop: 9 }}>{bar(m)}</div>
            </div>
          ) : (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 70px",
                alignItems: "center",
                gap: 14,
                padding: "11px 12px",
                borderRadius: 12,
                background: i % 2 ? "transparent" : "var(--surface-2)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.module}</div>
                <div style={{ fontSize: 12, color: "var(--faint)" }}>{m.note}</div>
              </div>
              {bar(m)}
              <div
                style={{ fontSize: 14, fontWeight: 700, textAlign: "right" }}
                className="mono"
              >
                {m.min}–{m.max}
              </div>
            </div>
          ),
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          padding: "14px 16px",
          background: "var(--grad-soft)",
          borderRadius: 14,
          border: "1px solid var(--line)",
        }}
      >
        <span style={{ fontSize: 15.5, fontWeight: 700 }}>รวมทั้งโครงการ</span>
        <span
          style={{ fontSize: 20, fontWeight: 800, color: "var(--brand-ink)" }}
          className="mono"
        >
          {totMin}–{totMax} วัน
        </span>
      </div>
      <PromptFooter prompt={PROMPTS.manday} />
    </Card>
  );
}

function ListCard({
  icon,
  title,
  sub,
  color,
  bg,
  promptKey,
  children,
}: {
  icon: string;
  title: string;
  sub?: string;
  color?: string;
  bg?: string;
  promptKey: keyof typeof PROMPTS;
  children: ReactNode;
}) {
  return (
    <Card pad={24}>
      <CardHead icon={icon} title={title} sub={sub} color={color} bg={bg} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
      <PromptFooter prompt={PROMPTS[promptKey]} />
    </Card>
  );
}

function RisksCard({ a }: { a: Analysis }) {
  const lv: Record<string, { c: string; b: string }> = {
    สูง: { c: "var(--rose)", b: "var(--rose-soft)" },
    กลาง: { c: "var(--amber)", b: "var(--amber-soft)" },
    ต่ำ: { c: "var(--green)", b: "var(--green-soft)" },
  };
  return (
    <ListCard
      icon="triangle-alert"
      title="การวิเคราะห์ความเสี่ยง"
      sub={`${a.risks.length} ความเสี่ยงที่ควรเฝ้าระวัง`}
      color="var(--amber)"
      bg="var(--amber-soft)"
      promptKey="risks"
    >
      {a.risks.map((r, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{r.title}</div>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  marginTop: 4,
                }}
              >
                {r.desc}
              </p>
            </div>
            <Tag color={lv[r.level]?.c} bg={lv[r.level]?.b} size={12}>
              {r.level}
            </Tag>
          </div>
        </div>
      ))}
    </ListCard>
  );
}

function MissingCard({ a }: { a: Analysis }) {
  return (
    <ListCard
      icon="circle-help"
      title="ข้อมูลที่ยังขาด"
      sub="สิ่งที่ควรสอบถามก่อนเริ่มงาน"
      color="var(--sky)"
      bg="var(--brand-soft-2)"
      promptKey="missing"
    >
      {a.missing.map((m, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: "13px 15px",
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface-2)",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "var(--brand-soft-2)",
              color: "var(--sky)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.q}</div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--faint)",
                marginTop: 3,
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              <Icon name="info" size={13} /> {m.why}
            </div>
          </div>
        </div>
      ))}
    </ListCard>
  );
}

function QuestionsCard({ a }: { a: Analysis }) {
  return (
    <ListCard
      icon="messages-square"
      title="คำถามที่ควรถามลูกค้า"
      sub="ปิดช่องว่างของ Requirement"
      color="var(--violet)"
      bg="#f1ecfe"
      promptKey="questions"
    >
      {a.questions.map((q, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 11,
            padding: "12px 15px",
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface-2)",
          }}
        >
          <Icon
            name="message-circle"
            size={18}
            style={{ color: "var(--violet)", flex: "none", marginTop: 2 }}
          />
          <span style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {q}
          </span>
        </div>
      ))}
    </ListCard>
  );
}

function AssumptionsCard({ a }: { a: Analysis }) {
  return (
    <ListCard
      icon="lightbulb"
      title="สมมติฐาน"
      sub="เงื่อนไขที่ใช้ในการประเมิน"
      color="var(--green)"
      bg="var(--green-soft)"
      promptKey="assumptions"
    >
      {a.assumptions.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            padding: "11px 14px",
            border: "1px solid var(--line)",
            borderRadius: 12,
            background: "var(--surface-2)",
          }}
        >
          <Icon
            name="check-circle-2"
            size={17}
            style={{ color: "var(--green)", flex: "none", marginTop: 2 }}
          />
          <span style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {s}
          </span>
        </div>
      ))}
    </ListCard>
  );
}

function DepsIntegrations({ a }: { a: Analysis }) {
  const isMobile = useIsMobile();
  return (
    <Card pad={24}>
      <CardHead
        icon="git-fork"
        title="Dependencies & Integrations"
        sub="สิ่งที่ต้องเชื่อมต่อและพึ่งพา"
        color="var(--ink-2)"
        bg="var(--bg-2)"
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--faint)",
              letterSpacing: "0.04em",
              marginBottom: 10,
            }}
          >
            DEPENDENCIES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {a.dependencies.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 11,
                  padding: "11px 13px",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                }}
              >
                <Icon
                  name={d.icon}
                  size={18}
                  style={{ color: "var(--brand-ink)", flex: "none", marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: "var(--faint)" }}>{d.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--faint)",
              letterSpacing: "0.04em",
              marginBottom: 10,
            }}
          >
            INTEGRATIONS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {a.integrations.map((it, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 13px",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  background: "var(--surface)",
                }}
              >
                <Icon name={it.icon} size={17} style={{ color: "var(--brand-ink)" }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>
                    {it.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--faint)" }}>{it.cat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PromptFooter prompt={PROMPTS.dependencies} />
    </Card>
  );
}

function ExportModal({
  a,
  onClose,
}: {
  a: Analysis;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const opts = [
    { fmt: "docx", icon: "file-text", t: "เอกสาร DOCX", d: "ไฟล์ Word พร้อมแก้ไข", color: "var(--sky)" },
    { fmt: "pdf", icon: "file-down", t: "ใบประเมิน PDF", d: "ตาราง Manday พร้อมส่งลูกค้า", color: "var(--rose)" },
    { fmt: "json", icon: "sparkles", t: "รายงาน AI Analysis", d: "ข้อมูลวิเคราะห์ฉบับเต็ม (JSON)", color: "var(--brand-ink)" },
  ] as const;
  const run = async (fmt: string) => {
    setBusy(fmt);
    await exportDoc(fmt, a);
    setBusy(null);
    onClose();
  };
  return (
    <div
      onClick={onClose}
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
        role="dialog"
        aria-modal="true"
        aria-label="ส่งออกเอกสาร"
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--sh-lg)",
          animation: "pop .35s cubic-bezier(.2,.8,.3,1) both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 800 }}>ส่งออกเอกสาร</h3>
          <button onClick={onClose} aria-label="ปิด" style={{ color: "var(--faint)" }}>
            <Icon name="x" size={22} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>
          เลือกรูปแบบเอกสารที่ต้องการดาวน์โหลด
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {opts.map((o, i) => (
            <button
              key={i}
              onClick={() => run(o.fmt)}
              disabled={busy !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "15px 16px",
                border: "1px solid var(--line)",
                borderRadius: 16,
                background: "var(--surface-2)",
                textAlign: "left",
                transition: "all .15s",
                opacity: busy && busy !== o.fmt ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--surface)",
                  color: o.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                  border: "1px solid var(--line)",
                }}
              >
                <Icon name={o.icon} size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{o.t}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{o.d}</div>
              </div>
              <Icon
                name={busy === o.fmt ? "loader-circle" : "download"}
                size={19}
                className={busy === o.fmt ? "spin" : ""}
                style={{ color: "var(--faint)" }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReanalyzeBar({
  transcript,
  id,
  onResult,
}: {
  transcript: string;
  id: string;
  onResult: (a: Analysis) => void;
}) {
  const apiKey = useAtomValue(apiKeyAtom);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const rerun = async (provider: string) => {
    setBusy(provider);
    setErr(false);
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transcript,
          provider,
          id: id !== "sample" ? id : undefined,
          apiKey: provider === "openai" ? apiKey : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const parsed = AnalysisSchema.safeParse(json.analysis);
      if (!parsed.success) throw new Error();
      onResult(parsed.data);
      invalidate("projects"); // History reflects the re-analyzed result
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErr(true);
    } finally {
      setBusy(null);
    }
  };

  const opts = [
    { id: "claude-cli", t: "Claude", d: "วิเคราะห์ใหม่ด้วย Claude", icon: "sparkles" },
    { id: "openai", t: "OpenAI", d: "ลองด้วย GPT (ต้องมี API key)", icon: "bot" },
  ];

  return (
    <Card pad={22}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13, marginBottom: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "var(--grad-soft)",
            color: "var(--brand-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          <Icon name="refresh-cw" size={21} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>ยังไม่ถูกใจผลวิเคราะห์?</h3>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>
            วิเคราะห์ transcript เดิมใหม่ด้วย AI อื่น (ไม่ต้องถอดเสียงซ้ำ)
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {opts.map((o) => (
          <Btn
            key={o.id}
            variant="ghost"
            icon={busy === o.id ? "loader-circle" : o.icon}
            onClick={() => rerun(o.id)}
            disabled={busy !== null}
          >
            {busy === o.id ? "กำลังวิเคราะห์ใหม่…" : `วิเคราะห์ด้วย ${o.t}`}
          </Btn>
        ))}
      </div>
      {err && (
        <p style={{ fontSize: 13, color: "var(--rose)", marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}>
          <Icon name="alert-triangle" size={14} /> วิเคราะห์ใหม่ไม่สำเร็จ — ตรวจ API key หรือลองอีกครั้ง
        </p>
      )}
    </Card>
  );
}

export function Results({
  analysis: initialAnalysis,
  id,
  duration = "—",
  audioName = "requirement.m4a",
  audioUrl,
  transcript,
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [exp, setExp] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>(initialAnalysis);

  // keep in sync when the page hydrates a different record (history/DB)
  useEffect(() => setAnalysis(initialAnalysis), [initialAnalysis]);

  return (
    <>
      <TopBar
        title="ผลการวิเคราะห์"
        sub={analysis.title}
        right={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" size="sm" icon="share-2">
              แชร์
            </Btn>
            <Btn size="sm" icon="download" onClick={() => setExp(true)}>
              ส่งออก
            </Btn>
          </div>
        }
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "18px 10px 56px" : "28px 24px 70px",
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 16 : 22,
          }}
        >
          <div className="fadeUp">
            <ResultHero a={analysis} duration={duration} audioName={audioName} audioUrl={audioUrl} />
          </div>
          <div className="fadeUp" style={{ animationDelay: ".05s" }}>
            <ExecSummary a={analysis} />
          </div>
          <div className="fadeUp" style={{ animationDelay: ".08s" }}>
            <FeaturesCard a={analysis} />
          </div>
          <div className="fadeUp" style={{ animationDelay: ".1s" }}>
            <MandayCard a={analysis} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(420px, 1fr))",
              gap: 22,
            }}
          >
            <div className="fadeUp" style={{ animationDelay: ".12s" }}>
              <RisksCard a={analysis} />
            </div>
            <div className="fadeUp" style={{ animationDelay: ".14s" }}>
              <MissingCard a={analysis} />
            </div>
            <div className="fadeUp" style={{ animationDelay: ".16s" }}>
              <QuestionsCard a={analysis} />
            </div>
            <div className="fadeUp" style={{ animationDelay: ".18s" }}>
              <AssumptionsCard a={analysis} />
            </div>
          </div>
          <div className="fadeUp" style={{ animationDelay: ".2s" }}>
            <DepsIntegrations a={analysis} />
          </div>
          {transcript && (
            <div className="fadeUp" style={{ animationDelay: ".22s" }}>
              <ReanalyzeBar transcript={transcript} id={id} onResult={setAnalysis} />
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 6,
            }}
          >
            <Btn variant="ghost" icon="history" onClick={() => router.push("/history")}>
              ดูประวัติทั้งหมด
            </Btn>
            <Btn icon="plus" onClick={() => router.push("/workspace")}>
              วิเคราะห์ใหม่
            </Btn>
          </div>
        </div>
      </div>
      {exp && <ExportModal a={analysis} onClose={() => setExp(false)} />}
    </>
  );
}
