"use client";

import { useState } from "react";

/* ─────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    section: "PLATFORM",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/superadmin/platform/dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        id: "salon",
        label: "Salon & Spa",
        href: "/superadmin/platform/salons",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 7h18v13H3z" /><path d="M8 7V5a4 4 0 0 1 8 0v2" />
          </svg>
        ),
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        href: "/superadmin/platform/subscriptions",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        ),
      },
      {
        id: "users",
        label: "Users",
        href: "/superadmin/platform/users",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        id: "regions",
        label: "Regions & Franchise",
        href: "/superadmin/platform/regions",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      {
        id: "commission",
        label: "Commission",
        href: "/superadmin/management/commission",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        id: "automation",
        label: "Automation",
        href: "/superadmin/management/automation",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        id: "ai",
        label: "AI Insights",
        href: "/superadmin/management/ai-insights",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        ),
      },
      {
        id: "reports",
        label: "Reports",
        href: "/superadmin/management/reports",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        ),
      },
      {
        id: "support",
        label: "Support",
        href: "/superadmin/management/support",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "ADVANCED",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        href: "/superadmin/advanced/notifications",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        id: "whitelabel",
        label: "White Label",
        href: "/superadmin/advanced/white-label",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="14" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
        ),
      },
      {
        id: "compliance",
        label: "Compliance",
        href: "/superadmin/advanced/compliance",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        id: "sysmonitor",
        label: "System Monitor",
        href: "/superadmin/advanced/system-monitor",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        ),
      },
      {
        id: "founder",
        label: "Founder Mode",
        href: "/superadmin/advanced/founder",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
        founder: true,
      },
    ],
  },
];

/* ─────────────────────────────────────────
   PAGE TITLES MAP
───────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  "/superadmin":              "Global Dashboard",
  "/superadmin/platform/salons":       "Salon & Spa",
  "/superadmin/platform/subscriptions":"Subscriptions",
  "/superadmin/platform/users":        "Users",
  "/superadmin/platform/region":      "Regions & Franchise",
  "/superadmin/management/commission":   "Commission",
  "/superadmin/management/automation":   "Automation",
  "/superadmin/management/ai-insights":  "AI Insights",
  "/superadmin/management/reports":      "Reports",
  "/superadmin/management/support":      "Support",
  "/superadmin/advanced/notifications": "Notifications",
  "/superadmin/advanced/white-label":  "White Label",
  "/superadmin/advanced/compliance":   "Compliance",
  "/superadmin/advanced/system-monitor": "System Monitor",
  "/superadmin/advanced/founder":      "Founder Mode",
};

/* ─────────────────────────────────────────
   SIDEBAR COMPONENT
───────────────────────────────────────── */
function Sidebar({
  activePath,
  collapsed,
  onToggle,
  onNavigate,
}: {
  activePath: string;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        minWidth: collapsed ? 60 : 220,
        background: "#1a1208",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.2s ease, min-width 0.2s ease",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 16px",
          borderBottom: "1px solid #2e2010",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#c8922a", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          n
        </div>
        {!collapsed && (
          <span
            style={{
              fontSize: 18, fontWeight: 600, color: "#fff",
              letterSpacing: "-0.5px", whiteSpace: "nowrap",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            nex<span style={{ color: "#e8b84b" }}>Slon</span>
          </span>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "#5a4a35", padding: 4, flexShrink: 0,
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>
      </div>

      {/* Nav sections */}
      {NAV_SECTIONS.map(({ section, items }) => (
        <div key={section}>
          {!collapsed && (
            <div
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "1.2px",
                textTransform: "uppercase", color: "#5a4a35",
                padding: "16px 16px 5px",
              }}
            >
              {section}
            </div>
          )}
          {collapsed && <div style={{ height: 8 }} />}

          {items.map(({ id, label, href, icon, founder }) => {
            const isActive = activePath === href || 
              (href !== "/superadmin" && activePath.startsWith(href));
            return (
              <div
                key={id}
                onClick={() => onNavigate(href)}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? "10px 0" : "9px 16px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  color: founder ? "#e8b84b" : isActive ? "#fff" : "#c5b49a",
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  background: isActive ? "#2e1f05" : "transparent",
                  position: "relative",
                  transition: "background 0.12s, color 0.12s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#2a1a06";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: 3, background: "#c8922a", borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
                <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          padding: "14px 16px",
          borderTop: "1px solid #2e2010",
        }}
      >
        {!collapsed ? (
          <>
            <div style={{ fontSize: 11, color: "#7a6a55", marginBottom: 3, fontWeight: 500 }}>
              Platform Status
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#a0906e" }}>
              <span
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#27ae60", flexShrink: 0, display: "inline-block",
                }}
              />
              All systems operational
            </div>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#27ae60", display: "inline-block",
              }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   TOPBAR COMPONENT
───────────────────────────────────────── */
function Topbar({ pageTitle }: { pageTitle: string }) {
  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #e8e0d4",
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Page title */}
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 16, fontWeight: 600,
          color: "#1a1208", whiteSpace: "nowrap",
        }}
      >
        {pageTitle}
      </span>

      {/* Search bar */}
      <div
        style={{
          flex: 1, maxWidth: 360,
          display: "flex", alignItems: "center", gap: 8,
          background: "#f7f4ef", border: "1px solid #e8e0d4",
          borderRadius: 8, padding: "7px 12px",
          fontSize: 13, color: "#7a6a55", cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span>Search salons, users, invoices...</span>
        <span
          style={{
            marginLeft: "auto", background: "#e8e0d4",
            borderRadius: 4, padding: "1px 5px",
            fontSize: 10, color: "#7a6a55",
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Quick Action */}
        <button
          style={{
            background: "#c8922a", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Quick Action
        </button>

        {/* Bell */}
        <button
          style={{
            width: 36, height: 36, border: "1px solid #e8e0d4",
            borderRadius: 8, background: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7a6a55",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Settings */}
        <button
          style={{
            width: 36, height: 36, border: "1px solid #e8e0d4",
            borderRadius: 8, background: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7a6a55",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
        </button>

        {/* Avatar chip */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 12px 4px 4px",
            border: "1px solid #e8e0d4", borderRadius: 20, cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#c8922a", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600,
            }}
          >
            SA
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1a1208" }}>Super Admin</div>
            <div style={{ fontSize: 10.5, color: "#7a6a55" }}>Platform Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────── */
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // For active path detection in Next.js App Router,
  // we track clicks manually (since we can't use usePathname in layout easily)
  // If you want to use usePathname, add: import { usePathname } from "next/navigation";
  // and replace activePath state with: const activePath = usePathname();
  const [activePath, setActivePath] = useState("/superadmin");

  const handleNavigate = (href: string) => {
    setActivePath(href);
    // In a real Next.js app, use router.push(href) or <Link> instead:
    // import { useRouter } from "next/navigation";
    // const router = useRouter();
    // router.push(href);
  };

  const pageTitle = PAGE_TITLES[activePath] ?? "Dashboard";

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; }
          body { font-family: 'DM Sans', sans-serif; background: #f7f4ef; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #1a1208; }
          ::-webkit-scrollbar-thumb { background: #3a2810; border-radius: 2px; }
          .main-scroll::-webkit-scrollbar { width: 5px; }
          .main-scroll::-webkit-scrollbar-track { background: #f7f4ef; }
          .main-scroll::-webkit-scrollbar-thumb { background: #e8d5b0; border-radius: 2px; }
        `}</style>
      </head>
      <body>
        <div
          style={{
            display: "flex",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          {/* ── SIDEBAR ── */}
          <Sidebar
            activePath={activePath}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            onNavigate={handleNavigate}
          />

          {/* ── MAIN AREA ── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── TOPBAR ── */}
            <Topbar pageTitle={pageTitle} />

            {/* ── PAGE CONTENT (children from page.tsx) ── */}
            <main
              className="main-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "28px",
                background: "#f7f4ef",
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}