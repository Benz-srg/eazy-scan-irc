"use client";

import { Icon, Btn } from "@/components/ui/primitives";

export function ComingSoon({
  title,
  desc,
  onClose,
}: {
  title: string;
  desc?: string;
  onClose: () => void;
}) {
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
        aria-label={title}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          boxShadow: "var(--sh-lg)",
          animation: "pop .35s cubic-bezier(.2,.8,.3,1) both",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "var(--grad-soft)",
            color: "var(--brand-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="sparkles" size={30} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>{title}</h3>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--brand-ink)",
            background: "var(--brand-soft)",
          }}
        >
          <Icon name="clock" size={13} /> เร็ว ๆ นี้
        </div>
        {desc && (
          <p
            style={{
              fontSize: 14.5,
              color: "var(--muted)",
              lineHeight: 1.6,
              marginTop: 14,
            }}
          >
            {desc}
          </p>
        )}
        <div style={{ marginTop: 22 }}>
          <Btn full size="md" onClick={onClose}>
            เข้าใจแล้ว
          </Btn>
        </div>
      </div>
    </div>
  );
}
