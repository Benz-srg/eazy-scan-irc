import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bars = [0.4, 0.75, 1, 0.55, 0.85, 0.35];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 11,
          background: "linear-gradient(135deg, #6366f1 0%, #7385f4 45%, #60a5fa 100%)",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: Math.round(96 * h),
              borderRadius: 7,
              background: "rgba(255,255,255,0.96)",
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
