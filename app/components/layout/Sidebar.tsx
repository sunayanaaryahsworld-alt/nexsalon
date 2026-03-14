"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface NavItem {
    id: string;
    label: string;
    shortLabel: string;
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
                shortLabel: "Dash",
                href: "/superadmin/platform/dashboard",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                ),
            },
            {
                id: "salon",
                label: "Salon & Spa",
                shortLabel: "Salon",
                href: "/superadmin/platform/salons",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 7h18v13H3z" />
                        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                    </svg>
                ),
            },
            {
                id: "subscriptions",
                label: "Subscriptions",
                shortLabel: "Subs",
                href: "/superadmin/platform/subscriptions",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                ),
            },
            {
                id: "users",
                label: "Users",
                shortLabel: "Users",
                href: "/superadmin/platform/users",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
                shortLabel: "Regions",
                href: "/superadmin/platform/regions",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
                shortLabel: "Comm",
                href: "/superadmin/management/commission",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12" /><path d="M6 8h12" />
                        <path d="M6 13h6a4 4 0 0 1 0 8" /><path d="M6 13l8 8" />
                    </svg>
                ),
            },
            {
                id: "reports",
                label: "Reports",
                shortLabel: "Reports",
                href: "/superadmin/management/reports",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                    </svg>
                ),
            },
            {
                id: "blogs",
                label: "Blogs",
                shortLabel: "Blogs",
                href: "/superadmin/management/form",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
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
                shortLabel: "Notifs",
                href: "/superadmin/advanced/notifications",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                ),
            },
            {
                id: "whitelabel",
                label: "White Label",
                shortLabel: "Label",
                href: "/superadmin/advanced/white-label",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="14" rx="2" />
                        <path d="M9 9h6M9 12h6M9 15h4" />
                    </svg>
                ),
            },
            {
                id: "compliance",
                label: "Compliance",
                shortLabel: "Comply",
                href: "/superadmin/advanced/compliance",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                ),
            },
            {
                id: "sysmonitor",
                label: "System Monitor",
                shortLabel: "Monitor",
                href: "/superadmin/advanced/system-monitor",
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                    </svg>
                ),
            },
            {
                id: "founder",
                label: "Founder Mode",
                shortLabel: "Founder",
                href: "/superadmin/advanced/founder",
                founder: true,
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                ),
            },
        ],
    },
];

/* ─────────────────────────────────────────
   BOTTOM NAV ITEMS (5 primary tabs)
───────────────────────────────────────── */
const BOTTOM_NAV_ITEMS = [
    {
        id: "home",
        shortLabel: "Home",
        href: "/superadmin/platform/dashboard",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        id: "Salon & Spa",
        shortLabel: "Salons",
        href: "/superadmin/platform/salons",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        id: "Users",
        shortLabel: "Users",
        href: "/superadmin/platform/users",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        id: "Subscription",
        shortLabel: "Subscription",
        href: "/superadmin/platform/subscriptions",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
    {
        id: "more",
        shortLabel: "More",
        href: "#",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="12" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
            </svg>
        ),
    },
] as const;

/* ─────────────────────────────────────────
   LOGO MARK
───────────────────────────────────────── */
function LogoMark() {
    return (
        <div className="w-9 h-9 bg-[#2C1E17] rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2">
                <path d="M12 2C8 2 5 6 5 10c0 5 7 12 7 12s7-7 7-12c0-4-3-8-7-8z" />
                <circle cx="12" cy="10" r="2.5" />
            </svg>
        </div>
    );
}

