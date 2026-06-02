"use client";

import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ICONS } from "@/lib/icons";

const toKebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

/* ---------------- Icon ---------------- */
export function Icon({
  name,
  size = 20,
  stroke = 2,
  className = "",
  style = {},
}: {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}) {
  // tolerate PascalCase/camelCase icon names (e.g. from LLM output)
  const Cmp = ICONS[name] ?? ICONS[toKebab(name)] ?? ICONS["circle"];
  return (
    <span
      className={"ic " + className}
      style={{ width: size, height: size, ...style }}
      aria-hidden
    >
      {Cmp ? <Cmp width={size} height={size} strokeWidth={stroke} /> : null}
    </span>
  );
}

/* ---------------- Logo ---------------- */
export function Logo({
  size = 34,
  showText = true,
  light = false,
}: {
  size?: number;
  showText?: boolean;
  light?: boolean;
}) {
  const bars = [0.4, 0.75, 1, 0.55, 0.85, 0.35];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          background: "var(--grad)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: size * 0.06,
          boxShadow: "0 6px 16px rgba(99,102,241,.35)",
          flex: "none",
          position: "relative",
        }}
      >
        {bars.map((h, i) => (
          <span
            key={i}
            style={{
              width: Math.max(2, size * 0.066),
              height: size * 0.5 * h,
              background: "rgba(255,255,255,.95)",
              borderRadius: 4,
            }}
          />
        ))}
      </div>
      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: size * 0.56,
            letterSpacing: "-0.02em",
            color: light ? "#fff" : "var(--ink)",
          }}
        >
          Eazy
          <span style={{ color: light ? "#cdd6ff" : "var(--brand-ink)" }}>
            Scan
          </span>
        </span>
      )}
    </div>
  );
}

/* ---------------- Button ---------------- */
type BtnVariant =
  | "primary"
  | "dark"
  | "ghost"
  | "soft"
  | "subtle"
  | "danger";

export function Btn({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  onClick,
  style = {},
  full = false,
  type,
  disabled,
  as,
  href,
}: {
  children?: ReactNode;
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconRight?: string;
  onClick?: () => void;
  style?: CSSProperties;
  full?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  as?: "button" | "a";
  href?: string;
}) {
  const sizes = {
    sm: { padding: "8px 15px", fontSize: 14, gap: 7, radius: 10 },
    md: { padding: "11px 20px", fontSize: 15.5, gap: 8, radius: 13 },
    lg: { padding: "15px 28px", fontSize: 17, gap: 10, radius: 16 },
  }[size];
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: {
      background: "var(--grad)",
      color: "#fff",
      boxShadow: "0 8px 20px rgba(99,102,241,.28)",
      border: "none",
    },
    dark: {
      background: "var(--ink)",
      color: "#fff",
      border: "none",
      boxShadow: "0 6px 16px rgba(23,23,35,.18)",
    },
    ghost: {
      background: "var(--surface)",
      color: "var(--ink)",
      border: "1px solid var(--line)",
      boxShadow: "var(--sh-sm)",
    },
    soft: {
      background: "var(--brand-soft)",
      color: "var(--brand-ink)",
      border: "1px solid transparent",
    },
    subtle: {
      background: "transparent",
      color: "var(--ink-2)",
      border: "1px solid transparent",
    },
    danger: {
      background: "var(--rose-soft)",
      color: "var(--rose)",
      border: "1px solid transparent",
    },
  };
  const [hover, setHover] = useState(false);
  const common: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.gap,
    padding: sizes.padding,
    fontSize: sizes.fontSize,
    fontWeight: 600,
    borderRadius: sizes.radius,
    width: full ? "100%" : "auto",
    transition:
      "transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .2s, filter .2s",
    transform: hover ? "translateY(-1.5px)" : "none",
    filter: hover ? "brightness(1.04)" : "none",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.55 : 1,
    pointerEvents: disabled ? "none" : "auto",
    ...variants[variant],
    ...style,
  };
  const inner = (
    <>
      {icon && <Icon name={icon} size={sizes.fontSize + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.fontSize + 2} />}
    </>
  );
  if (as === "a") {
    return (
      <a
        href={href}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={common}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={common}
    >
      {inner}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  children,
  style = {},
  pad = 24,
  hover = false,
  onClick,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      className={className}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--line)",
        padding: pad,
        boxShadow: h ? "var(--sh-lg)" : "var(--sh-md)",
        transform: h ? "translateY(-3px)" : "none",
        transition: "box-shadow .25s, transform .25s",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export const IMPACT: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  high: { label: "ผลกระทบสูง", color: "var(--rose)", bg: "var(--rose-soft)" },
  medium: {
    label: "ผลกระทบกลาง",
    color: "var(--amber)",
    bg: "var(--amber-soft)",
  },
  low: { label: "ผลกระทบต่ำ", color: "var(--green)", bg: "var(--green-soft)" },
};

