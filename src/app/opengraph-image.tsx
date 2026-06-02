import { ImageResponse } from "next/og";

export const alt =
  "EazyScan — Turn client conversations into Scope of Work & Manday";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Mark() {
  const bars = [0.4, 0.75, 1, 0.55, 0.85, 0.35];
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: 30,
        background: "linear-gradient(135deg, #6366f1 0%, #7385f4 45%, #60a5fa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        boxShadow: "0 18px 40px rgba(99,102,241,0.35)",
      }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: Math.round(50 * h),
            borderRadius: 4,
            background: "rgba(255,255,255,0.96)",
          }}
        />
      ))}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f5f6fb",
          backgroundImage:
            "radial-gradient(1100px 520px at 50% -10%, rgba(99,102,241,0.14), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Mark />
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 800,
              color: "#171723",
              letterSpacing: -1,
            }}
          >
            <span>Eazy</span>
            <span style={{ color: "#4f46e5" }}>Scan</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: "#171723",
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            Turn client voice into Scope of Work & Manday
          </div>
          <div style={{ fontSize: 30, color: "#6f6f86", maxWidth: 900 }}>
            AI transcribes the requirement call, then drafts SOW, manday estimate,
            risks and the questions to ask back.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Speech-to-Text", "AI Analysis", "Manday Estimate", "DOCX / PDF"].map(
            (t) => (
              <div
                key={t}
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#4f46e5",
                  background: "#eef0fe",
                  border: "1px solid #e9e9f1",
                  borderRadius: 999,
                  padding: "10px 22px",
                }}
              >
                {t}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
