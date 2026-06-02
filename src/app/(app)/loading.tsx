import { Icon } from "@/components/ui/primitives";

export default function AppLoading() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "var(--muted)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Icon name="loader-circle" size={30} className="spin" style={{ color: "var(--brand-ink)" }} />
        <div style={{ marginTop: 12, fontSize: 15 }}>กำลังโหลด…</div>
      </div>
    </div>
  );
}
