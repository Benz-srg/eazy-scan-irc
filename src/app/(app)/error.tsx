"use client";

import { useEffect } from "react";
import { Icon, Btn } from "@/components/ui/primitives";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        minHeight: "60vh",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "var(--rose-soft)",
            color: "var(--rose)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Icon name="triangle-alert" size={30} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>เกิดข้อผิดพลาด</h2>
        <p style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.65 }}>
          มีบางอย่างผิดพลาดในหน้านี้ ลองใหม่อีกครั้ง
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22 }}>
          <Btn icon="refresh-cw" onClick={reset}>
            ลองใหม่
          </Btn>
        </div>
      </div>
    </div>
  );
}
