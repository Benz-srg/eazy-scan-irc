"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon, Logo, Btn, Card, Tag } from "@/components/ui/primitives";
import { ComingSoon } from "@/components/ui/ComingSoon";

function SectionTitle({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--brand-ink)",
          letterSpacing: "0.04em",
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "clamp(27px, 3.6vw, 40px)",
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          textWrap: "balance",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontSize: 17,
            color: "var(--muted)",
            marginTop: 14,
            lineHeight: 1.6,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function LandingNav({
  onStart,
  onLogin,
}: {
  onStart: () => void;
  onLogin: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 14);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = ["คุณสมบัติ", "วิธีใช้งาน", "ราคา"];
  const ids = ["features", "how", "pricing"];
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: "var(--z-sticky)" as unknown as number,
        padding: "0 24px",
        background: scrolled ? "rgba(245,246,251,.82)" : "transparent",
        backdropFilter: scrolled ? "saturate(180%) blur(16px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--line)"
          : "1px solid transparent",
        transition: "all .3s",
      }}
    >
      <div
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          height: 70,
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Logo size={32} />
        <nav
          style={{ display: "flex", gap: 6, marginLeft: 14 }}
          className="lp-nav"
        >
          {links.map((l, i) => (
            <a
              key={i}
              href={"#" + ids[i]}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                color: "var(--ink-2)",
                whiteSpace: "nowrap",
              }}
            >
              {l}
            </a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <button
          onClick={onLogin}
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink-2)",
            padding: "9px 6px",
          }}
        >
          เข้าสู่ระบบ
        </button>
        <Btn size="sm" icon="sparkles" onClick={onStart}>
          เริ่มใช้งานฟรี
        </Btn>
      </div>
    </div>
  );
}

function HeroWave() {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: 40 }, () => 0.3),
  );
  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setBars(Array.from({ length: 40 }, (_, i) => 0.3 + (i % 5) * 0.12));
      return;
    }
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.08;
      setBars(
        Array.from({ length: 40 }, (_, i) => {
          const v =
            Math.sin(t + i * 0.5) * 0.5 + Math.sin(t * 1.7 + i * 0.3) * 0.3;
          return 0.18 + Math.abs(v) * 0.82;
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        height: 60,
      }}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: `${h * 100}%`,
            borderRadius: 4,
            background: "var(--grad)",
            opacity: 0.55 + h * 0.45,
          }}
        />
      ))}
    </div>
  );
}

