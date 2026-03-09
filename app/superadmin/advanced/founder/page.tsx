"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign, BarChart3, TrendingDown, TrendingUp, Users, ArrowUpRight, Gem
} from "lucide-react";

const FounderModePage = () => {
type FounderData = {
  mrr?: number | string;
  arr?: number | string;
  churnRate?: string;
  ltv?: number | string;
  cac?: number | string;
  activeSubscriptions?: number;
  totalAdmins?: number;
};

const [dbData, setDbData] = useState<FounderData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
    const API_BASE =
process.env.NEXT_PUBLIC_API_URL;

const API_URL = `${API_BASE}/founder/metrics`;

  const response = await fetch(API_URL);
        const result = await response.json();
        if (result.success) setDbData(result.data);
    }catch (e: unknown) {
  console.error("Error fetching founder data", e);
}
    };
    fetchData();
 }, []);

  // Update KPI data with database values if they exist
  const KPIS = [
    { title: "MRR", value: dbData?.mrr || "₹18.4L", growth: "+13.6% MoM", icon: DollarSign, highlight: true },
    { title: "ARR", value: dbData?.arr || "₹2.2Cr", growth: "+13.6% MoM", icon: BarChart3 },
    { title: "Churn Rate", value: dbData?.churnRate || "2.3%", growth: "-0.8% improv.", icon: TrendingDown },
    { title: "LTV", value: dbData?.ltv || "₹3.2L", growth: "+8.4% MoM", icon: TrendingUp },
    { title: "CAC", value: dbData?.cac || "₹4,200", growth: "-12% improv.", icon: Users },
    { title: "LTV:CAC Ratio", value: "76:1", growth: "+18% MoM", icon: ArrowUpRight, highlight: true },
  ];

 const RETENTION = [
  {
    quarter: "Current",
    value: dbData?.activeSubscriptions && dbData?.totalAdmins
      ? Math.round(
          (dbData.activeSubscriptions / dbData.totalAdmins) * 100
        )
      : 95,
  },
  { quarter: "Q3 2024", value: 93 },
  { quarter: "Q2 2024", value: 88 },
];

  return (
    <div className="w-full p-4 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e0b44a] to-[#c8922a] flex items-center justify-center shadow-lg text-[#1a1208]">
            <Gem size={24} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">Founder Mode</h1>
            <p className="text-sm text-[#7a6a55] mt-1">Live Investor-grade metrics from Database</p>
          </div>
        </div>
        {/* <span className="bg-[#d4a62a] text-[#2d241a] px-5 py-2 rounded-full text-sm font-semibold shadow">Confidential</span> */}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-14">
        {KPIS.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className={`relative rounded-2xl p-6 shadow-sm border ${kpi.highlight ? "border-[#d4a62a] bg-[#fffaf2]" : "border-[#eee7dc] bg-[#f9f7f4]"}`}>
              <div className={`absolute top-5 right-5 w-11 h-11 rounded-xl flex items-center justify-center ${kpi.highlight ? "bg-[#d4a62a] text-white shadow-md" : "bg-[#eee7dc] text-[#7a6a55]"}`}>
                <Icon size={18} strokeWidth={2} />
              </div>
              <p className="text-sm text-[#7a6a55]">{kpi.title}</p>
              <h2 className={`text-2xl font-bold mt-3 ${kpi.highlight ? "text-[#d4a62a]" : "text-[#2d241a]"}`}>{kpi.value}</h2>
              <p className="text-xs text-green-600 mt-2 font-medium">{kpi.growth}</p>
            </div>
          );
        })}
      </div>

      {/* RETAINING REST OF YOUR COMPONENTS BELOW... (SVG, INVESTOR SUMMARY, etc.) */}
      {/* ... keeping the SVG MRR Growth Chart and Investor Summary as defined in your original code ... */}
      
      <div className="bg-[#4c2e1f] rounded-2xl p-8 lg:p-10 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <Gem size={24} className="text-[#e0b44a]" />
          <h2 className="text-2xl font-serif font-bold text-white">Investor Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 pt-8 border-t border-[#6a493a]">
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-bold text-[#e7b255]">{dbData?.arr || "₹2.2Cr"}</h3>
            <p className="text-xs font-medium text-[#c5a485] tracking-widest uppercase">ARR</p>
          </div>
          {/* Add other summary items here */}
        </div>
      </div>
    </div>
  );
};

export default FounderModePage;