/* ---------------- Tag ---------------- */
export function Tag({
  children,
  color = "var(--brand-ink)",
  bg = "var(--brand-soft)",
  icon,
  size = 13,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  icon?: string;
  size?: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size > 12 ? "5px 11px" : "3px 9px",
        borderRadius: 999,
        fontSize: size,
        fontWeight: 600,
        color,
        background: bg,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={size + 1} />}
      {children}
    </span>
  );
}

/* ---------------- CardHead ---------------- */
export function CardHead({
  icon,
  title,
  sub,
  color = "var(--brand-ink)",
  bg = "var(--brand-soft)",
  right,
}: {
  icon: string;
  title: string;
  sub?: string;
  color?: string;
  bg?: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 13,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Icon name={icon} size={21} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        {sub && (
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------------- CountUp ---------------- */
export function CountUp({
  to,
  dur = 900,
  suffix = "",
}: {
  to: number;
  dur?: number;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | undefined;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(to);
      return;
    }
    const tick = (t: number) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(e * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return (
    <>
      {n}
      {suffix}
    </>
  );
}

/* ---------------- CopyPrompt (editable, with re-run sim) ---------------- */
export function PromptFooter({
  prompt,
  onRerun,
}: {
  prompt: string;
  onRerun?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [val, setVal] = useState(prompt);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  const copy = () => {
    try {
      navigator.clipboard.writeText(val);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const rerun = async () => {
    setRunning(true);
    setRan(false);
    if (onRerun) await onRerun();
    else await new Promise((r) => setTimeout(r, 1600));
    setRunning(false);
    setRan(true);
    setTimeout(() => setRan(false), 2200);
  };

  return (
    <div
      style={{
        borderTop: "1px dashed var(--line)",
        marginTop: 16,
        paddingTop: 13,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
      >
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--muted)",
            padding: "5px 8px",
            borderRadius: 8,
          }}
        >
          <Icon name="terminal" size={14} /> AI Prompt ที่ใช้{" "}
          <Icon name={open ? "chevron-up" : "chevron-down"} size={14} />
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={copy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: copied ? "var(--green)" : "var(--brand-ink)",
            background: copied ? "var(--green-soft)" : "var(--brand-soft)",
            padding: "5px 11px",
            borderRadius: 8,
            transition: "all .2s",
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={14} />{" "}
          {copied ? "คัดลอกแล้ว" : "คัดลอก Prompt"}
        </button>
      </div>
      {open && (
        <div className="fadeUp" style={{ marginTop: 10 }}>
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            rows={5}
            className="mono"
            style={{
              width: "100%",
              padding: 13,
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--ink-2)",
              lineHeight: 1.7,
              resize: "vertical",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
            }}
          >
            <Btn
              size="sm"
              icon={running ? "loader-circle" : "refresh-cw"}
              onClick={rerun}
            >
              {running ? "กำลังวิเคราะห์ใหม่…" : "วิเคราะห์ใหม่"}
            </Btn>
            {ran && (
              <span
                className="fadeUp"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--green)",
                  display: "inline-flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <Icon name="check-circle-2" size={15} /> อัปเดตผลลัพธ์แล้ว
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