function Hero({
  onStart,
  onDemo,
}: {
  onStart: () => void;
  onDemo: () => void;
}) {
  return (
    <section
      style={{ position: "relative", padding: "70px 24px 40px", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 520,
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,.16), transparent 62%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          right: -120,
          width: 420,
          height: 420,
          background:
            "radial-gradient(circle, rgba(96,165,250,.14), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          className="fadeUp"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 15px 7px 9px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 999,
            boxShadow: "var(--sh-sm)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink-2)",
            marginBottom: 26,
          }}
        >
          <Tag icon="sparkles">AI</Tag>
          ผู้ช่วยประเมิน Manday จากเสียงลูกค้า
        </div>
        <h1
          className="fadeUp"
          style={{
            fontSize: "clamp(38px, 6vw, 62px)",
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-0.025em",
            animationDelay: ".05s",
            textWrap: "balance",
          }}
        >
          เปลี่ยนเสียงลูกค้า ให้กลายเป็น
          <br />
          <span
            style={{
              background: "var(--grad)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Scope งานและ Manday
          </span>{" "}
          ภายในไม่กี่นาที
        </h1>
        <p
          className="fadeUp"
          style={{
            fontSize: "clamp(17px, 2.2vw, 20px)",
            color: "var(--muted)",
            maxWidth: 660,
            margin: "22px auto 0",
            lineHeight: 1.65,
            animationDelay: ".12s",
          }}
        >
          อัปโหลดไฟล์เสียงหรืออัดเสียงโดยตรง ให้ AI วิเคราะห์ Requirement พร้อมสร้าง
          SOW, ประเมิน Manday และคำถามที่ควรถามลูกค้า
        </p>
        <div
          className="fadeUp"
          style={{
            display: "flex",
            gap: 13,
            justifyContent: "center",
            marginTop: 34,
            flexWrap: "wrap",
            animationDelay: ".18s",
          }}
        >
          <Btn size="lg" icon="sparkles" onClick={onStart}>
            เริ่มใช้งานฟรี
          </Btn>
          <Btn size="lg" variant="ghost" icon="play" onClick={onDemo}>
            ดูตัวอย่าง
          </Btn>
        </div>
        <p
          className="fadeUp"
          style={{
            fontSize: 13.5,
            color: "var(--faint)",
            marginTop: 16,
            animationDelay: ".22s",
          }}
        >
          ไม่ต้องใช้บัตรเครดิต · รองรับ .mp3 .wav .m4a
        </p>
      </div>

      <div
        className="fadeUp"
        style={{
          maxWidth: 940,
          margin: "54px auto 0",
          position: "relative",
          animationDelay: ".28s",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 28,
            background: "var(--grad)",
            opacity: 0.5,
            filter: "blur(28px)",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "var(--surface)",
            borderRadius: 24,
            border: "1px solid var(--line)",
            boxShadow: "var(--sh-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 18px",
              borderBottom: "1px solid var(--line-2)",
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 99,
                background: "#f1576a",
              }}
            />
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 99,
                background: "#ffbd2e",
              }}
            />
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 99,
                background: "#28c840",
              }}
            />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12.5, color: "var(--faint)" }} className="mono">
              app.eazyscan.ai/workspace
            </span>
            <div style={{ flex: 1 }} />
          </div>
          <div style={{ padding: "40px 30px 46px", background: "var(--grad-soft)" }}>
            <div
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--brand-ink)",
                marginBottom: 6,
              }}
            >
              กำลังฟัง Requirement ของคุณ…
            </div>
            <HeroWave />
            <div
              style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 99,
                  background: "var(--grad)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--sh-glow)",
                  color: "#fff",
                }}
              >
                <Icon name="mic" size={30} />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 26,
                flexWrap: "wrap",
              }}
            >
              {(
                [
                  ["package", "สินค้า"],
                  ["layers", "สต็อก"],
                  ["receipt-text", "ออเดอร์"],
                  ["chart-line", "รายงาน"],
                ] as [string, string][]
              ).map(([ic, t], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 14px",
                    background: "var(--surface)",
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    boxShadow: "var(--sh-sm)",
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}
                >
                  <Icon name={ic} size={16} style={{ color: "var(--brand-ink)" }} />{" "}
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: "upload-cloud", t: "อัปโหลดไฟล์เสียง", d: "ลากวางไฟล์ .mp3 .wav .m4a ได้ทันที รองรับไฟล์ยาว" },
    { icon: "mic", t: "อัดเสียงโดยตรง", d: "บันทึกเสียงในเบราว์เซอร์ พร้อมการแสดงคลื่นเสียงแบบเรียลไทม์" },
    { icon: "file-text", t: "ถอดเสียงด้วย AI", d: "แปลงเสียงเป็นข้อความแม่นยำด้วย Whisper รองรับภาษาไทย" },
    { icon: "scan-search", t: "วิเคราะห์ Requirement", d: "AI สกัดฟีเจอร์ ขอบเขตงาน และสิ่งที่ยังขาดออกมาให้อัตโนมัติ" },
    { icon: "calculator", t: "ประเมิน Manday", d: "แยกประเมินเป็นรายโมดูลพร้อมช่วงเวลาและตารางสรุป" },
    { icon: "file-down", t: "ส่งออกเอกสาร", d: "ดาวน์โหลดเป็น DOCX / PDF พร้อมส่งให้ลูกค้าได้ทันที" },
  ];
  return (
    <section
      id="features"
      style={{ padding: "60px 24px", maxWidth: "var(--maxw)", margin: "0 auto" }}
    >
      <SectionTitle
        eyebrow="คุณสมบัติ"
        title="ทุกอย่างที่ PM ต้องการ ในที่เดียว"
        sub="ตั้งแต่รับเสียงลูกค้า จนถึงเอกสารพร้อมส่ง EazyScan ช่วยให้คุณประเมินงานได้เร็วและแม่นยำขึ้น"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
          marginTop: 44,
        }}
      >
        {items.map((it, i) => (
          <Card key={i} hover pad={26}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 15,
                background: "var(--grad-soft)",
                color: "var(--brand-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Icon name={it.icon} size={25} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 7 }}>
              {it.t}
            </h3>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
              {it.d}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "upload-cloud", t: "อัปโหลดเสียง", d: "ลากวางไฟล์หรืออัดเสียงสนทนากับลูกค้า" },
    { icon: "brain", t: "AI เข้าใจ Requirement", d: "ถอดเสียงและทำความเข้าใจสิ่งที่ลูกค้าต้องการ" },
    { icon: "list-checks", t: "สร้าง Scope of Work", d: "สกัดออกมาเป็นรายการงานที่ชัดเจน" },
    { icon: "calculator", t: "ประเมิน Manday", d: "คำนวณเวลาทำงานแยกตามโมดูล" },
    { icon: "file-down", t: "ส่งออกเอกสาร", d: "ได้เอกสารพร้อมส่งให้ลูกค้า" },
  ];
  return (
    <section
      id="how"
      style={{
        padding: "60px 24px",
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto" }}>
        <SectionTitle
          eyebrow="วิธีใช้งาน"
          title="5 ขั้นตอน จากเสียงสู่แผนงาน"
          sub="ไม่ต้องตั้งค่าซับซ้อน เริ่มได้ทันทีในไม่กี่คลิก"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 16,
            marginTop: 44,
          }}
        >
          {steps.map((s, i) => (
            <div key={i} style={{ position: "relative", textAlign: "center" }}>
              <div
                style={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  margin: "0 auto 16px",
                  borderRadius: 20,
                  background: "var(--grad)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 24px rgba(99,102,241,.28)",
                }}
              >
                <Icon name={s.icon} size={28} />
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 26,
                    height: 26,
                    borderRadius: 99,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--brand-ink)",
                    fontSize: 13,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--sh-sm)",
                  }}
                >
                  {i + 1}
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                {s.t}
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ onStart }: { onStart: () => void }) {
  const plans = [
    {
      name: "Free",
      price: "0",
      unit: "บาท/เดือน",
      desc: "เริ่มต้นสำหรับฟรีแลนซ์",
      cta: "เริ่มใช้งานฟรี",
      variant: "ghost" as const,
      feats: ["วิเคราะห์ได้ 5 ครั้ง/เดือน", "ถอดเสียงด้วย Whisper", "สร้าง SOW & Manday", "ส่งออก PDF"],
      popular: false,
    },
    {
      name: "Pro",
      price: "590",
      unit: "บาท/เดือน",
      desc: "สำหรับ PM และทีมเล็ก",
      cta: "เริ่มใช้ Pro",
      variant: "primary" as const,
      popular: true,
      feats: ["วิเคราะห์ไม่จำกัด", "ใช้ OpenAI API Key ของคุณเอง", "ปรับแต่ง Prompt และ re-run", "ส่งออก DOCX + PDF", "ประวัติแบบค้นหาได้"],
    },
    {
      name: "Team",
      price: "ติดต่อเรา",
      unit: "",
      desc: "สำหรับเอเจนซีและองค์กร",
      cta: "ติดต่อฝ่ายขาย",
      variant: "dark" as const,
      feats: ["ทุกอย่างใน Pro", "พื้นที่ทำงานร่วมกัน", "จัดการสิทธิ์ทีม", "เทมเพลตเอกสารองค์กร", "ซัพพอร์ตเฉพาะทาง"],
      popular: false,
    },
  ];
  return (
    <section
      id="pricing"
      style={{ padding: "60px 24px", maxWidth: "var(--maxw)", margin: "0 auto" }}
    >
      <SectionTitle
        eyebrow="ราคา"
        title="เลือกแพ็กเกจที่เหมาะกับคุณ"
        sub="เริ่มฟรี อัปเกรดเมื่อพร้อม ยกเลิกได้ทุกเมื่อ"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginTop: 44,
          alignItems: "stretch",
        }}
      >
        {plans.map((p, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              background: "var(--surface)",
              borderRadius: "var(--r-xl)",
              border: p.popular ? "2px solid var(--brand)" : "1px solid var(--line)",
              padding: 30,
              boxShadow: p.popular ? "var(--sh-lg)" : "var(--sh-md)",
              display: "flex",
              flexDirection: "column",
              transform: p.popular ? "scale(1.02)" : "none",
            }}
          >
            {p.popular && (
              <div
                style={{
                  position: "absolute",
                  top: -13,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--grad)",
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "5px 14px",
                  borderRadius: 999,
                  boxShadow: "0 6px 14px rgba(99,102,241,.3)",
                }}
              >
                ยอดนิยม
              </div>
            )}
            <h3 style={{ fontSize: 21, fontWeight: 800 }}>{p.name}</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
              {p.desc}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                margin: "20px 0 4px",
              }}
            >
              <span
                style={{
                  fontSize: p.price.length > 5 ? 26 : 40,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {p.price}
              </span>
              {p.unit && (
                <span style={{ fontSize: 15, color: "var(--muted)" }}>{p.unit}</span>
              )}
            </div>
            <div
              style={{ height: 1, background: "var(--line-2)", margin: "22px 0" }}
            />
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flex: 1,
              }}
            >
              {p.feats.map((f, j) => (
                <li
                  key={j}
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 14.5,
                    color: "var(--ink-2)",
                  }}
                >
                  <Icon
                    name="check"
                    size={18}
                    style={{ color: "var(--green)", flex: "none", marginTop: 2 }}
                  />{" "}
                  {f}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 26 }}>
              <Btn variant={p.variant} full size="md" onClick={onStart}>
                {p.cta}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA({ onStart }: { onStart: () => void }) {
  return (
    <section
      style={{ padding: "30px 24px 80px", maxWidth: "var(--maxw)", margin: "0 auto" }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 32,
          overflow: "hidden",
          background: "var(--grad)",
          padding: "70px 30px",
          textAlign: "center",
          boxShadow: "0 30px 70px rgba(99,102,241,.35)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -40,
            width: 320,
            height: 320,
            borderRadius: 99,
            background: "rgba(255,255,255,.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -50,
            width: 320,
            height: 320,
            borderRadius: 99,
            background: "rgba(255,255,255,.10)",
          }}
        />
        <div style={{ position: "relative" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            เริ่มวิเคราะห์ Requirement
            <br />
            ของคุณวันนี้
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,.85)",
              marginTop: 16,
              maxWidth: 520,
              marginInline: "auto",
            }}
          >
            เปลี่ยนเสียงสนทนาให้เป็นแผนงานที่พร้อมส่งลูกค้า — ฟรี ไม่ต้องใช้บัตรเครดิต
          </p>
          <div
            style={{ marginTop: 30, display: "flex", justifyContent: "center" }}
          >
            <Btn
              size="lg"
              variant="ghost"
              icon="arrow-right"
              onClick={onStart}
              style={{ background: "#fff", color: "var(--brand-ink)" }}
            >
              เริ่มใช้งานฟรี
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        padding: "40px 24px",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Logo size={28} />
        <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
          © 2568 EazyScan · Turn conversations into project plans
        </p>
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 13.5,
            color: "var(--muted)",
          }}
        >
          <a href="#features">คุณสมบัติ</a>
          <a href="#pricing">ราคา</a>
          <a href="#">ความเป็นส่วนตัว</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const router = useRouter();
  const [login, setLogin] = useState(false);
  const onStart = () => router.push("/workspace");
  const onDemo = () => router.push("/results/sample");
  return (
    <div style={{ minHeight: "100vh" }}>
      <LandingNav onStart={onStart} onLogin={() => setLogin(true)} />
      <Hero onStart={onStart} onDemo={onDemo} />
      <Features />
      <HowItWorks />
      <Pricing onStart={onStart} />
      <CTA onStart={onStart} />
      <Footer />
      {login && (
        <ComingSoon
          title="เข้าสู่ระบบ"
          desc="ระบบบัญชีผู้ใช้กำลังจะมาเร็ว ๆ นี้ — ตอนนี้เริ่มใช้งานได้ฟรีในโหมดผู้เยี่ยมชม"
          onClose={() => setLogin(false)}
        />
      )}
    </div>
  );
}