/* ─────────────────────────────────────────
   SIDEBAR NAV CONTENT
───────────────────────────────────────── */
function SidebarNavContent({
    collapsed,
    onNavClick,
}: {
    collapsed: boolean;
    onNavClick?: () => void;
}) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    return (
        <nav className="flex-1 overflow-y-auto py-2">
            {NAV_SECTIONS.map(({ section, items }) => (
                <div key={section}>
                    {!collapsed && (
                        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase text-[#9B8070] tracking-[1.3px]">
                            {section}
                        </p>
                    )}
                    {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={onNavClick}
                                title={collapsed ? item.label : undefined}
                                className={[
                                    "flex items-center gap-3 px-3 mx-2 rounded-xl h-[44px]",
                                    "transition-colors duration-150",
                                    active
                                        ? "bg-[#F5EDE0] text-[#7A5210]"
                                        : "text-[#3A2A20] hover:bg-[#FAF5EF]",
                                ].join(" ")}
                            >
                                <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0">
                                    {item.icon}
                                </span>
                                {!collapsed && (
                                    <span className="text-[13.5px] truncate font-medium">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}

/* ─────────────────────────────────────────
   DESKTOP SIDEBAR
   Visible only on lg+
───────────────────────────────────────── */
export function DesktopSidebar({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    const EXPANDED = 252;
    const COLLAPSED = 72;

    return (
        <div
            className="hidden lg:flex flex-col relative"
            style={{
                width: collapsed ? COLLAPSED : EXPANDED,
                minWidth: collapsed ? COLLAPSED : EXPANDED,
                transition: "width 0.25s ease",
            }}
        >
            <aside className="flex flex-col h-full bg-white border-r border-[#EBE0D2]">

                {/* Header */}
                <div
                    className="h-[64px] flex items-center border-b border-[#EBE0D2]"
                    style={{
                        gap: collapsed ? 0 : 12,
                        justifyContent: collapsed ? "center" : "flex-start",
                        paddingLeft: collapsed ? 0 : 16,
                        paddingRight: 16,
                    }}
                >
                    <LogoMark />
                    {!collapsed && (
                        <span className="font-bold text-[17px] text-[#2C1E17] tracking-wide">
                            <span className="text-[#C9A96E]">NEXSALON</span>
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <SidebarNavContent collapsed={collapsed} />

                {/* Bottom Bar */}
                <div
                    className={[
                        "border-t border-[#EBE0D2] flex items-center",
                        collapsed ? "justify-center py-3" : "px-5 py-4",
                    ].join(" ")}
                >
                    {collapsed ? (
                        <span className="text-[10px] font-semibold text-[#9B8070]">v1</span>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[1px] text-[#9B8070] font-semibold">
                                NexSalon
                            </span>
                            <span className="text-[12px] text-[#2C1E17] font-medium">
                                Super Admin Panel
                            </span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="absolute top-[32px] -right-[14px] w-7 h-7 rounded-full bg-white border border-[#D4C4B0] flex items-center justify-center shadow-sm hover:bg-[#FAF5EF] transition-colors z-10"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7A5210"
                    strokeWidth="2.5"
                    style={{
                        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s ease",
                    }}
                >
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────
   MORE DRAWER (internal, mobile only)
   Slide-up bottom sheet with full nav
───────────────────────────────────────── */
function MoreDrawer({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={[
                    "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] lg:hidden",
                    "transition-opacity duration-300",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                ].join(" ")}
            />

            {/* Bottom sheet panel */}
            <div
                className={[
                    "fixed bottom-0 left-0 right-0 z-[60] lg:hidden",
                    "bg-white rounded-t-[24px] shadow-2xl flex flex-col",
                    "max-h-[84vh]",
                    "transition-transform duration-300 ease-out",
                    open ? "translate-y-0" : "translate-y-full",
                ].join(" ")}
            >
                {/* Drag handle */}
                <div className="w-10 h-[5px] bg-[#D4C4B0] rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#EBE0D2] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <LogoMark />
                        <span className="font-bold text-[17px] tracking-wide text-[#2C1E17]">
                            <span className="text-[#C9A96E]">NEXSALON</span>
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8A7060] hover:text-[#2C1E17] hover:bg-[#F5EDE0] transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable nav content */}
                <div className="overflow-y-auto flex-1">
                    <SidebarNavContent collapsed={false} onNavClick={onClose} />
                </div>

                {/* Footer */}
                <div
                    className="flex-shrink-0 border-t border-[#EBE0D2] px-5 py-3"
                    style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
                >
                    <span className="text-[9px] uppercase tracking-[1px] text-[#9B8070] font-semibold block">
                        NexSalon
                    </span>
                    <span className="text-[12px] text-[#2C1E17] font-medium">
                        Super Admin Panel
                    </span>
                </div>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────
   MOBILE BOTTOM NAV
   Hidden on lg+, fixed at bottom on mobile
   "More" opens the MoreDrawer
───────────────────────────────────────── */
export function MobileBottomNav() {
    const pathname = usePathname();
    const [moreOpen, setMoreOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "#") return false;
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <>
            <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />

            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EBE0D2]"
                style={{
                    height: 64,
                    boxShadow: "0 -4px 20px rgba(44,30,23,0.07)",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}
            >
                <div className="flex items-stretch h-full">
                    {BOTTOM_NAV_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        const isMore = item.id === "more";

                        /* Shared inner content */
                        const inner = (
                            <span
                                className="flex flex-col items-center justify-center gap-[3px] w-full h-full transition-colors duration-150"
                                style={{ color: active ? "#C9A96E" : "#9B8070" }}
                            >
                                <span
                                    className="flex items-center justify-center rounded-xl transition-all duration-150"
                                    style={{
                                        width: 36,
                                        height: 26,
                                        background: active
                                            ? "rgba(201,169,110,0.15)"
                                            : "transparent",
                                    }}
                                >
                                    {item.icon}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        lineHeight: 1,
                                        letterSpacing: "0.2px",
                                    }}
                                >
                                    {item.shortLabel}
                                </span>
                            </span>
                        );

                        if (isMore) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setMoreOpen(true)}
                                    className="flex-1 flex items-center justify-center border-none bg-transparent p-0 cursor-pointer"
                                    aria-label="More navigation options"
                                >
                                    {inner}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex-1 flex items-center justify-center no-underline"
                            >
                                {inner}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

/* ─────────────────────────────────────────
   MobileDrawer kept for backward compat
   (no longer needed — use MobileBottomNav)
───────────────────────────────────────── */
export function MobileDrawer({
    open: _open,
    onClose: _onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return null;
}