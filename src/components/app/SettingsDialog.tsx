"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { Icon, Btn } from "@/components/ui/primitives";
import { apiKeyAtom, providerAtom, maskApiKey } from "@/lib/atoms";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [savedKey, setSavedKey] = useAtom(apiKeyAtom);
  const [provider, setProvider] = useAtom(providerAtom);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(!savedKey);

  const save = () => {
    const v = draft.trim();
    if (!v) return;
    setSavedKey(v);
    setDraft("");
    setEditing(false);
  };
  const remove = () => {
    setSavedKey("");
    setDraft("");
    setEditing(true);
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
        aria-label="ตั้งค่า"
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
          <h3 style={{ fontSize: 20, fontWeight: 800 }}>ตั้งค่า</h3>
          <button onClick={onClose} aria-label="ปิด" style={{ color: "var(--faint)" }}>
            <Icon name="x" size={22} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 22 }}>
          ตั้งค่าบริการถอดเสียงและ API key ของคุณ
        </p>

        {/* provider */}
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
          บริการถอดเสียงเริ่มต้น
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {(
            [
              { id: "local", t: "Local Whisper", d: "ฟรี · ในเครื่อง", icon: "cpu" },
              { id: "openai", t: "OpenAI Whisper", d: "เร็ว · แม่นยำ", icon: "sparkles" },
            ] as const
          ).map((o) => {
            const on = provider === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setProvider(o.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: `1.5px solid ${on ? "var(--brand)" : "var(--line)"}`,
                  background: on ? "var(--brand-soft)" : "var(--surface)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  transition: "all .15s",
                }}
              >
                <Icon name={o.icon} size={18} style={{ color: "var(--brand-ink)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{o.t}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{o.d}</div>
                </div>
                <Icon
                  name={on ? "check-circle-2" : "circle"}
                  size={17}
                  style={{ color: on ? "var(--brand)" : "var(--line)" }}
                />
              </button>
            );
          })}
        </div>


        {/* api key */}
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
          OpenAI API Key
        </div>
        {savedKey && !editing ? (
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
            <button
              onClick={() => {
                setDraft(savedKey);
                setEditing(true);
              }}
              style={{ color: "var(--brand-ink)", fontSize: 12.5, fontWeight: 600, padding: "4px 8px", borderRadius: 8 }}
            >
              เปลี่ยน
            </button>
            <button
              onClick={remove}
              style={{ color: "var(--rose)", fontSize: 12.5, fontWeight: 600, padding: "4px 8px", borderRadius: 8 }}
            >
              ลบ
            </button>
          </div>
        ) : (
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
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="sk-..."
              className="mono"
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 14 }}
            />
            {draft.trim() && (
              <button
                onClick={save}
                style={{ color: "var(--brand-ink)", fontSize: 12.5, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}
              >
                บันทึก
              </button>
            )}
            {savedKey && (
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft("");
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
          <Icon name="shield" size={13} style={{ marginTop: 2, flex: "none" }} /> เก็บในเบราว์เซอร์นี้เท่านั้น ไม่ถูกบันทึกที่เซิร์ฟเวอร์ของเรา ส่งให้เซิร์ฟเวอร์เฉพาะตอนถอดเสียงด้วย OpenAI
        </p>

        <div style={{ marginTop: 22 }}>
          <Btn full size="md" onClick={onClose}>
            เสร็จสิ้น
          </Btn>
        </div>
      </div>
    </div>
  );
}
