"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  founder?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

/* ─────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────── */
const NAV_SECTIONS: NavSection[] = [
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
            <path d="M3 7h18v13H3z" />
            <path d="M8 7V5a4 4 0 0 1 8 0v2" />
          </svg>
        ),
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        href: "/superadmin/platform/subscriptions",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        id: "ai",
        label: "AI Insights",
        href: "/superadmin/management/ai-insights",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
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
        founder: true,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
      },
    ],
  },
];

/* ─────────────────────────────────────────
   PAGE TITLES MAP
───────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  "/superadmin/platform/dashboard":      "Global Dashboard",
  "/superadmin/platform/salons":         "Salon & Spa",
  "/superadmin/platform/subscriptions":  "Subscriptions",
  "/superadmin/platform/users":          "Users",
  "/superadmin/platform/regions":        "Regions & Franchise",
  "/superadmin/management/commission":   "Commission",
  "/superadmin/management/automation":   "Automation",
  "/superadmin/management/ai-insights":  "AI Insights",
  "/superadmin/management/reports":      "Reports",
  "/superadmin/management/support":      "Support",
  "/superadmin/advanced/notifications":  "Notifications",
  "/superadmin/advanced/white-label":    "White Label",
  "/superadmin/advanced/compliance":     "Compliance",
  "/superadmin/advanced/system-monitor": "System Monitor",
  "/superadmin/advanced/founder":        "Founder Mode",
};

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`
        flex flex-col flex-shrink-0 overflow-y-auto overflow-x-hidden
        bg-[#1a1208] transition-all duration-200 ease-in-out
        ${collapsed ? "w-[60px] min-w-[60px]" : "w-[220px] min-w-[220px]"}
      `}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-[#2e2010] overflow-hidden flex-shrink-0">
        <div
          className="w-[34px] h-[34px] rounded-lg bg-[#c8922a] flex-shrink-0
                     flex items-center justify-center text-white font-bold text-base"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          n
        </div>

        {!collapsed && (
          <span
            className="text-[18px] font-semibold text-white whitespace-nowrap tracking-tight"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            nex<span className="text-[#e8b84b]">Slon</span>
          </span>
        )}

        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto p-1 flex-shrink-0 bg-transparent border-none cursor-pointer
                     text-[#5a4a35] hover:text-[#c5b49a] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>
      </div>

      {/* ── Nav sections ── */}
      {NAV_SECTIONS.map(({ section, items }) => (
        <div key={section}>
          {!collapsed ? (
            <p className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-[1.2px] uppercase text-[#5a4a35]">
              {section}
            </p>
          ) : (
            <div className="h-2" />
          )}

          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center relative whitespace-nowrap overflow-hidden
                  text-[13.5px] no-underline transition-colors duration-100
                  ${collapsed ? "justify-center py-2.5 px-0" : "gap-2.5 py-[9px] px-4"}
                  ${
                    item.founder
                      ? "text-[#e8b84b] font-medium hover:bg-[#2a1a06]"
                      : active
                        ? "text-white font-medium bg-[#2e1f05]"
                        : "text-[#c5b49a] font-normal hover:bg-[#2a1a06] hover:text-[#e8d5b8]"
                  }
                `}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {/* Active left indicator */}
                {active && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c8922a] rounded-r-[2px]" />
                )}

                {/* Icon */}
                <span className={`flex-shrink-0 ${active ? "opacity-100" : "opacity-70"}`}>
                  {item.icon}
                </span>

                {/* Label */}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      {/* ── Footer ── */}
      <div className="mt-auto px-4 py-3.5 border-t border-[#2e2010]">
        {!collapsed ? (
          <>
            <p className="text-[11px] text-[#7a6a55] font-medium mb-0.5">Platform Status</p>
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#a0906e]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#27ae60] flex-shrink-0 inline-block" />
              All systems operational
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <span className="w-[7px] h-[7px] rounded-full bg-[#27ae60] inline-block" />
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   TOPBAR
───────────────────────────────────────── */
function Topbar({ pageTitle }: { pageTitle: string }) {
  return (
    <header
      className="flex items-center gap-3.5 h-[60px] px-6 bg-white border-b border-[#e8e0d4] flex-shrink-0"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Page title */}
      <span
        className="text-base font-semibold text-[#1a1208] whitespace-nowrap"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {pageTitle}
      </span>

      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-[360px] bg-[#f7f4ef] border border-[#e8e0d4] rounded-lg px-3 py-[7px] text-[13px] text-[#7a6a55] cursor-pointer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span>Search salons, users, invoices...</span>
        <span className="ml-auto bg-[#e8e0d4] rounded px-1 py-px text-[10px] text-[#7a6a55]">
          ⌘K
        </span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2.5">
        {/* Quick Action */}
        <button
          className="flex items-center gap-1.5 bg-[#c8922a] hover:bg-[#b07d20] text-white
                     border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Quick Action
        </button>

        {/* Bell */}
        <button className="w-9 h-9 flex items-center justify-center border border-[#e8e0d4] rounded-lg
                           bg-transparent cursor-pointer text-[#7a6a55] hover:border-[#c8922a] hover:text-[#c8922a] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Settings */}
        <button className="w-9 h-9 flex items-center justify-center border border-[#e8e0d4] rounded-lg
                           bg-transparent cursor-pointer text-[#7a6a55] hover:border-[#c8922a] hover:text-[#c8922a] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
        </button>

        {/* Avatar chip */}
        <div className="flex items-center gap-2 pl-1 pr-3 py-1 border border-[#e8e0d4] rounded-full
                        cursor-pointer hover:border-[#c8922a] transition-colors">
          <div className="w-[30px] h-[30px] rounded-full bg-[#c8922a] text-white flex items-center justify-center text-xs font-semibold">
            SA
          </div>
          <div className="leading-tight">
            <p className="text-[12.5px] font-medium text-[#1a1208]">Super Admin</p>
            <p className="text-[10.5px] text-[#7a6a55]">Platform Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────
   LAYOUT — default export
   Place at: app/superadmin/layout.tsx
   
   ⚠️  NO <html> or <body> tags here.
       Those belong in app/layout.tsx only.
───────────────────────────────────────── */
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Global Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f4ef]">
      {/* SIDEBAR */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <Topbar pageTitle={pageTitle} />

        {/* PAGE CONTENT — injected by page.tsx */}
        <main className="flex-1 overflow-y-auto p-7 bg-[#f7f4ef]">
          {children}
        </main>
      </div>
    </div>
  );
}