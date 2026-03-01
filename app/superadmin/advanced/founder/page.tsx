"use client";

import React from "react";
import {
  DollarSign,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Users,
  ArrowUpRight,
} from "lucide-react";
// Multi-faceted diamond icon from react-icons
import { IoDiamondOutline } from "react-icons/io5";

/* KPI DATA */
const KPIS = [
  { title: "MRR", value: "₹18.4L", growth: "+13.6% MoM", icon: DollarSign, highlight: true },
  { title: "ARR", value: "₹2.2Cr", growth: "+13.6% MoM", icon: BarChart3 },
  { title: "Churn Rate", value: "2.3%", growth: "-0.8% improvement", icon: TrendingDown },
  { title: "LTV", value: "₹3.2L", growth: "+8.4% MoM", icon: TrendingUp },
  { title: "CAC", value: "₹4,200", growth: "-12% improvement", icon: Users },
  { title: "LTV:CAC Ratio", value: "76:1", growth: "+18% MoM", icon: ArrowUpRight, highlight: true },
];

const RETENTION = [
  { quarter: "Q1 2024", value: 91 },
  { quarter: "Q2 2024", value: 88 },
  { quarter: "Q3 2024", value: 93 },
  { quarter: "Q4 2024", value: 95 },
];

const FounderModePage = () => {
  return (
    <div className="w-full p-4 lg:p-8">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e0b44a] to-[#c8922a] flex items-center justify-center shadow-lg">
            <IoDiamondOutline size={24} className="text-[#1a1208]" />
          </div>

          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">
              Founder Mode
            </h1>
            <p className="text-sm text-[#7a6a55] mt-1">
              Investor-grade metrics and business intelligence
            </p>
          </div>
        </div>

        <span className="bg-[#d4a62a] text-[#2d241a] px-5 py-2 rounded-full text-sm font-semibold shadow">
          Confidential
        </span>
      </div>

      {/* ================= KPI GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-14">
        {KPIS.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`relative rounded-2xl p-6 shadow-sm border ${
                kpi.highlight
                  ? "border-[#d4a62a] bg-[#fffaf2]"
                  : "border-[#eee7dc] bg-[#f9f7f4]"
              }`}
            >
              <div
                className={`absolute top-5 right-5 w-11 h-11 rounded-xl flex items-center justify-center ${
                  kpi.highlight
                    ? "bg-[#d4a62a] text-white shadow-md"
                    : "bg-[#eee7dc] text-[#7a6a55]"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <p className="text-sm text-[#7a6a55]">{kpi.title}</p>
              <h2 className={`text-2xl font-bold mt-3 ${
                kpi.highlight ? "text-[#d4a62a]" : "text-[#2d241a]"
              }`}>
                {kpi.value}
              </h2>
              <p className="text-xs text-green-600 mt-2 font-medium">
                {kpi.growth}
              </p>
            </div>
          );
        })}
      </div>

      {/* ================= ANALYTICS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">

        {/* ================= MRR GROWTH ================= */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#2d241a]">
                MRR Growth
              </h2>
              <p className="text-sm text-[#7a6a55]">
                Monthly Recurring Revenue (₹L)
              </p>
            </div>
            <span className="bg-[#f3eee6] text-[#c8922a] px-3 py-1 rounded-full text-xs font-medium">
              +48% 6M
            </span>
          </div>

          <div className="relative w-full h-56">
            <svg viewBox="0 0 600 240" className="w-full h-full">
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a62a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4a62a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 5, 10, 15, 20].map((val, i) => (
                <g key={i}>
                  <line x1="60" y1={200 - val * 8} x2="580" y2={200 - val * 8} stroke="#e6dfd4" strokeDasharray="4 4" />
                  <text x="30" y={205 - val * 8} fontSize="12" fill="#7a6a55">{val}</text>
                </g>
              ))}
              <path d="M60 160 L140 150 L220 130 L300 120 L380 115 L460 110 L540 95 L540 200 L60 200 Z" fill="url(#mrrGradient)" />
              <path d="M60 160 L140 150 L220 130 L300 120 L380 115 L460 110 L540 95" fill="none" stroke="#d4a62a" strokeWidth="3" />
              {[160, 150, 130, 120, 115, 110, 95].map((y, i) => (
                <circle key={i} cx={60 + i * 80} cy={y} r="5" fill="#f9f7f4" stroke="#d4a62a" strokeWidth="3" />
              ))}
              {["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((month, i) => (
                <text key={i} x={60 + i * 80} y="220" fontSize="12" fill="#7a6a55" textAnchor="middle">{month}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* ================= COHORT RETENTION ================= */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-serif font-bold mb-6 text-[#2d241a]">
            Cohort Retention
          </h2>
          <div className="space-y-6">
            {RETENTION.map((item, index) => {
              const churn = 100 - item.value;
              return (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-[#2d241a]">{item.quarter}</span>
                    <span className="text-[#159957] font-semibold">{item.value}% retained</span>
                  </div>
                  <div className="w-full h-4 bg-[#ead1d1] rounded-full flex overflow-hidden">
                    <div style={{ width: `${item.value}%` }} className="bg-[#2bb673] transition-all duration-700" />
                    <div style={{ width: `${churn}%` }} className="bg-[#e6b3b3]" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-6 text-sm text-[#7a6a55]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2bb673]" /> Retained
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#e6b3b3]" /> Churned
            </div>
          </div>
        </div>
      </div>

      {/* ================= INVESTOR SUMMARY ================= */}
      <div className="bg-[#4c2e1f] rounded-2xl p-8 lg:p-10 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <IoDiamondOutline 
            size={24} 
            className="text-[#e0b44a]" 
          />
          <h2 className="text-2xl font-serif font-bold text-white">
            Investor Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 pt-8 border-t border-[#6a493a]">
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-bold text-[#e7b255]">₹2.2Cr</h3>
            <p className="text-xs font-medium text-[#c5a485] tracking-widest uppercase">ARR</p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-bold text-[#e7b255]">48% YoY</h3>
            <p className="text-xs font-medium text-[#c5a485] tracking-widest uppercase">Growth Rate</p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-bold text-[#e7b255]">72%</h3>
            <p className="text-xs font-medium text-[#c5a485] tracking-widest uppercase">Gross Margin</p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-bold text-[#e7b255]">28 months</h3>
            <p className="text-xs font-medium text-[#c5a485] tracking-widest uppercase">Runway</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FounderModePage;