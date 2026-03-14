"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "@/app/components/LoadingScreen";

type Stat = {
  label: string;
  value: string;
  icon: string;
  gold?: boolean;
};
type Service = {
  name: string;
  tx: string;
  payout: string;
  rate: string;
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const STATS: Stat[] = [
  { label: "Total Payouts (Feb)", value: "₹4.2L", icon: "₹", gold: true },
  { label: "Avg Commission Rate", value: "11.4%", icon: "%" },
  { label: "Pending Payouts", value: "₹0.8L", icon: "↓" },
  { label: "Commission Revenue", value: "₹2.78L", icon: "↗" },
];

const SERVICES: Service[] = [
  { name: "Haircut", tx: "8,420", payout: "₹1.01L", rate: "12%" },
  { name: "Hair Color", tx: "3,240", payout: "₹0.49L", rate: "15%" },
  { name: "Facial", tx: "5,610", payout: "₹0.56L", rate: "10%" },
  { name: "Nail Art", tx: "2,890", payout: "₹0.23L", rate: "8%" },
  { name: "Massage", tx: "4,120", payout: "₹0.49L", rate: "12%" },
];

const MONTHS: string[] = ["Oct", "Nov", "Dec", "Jan", "Feb"];
const PAYOUTS: number[] = [2, 2.7, 3.3, 3.0, 4.1];

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */

export default function CommissionPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingScreen />;

  const maxValue = 8;

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-semibold font-serif tracking-tight">
            Commission &amp; Marketplace
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Configure platform commissions and track payouts
          </p>
        </div>
      </div>

      {/* STAT CARDS
          mobile:  2 cols
          lg:      4 cols
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#e8e0d4] rounded-2xl p-4 sm:p-6 shadow-sm"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs sm:text-sm text-[#7a6a55] leading-snug">
                {stat.label}
              </span>
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0
                  ${stat.gold ? "bg-[#c8922a] text-white" : "bg-[#f7f4ef] text-[#7a6a55]"}`}
              >
                {stat.icon}
              </div>
            </div>

            <div
              className={`text-xl sm:text-2xl font-semibold mt-3 sm:mt-4 ${stat.gold ? "text-[#c8922a]" : "text-[#1a1208]"
                }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN SECTION
          mobile:  1 col stacked
          xl:      commission-left (flex-1) + chart-right (460px fixed)
      */}
      <div className="flex flex-col xl:grid gap-6" style={{ gridTemplateColumns: "1fr 460px" }}>

        {/* LEFT — Commission by Service */}
        <div className="bg-[#f8f5f1] border border-[#ebe3d8] rounded-2xl p-5 sm:p-7 shadow-sm">
          <h2 className="text-[18px] sm:text-[20px] font-semibold font-serif mb-5 sm:mb-6">
            Commission by Service
          </h2>

          <div className="flex flex-col gap-3 sm:gap-5">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="bg-white/70 rounded-xl px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center transition hover:bg-white gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-medium truncate">
                    {service.name}
                  </p>
                  <p className="text-xs sm:text-sm text-[#8c7a66] mt-1">
                    {service.tx} tx · {service.payout}
                  </p>
                </div>

                <span className="bg-[#fdf6ec] border border-[#f0d9b0] text-[#c8922a] text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                  {service.rate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Monthly Payouts chart */}
        <div className="bg-[#f8f5f1] border border-[#ebe3d8] rounded-2xl p-5 sm:p-7 shadow-sm">
          <h2 className="text-[18px] sm:text-[20px] font-semibold font-serif mb-5 sm:mb-6">
            Monthly Payouts (₹L)
          </h2>

          {/* Chart — SVG so it scales cleanly on all screen sizes */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 340 240"
              className="w-full"
              style={{ minWidth: 260 }}
            >
              {/* Y-axis grid lines */}
              {[0, 2, 4, 6, 8].map((val) => {
                const y = 200 - (val / maxValue) * 180;
                return (
                  <g key={val}>
                    <line
                      x1="32" y1={y} x2="330" y2={y}
                      stroke="#e6ded3" strokeWidth="1" strokeDasharray="4 3"
                    />
                    <text x="24" y={y + 4} fontSize="10" fill="#b7a997" textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {PAYOUTS.map((val, i) => {
                const barW = 44;
                const gap = 18;
                const x = 40 + i * (barW + gap);
                const barH = (val / maxValue) * 180;
                const y = 200 - barH;
                return (
                  <g key={i}>
                    <rect
                      x={x} y={y} width={barW} height={barH}
                      rx="6" fill="#7a4b2a"
                    />
                    <text
                      x={x + barW / 2} y="220"
                      fontSize="11" fill="#8c7a66" textAnchor="middle"
                    >
                      {MONTHS[i]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}