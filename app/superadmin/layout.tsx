"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Topbar } from "../components/layout/Header";
import { DesktopSidebar, MobileDrawer, MobileBottomNav } from "../components/layout/Sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/superadmin/platform/dashboard": "Global Dashboard",
  "/superadmin/platform/salons": "Salon & Spa",
  "/superadmin/platform/subscriptions": "Subscriptions",
  "/superadmin/platform/users": "Users",
  "/superadmin/platform/regions": "Regions & Franchise",
  "/superadmin/management/commission": "Commission & Marketplace",
  "/superadmin/management/reports": "Reports",
  "/superadmin/management/form": "Blogs",
  "/superadmin/advanced/notifications": "Notifications",
  "/superadmin/advanced/white-label": "White Label",
  "/superadmin/advanced/compliance": "Compliance",
  "/superadmin/advanced/system-monitor": "System Monitor",
  "/superadmin/advanced/founder": "Founder Mode",
};

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Global Dashboard";

  /* Auto-close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <style>{`
        @keyframes nexPulse {
          0%,100% { box-shadow: 0 0 0 2px rgba(22,163,74,0.18); }
          50%      { box-shadow: 0 0 0 6px rgba(22,163,74,0.06); }
        }
      `}</style>
      <div
        className="flex flex-col min-h-screen bg-[#F4EEE5]"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        <Topbar
          pageTitle={pageTitle}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <DesktopSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
          <MobileDrawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
          <MobileBottomNav onMoreClick={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto w-full relative pb-[64px] lg:pb-0">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}