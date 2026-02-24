"use client";

import { useState } from "react";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */

const STATS = [
  {
    label: "Total Payouts (Feb)",
    value: "₹4.2L",
    icon: "₹",
    gold: true,
  },
  {
    label: "Avg Commission Rate",
    value: "11.4%",
    icon: "%",
  },
  {
    label: "Pending Payouts",
    value: "₹0.8L",
    icon: "↓",
  },
  {
    label: "Commission Revenue",
    value: "₹2.78L",
    icon: "↗",
  },
];

const SERVICES = [
  { name: "Haircut", tx: "8,420", payout: "₹1.01L", rate: "12%" },
  { name: "Hair Color", tx: "3,240", payout: "₹0.49L", rate: "15%" },
  { name: "Facial", tx: "5,610", payout: "₹0.56L", rate: "10%" },
  { name: "Nail Art", tx: "2,890", payout: "₹0.23L", rate: "8%" },
  { name: "Massage", tx: "4,120", payout: "₹0.49L", rate: "12%" },
];

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb"];
const PAYOUTS = [2, 2.7, 3.3, 3.0, 4.1];

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */

export default function CommissionPage() {
  const maxValue = 8;

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[28px] font-semibold font-serif tracking-tight">
            Commission & Marketplace
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Configure platform commissions and track payouts
          </p>
        </div>

        <button className="bg-[#c8922a] text-white px-5 py-2 rounded-full text-sm font-medium shadow-sm">
          % Edit Rates
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#e8e0d4] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm text-[#7a6a55]">
                {stat.label}
              </span>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold
                ${stat.gold ? "bg-[#c8922a] text-white" : "bg-[#f7f4ef] text-[#7a6a55]"}`}
              >
                {stat.icon}
              </div>
            </div>

            <div
              className={`text-2xl font-semibold mt-4 ${
                stat.gold ? "text-[#c8922a]" : "text-[#1a1208]"
              }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN SECTION */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 460px" }}>

        {/* LEFT SIDE */}
        <div className="bg-[#f8f5f1] border border-[#ebe3d8] rounded-2xl p-7 shadow-sm">
          <h2 className="text-[20px] font-semibold font-serif mb-6">
            Commission by Service
          </h2>

          <div className="flex flex-col gap-5">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="bg-white/70 rounded-xl px-6 py-5 flex justify-between items-center transition hover:bg-white"
              >
                <div>
                  <p className="text-[15px] font-medium">
                    {service.name}
                  </p>
                  <p className="text-sm text-[#8c7a66] mt-1">
                    {service.tx} transactions · {service.payout} payout
                  </p>
                </div>

                <span className="bg-[#fdf6ec] border border-[#f0d9b0] text-[#c8922a] text-sm font-semibold px-4 py-1.5 rounded-full">
                  {service.rate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-[#f8f5f1] border border-[#ebe3d8] rounded-2xl p-7 shadow-sm">
          <h2 className="text-[20px] font-semibold font-serif mb-6">
            Monthly Payouts (₹L)
          </h2>

          <div className="relative h-[260px]">

            {/* GRID LINES */}
            {[0, 2, 4, 6, 8].map((val) => {
              const top = 200 - (val / maxValue) * 200;
              return (
                <div
                  key={val}
                  className="absolute left-10 right-4 border-t border-dashed border-[#e6ded3] text-xs text-[#b7a997]"
                  style={{ top }}
                >
                  <span className="absolute -left-8 -top-2">
                    {val}
                  </span>
                </div>
              );
            })}

            {/* BARS */}
            <div className="absolute bottom-0 left-12 right-6 flex items-end justify-between h-[200px]">
              {PAYOUTS.map((val, i) => {
                const height = (val / maxValue) * 200;
                return (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div
                      className="w-16 bg-[#7a4b2a] rounded-lg"
                      style={{ height }}
                    />
                    <span className="text-sm text-[#8c7a66]">
                      {MONTHS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}