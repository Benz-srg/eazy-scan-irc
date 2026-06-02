import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "var(--brand-ink)", letterSpacing: "-0.03em" }}>
          404
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>ไม่พบหน้านี้</h1>
        <p style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 8 }}>
          หน้าที่คุณกำลังหาอาจถูกย้ายหรือไม่มีอยู่
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginTop: 20,
            padding: "11px 20px",
            borderRadius: 13,
            background: "var(--grad)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15.5,
          }}
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
