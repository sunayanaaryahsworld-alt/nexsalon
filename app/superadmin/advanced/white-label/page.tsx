"use client";

import React, { useEffect, useState } from "react";
import { Palette, Globe, Sliders } from "lucide-react";
import LoadingScreen from "@/app/components/LoadingScreen";

interface Stats {
  whiteLabelActive: number;
  customDomains: number;
  themeConfigs: number;
}

export default function WhiteLabelPage() {
  const [stats, setStats] = useState<Stats>({
    whiteLabelActive: 0,
    customDomains: 0,
    themeConfigs: 0,
  });
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const API_URL = `${API_BASE}/white-label/stats`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: Stats) => setStats(data))
      .catch((err: any) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-bold text-[#2d241a]">
          White Label & Branding
        </h1>
        <p className="text-sm text-[#7a6a55] mt-1">
          Control salon branding, themes and custom domains
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">

        {/* Card 1 */}
        <StatCard
          icon={<Palette size={22} />}
          title="White-Label Active"
          value={stats.whiteLabelActive}
        />

        {/* Card 2 */}
        <StatCard
          icon={<Globe size={22} />}
          title="Custom Domains"
          value={stats.customDomains}
        />

        {/* Card 3 */}
        <StatCard
          icon={<Sliders size={22} />}
          title="Theme Configs"
          value={stats.themeConfigs}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-5 bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#d4a62a] text-white flex items-center justify-center shadow-md">
        {icon}
      </div>
      <div>
        <p className="text-sm text-[#7a6a55]">{title}</p>
        <h2 className="text-2xl font-bold text-[#2d241a] mt-1">
          {value}
        </h2>
      </div>
    </div>
  );
}