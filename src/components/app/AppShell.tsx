"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, Logo, Btn } from "@/components/ui/primitives";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useIsMobile } from "@/lib/useMediaQuery";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SettingsDialog } from "@/components/app/SettingsDialog";

function SettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 500,
          color: "var(--ink-2)",
          background: "transparent",
          textAlign: "left",
          marginTop: 12,
          transition: "background .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Icon name="settings" size={19} /> ตั้งค่า
      </button>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function UserChip() {
  const user = useCurrentUser();
  const isGuest = !user;
  const name = user?.name ?? "ผู้เยี่ยมชม";
  const role = user?.role ?? (isGuest ? "ยังไม่ได้เข้าสู่ระบบ" : undefined);
  const initial = (user?.name ?? "").trim().charAt(0);
  const [login, setLogin] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
          padding: "8px 8px 0",
          borderTop: "1px solid var(--line-2)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 99,
            background: isGuest ? "var(--surface-2)" : "var(--grad)",
            color: isGuest ? "var(--faint)" : "#fff",
            border: isGuest ? "1px solid var(--line)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 15,
            flex: "none",
          }}
        >
          {isGuest ? <Icon name="user" size={18} /> : initial || <Icon name="user" size={18} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          {role && (
            <div style={{ fontSize: 12, color: "var(--faint)" }}>{role}</div>
          )}
        </div>
        {isGuest ? (
          <button
            onClick={() => setLogin(true)}
            aria-label="เข้าสู่ระบบ"
            style={{ color: "var(--brand-ink)", flex: "none" }}
          >
            <Icon name="arrow-up-right" size={17} />
          </button>
        ) : (
          <Icon name="settings" size={17} style={{ color: "var(--faint)" }} />
        )}
      </div>
      {login && (
        <ComingSoon
          title="เข้าสู่ระบบ"
          desc="ระบบบัญชีผู้ใช้กำลังจะมาเร็ว ๆ นี้ — ตอนนี้ใช้งานได้เต็มรูปแบบในโหมดผู้เยี่ยมชม"
          onClose={() => setLogin(false)}
        />
      )}
    </>
  );
}

const NAV = [
  { id: "workspace", label: "พื้นที่ทำงาน", icon: "audio-lines", href: "/workspace" },
  { id: "history", label: "ประวัติการวิเคราะห์", icon: "history", href: "/history" },
];

function SidebarBody({
  active,
  onNav,
  goHome,
}: {
  active: string;
  onNav: (href: string) => void;
  goHome: () => void;
}) {
  return (
    <>
      <div style={{ padding: "4px 8px 18px", cursor: "pointer" }} onClick={goHome}>
        <Logo size={30} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <Btn full icon="plus" size="md" onClick={() => onNav("/workspace")}>
          วิเคราะห์ใหม่
        </Btn>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--faint)",
            letterSpacing: "0.06em",
            padding: "8px 12px 6px",
          }}
        >
          เมนู
        </div>
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onNav(n.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: on ? 700 : 500,
                color: on ? "var(--brand-ink)" : "var(--ink-2)",
                background: on ? "var(--brand-soft)" : "transparent",
                textAlign: "left",
                transition: "all .15s",
              }}
            >
              <Icon name={n.icon} size={19} /> {n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <div
        style={{
          background: "var(--grad-soft)",
          borderRadius: 16,
          padding: 16,
          border: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 14.5,
          }}
        >
          <Icon name="zap" size={17} style={{ color: "var(--brand-ink)" }} /> แพ็กเกจ Free
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 10px" }}>
          เหลือ 3 จาก 5 ครั้งในเดือนนี้
        </div>
        <div
          style={{
            height: 6,
            background: "var(--surface)",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div style={{ width: "40%", height: "100%", background: "var(--grad)", borderRadius: 99 }} />
        </div>
        <Btn full size="sm" variant="primary" icon="arrow-up-right">
          อัปเกรดเป็น Pro
        </Btn>
      </div>
      <SettingsButton />
      <UserChip />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const active = pathname.startsWith("/history") ? "history" : "workspace";
  const [drawer, setDrawer] = useState(false);

  // warm the sibling routes so in-app navigation is instant
  useEffect(() => {
    router.prefetch("/workspace");
    router.prefetch("/history");
  }, [router]);

  // close the drawer whenever the route changes
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const goHome = () => router.push("/");
  const onNav = (href: string) => {
    router.push(href);
    setDrawer(false);
  };

  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        {/* mobile top app bar */}
        <header
          style={{
            height: 56,
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 14px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--line)",
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setDrawer(true)}
            aria-label="เปิดเมนู"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-2)",
              flex: "none",
            }}
          >
            <Icon name="menu" size={22} />
          </button>
          <div onClick={goHome} style={{ cursor: "pointer" }}>
            <Logo size={26} />
          </div>
          <div style={{ flex: 1 }} />
          <Btn size="sm" icon="plus" onClick={() => onNav("/workspace")}>
            ใหม่
          </Btn>
        </header>

        {/* drawer + backdrop */}
        {drawer && (
          <div
            onClick={() => setDrawer(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(23,23,40,.42)",
              backdropFilter: "blur(2px)",
              zIndex: 100,
              animation: "fadeIn .2s",
            }}
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "82%",
                maxWidth: 300,
                background: "var(--surface)",
                borderRight: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                padding: "18px 16px",
                overflowY: "auto",
                animation: "slideInLeft .25s cubic-bezier(.2,.7,.3,1) both",
              }}
            >
              <SidebarBody active={active} onNav={onNav} goHome={goHome} />
            </aside>
          </div>
        )}

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {children}
        </main>
      </div>
    );
  }

  // desktop: fixed sidebar
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <aside
        style={{
          width: 256,
          flex: "none",
          background: "var(--surface)",
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
        }}
      >
        <SidebarBody active={active} onNav={onNav} goHome={goHome} />
      </aside>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </main>
    </div>
  );
}

export function TopBar({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        minHeight: 72,
        flex: "none",
        borderBottom: "1px solid var(--line)",
        background: "rgba(255,255,255,.7)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "12px 16px" : "0 28px",
        gap: 12,
        flexWrap: isMobile ? "wrap" : "nowrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontSize: isMobile ? 17 : 19,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
        {sub && (
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
