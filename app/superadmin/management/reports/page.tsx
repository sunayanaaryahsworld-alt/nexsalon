"use client";

import React from "react";

const PEAK_HOURS = [
  { label: "9am", value: 420 },
  { label: "11am", value: 820 },
  { label: "1pm", value: 640 },
  { label: "3pm", value: 930 },
  { label: "5pm", value: 780 },
  { label: "7pm", value: 490 },
];

const TOP_SERVICES = [
  { name: "Haircut", value: 42840 },
  { name: "Color", value: 18920 },
  { name: "Facial", value: 22410 },
  { name: "Massage", value: 16780 },
  { name: "Nails", value: 12340 },
];

export default function ReportsPage() {
  const maxServiceValue = Math.max(...TOP_SERVICES.map((s) => s.value));
  const maxBookings = 1000;
  const maxCustomers = 1.4;

  return (
    <div className="min-h-screen bg-[#f5f1ea] pt-4 pb-8 font-sans text-[#1a1208] w-full">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#2d241a]">
            Reports & Analytics
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Comprehensive platform analytics and downloadable reports
          </p>
        </div>
        <button className="bg-[#c8922a] hover:bg-[#b07d20] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors w-fit">
          ↓ Export Report
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* CUSTOMER GROWTH */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-lg font-serif font-bold">
                Customer Growth
              </h2>
              <p className="text-xs text-[#7a6a55]">
                Total registered customers
              </p>
            </div>
            <span className="text-[10px] font-bold bg-[#f4e6c9] text-[#a97b1f] px-3 py-1 rounded-full border border-[#e9d9b8]">
              +26% YoY
            </span>
          </div>

          <div className="relative h-[220px] w-full flex">

            <div className="w-14 relative">
              {[1.4, 1.1, 0.7, 0.3, 0].map((val, i) => (
                <span
                  key={val}
                  className="absolute text-[10px] text-[#9b8c79]"
                  style={{ top: `${i * 25}%`, transform: "translateY(-50%)" }}
                >
                  {val.toFixed(1)}M
                </span>
              ))}
            </div>

            <div className="flex-1 relative">
              {[0, 0.3, 0.7, 1.1, 1.4].map((val) => {
                const percent = (val / maxCustomers) * 100;
                return (
                  <div
                    key={val}
                    className="absolute w-full border-t border-dashed border-[#e3d9cc]"
                    style={{ bottom: `${percent}%` }}
                  />
                );
              })}

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >
                <defs>
                  <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6b3f1d" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6b3f1d" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M 0 78 L 15 74 L 30 70 L 45 66 L 60 62 L 75 59 L 100 56 V 100 H 0 Z"
                  fill="url(#fade)"
                />

                <polyline
                  fill="none"
                  stroke="#6b3f1d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  points="0,78 15,74 30,70 45,66 60,62 75,59 100,56"
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-between mt-4 text-[10px] text-[#8a7a66] ml-14">
            {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* PEAK BOOKING HOURS */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm">
          <div className="mb-8">
            <h2 className="text-lg font-serif font-bold">
              Peak Booking Hours
            </h2>
            <p className="text-xs text-[#7a6a55]">
              Average daily bookings by hour
            </p>
          </div>

          <div className="relative h-[220px] w-full flex">

            <div className="w-14 relative">
              {[1000, 750, 500, 250, 0].map((val, i) => (
                <span
                  key={val}
                  className="absolute text-[10px] text-[#9b8c79]"
                  style={{ top: `${i * 25}%`, transform: "translateY(-50%)" }}
                >
                  {val}
                </span>
              ))}
            </div>

            <div className="flex-1 relative">
              {[0, 250, 500, 750, 1000].map((val) => {
                const percent = (val / maxBookings) * 100;
                return (
                  <div
                    key={val}
                    className="absolute w-full border-t border-dashed border-[#e3d9cc]"
                    style={{ bottom: `${percent}%` }}
                  />
                );
              })}

              <div className="absolute inset-0 flex justify-around items-end">
                {PEAK_HOURS.map((hour) => (
                  <div
                    key={hour.label}
                    className="w-10 bg-[#d4a62a] rounded-t-sm"
                    style={{
                      height: `${(hour.value / maxBookings) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-around mt-4 text-[10px] text-[#8a7a66] ml-14">
            {PEAK_HOURS.map((h) => (
              <span key={h.label}>{h.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* TOP SERVICES */}
      <div className="bg-[#fbf8f3] border border-[#eee7dc] rounded-2xl p-8 shadow-sm w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-serif font-bold">
            Top Services by Usage
          </h2>
          <span className="text-xs text-[#8a7a66] bg-[#eee7dc] px-3 py-1 rounded-full">
            Feb 2025
          </span>
        </div>

        <div className="space-y-6">
          {TOP_SERVICES.map((service, index) => (
            <div key={service.name}>
              <div className="flex justify-between text-sm mb-2">
                <span>{service.name}</span>
                <span>
                  {service.value.toLocaleString()} bookings
                </span>
              </div>

              <div className="w-full h-3 bg-[#e9e1d6] rounded-full">
                <div
                  className={`h-3 rounded-full ${
                    index === 0 ? "bg-[#d4a62a]" : "bg-[#6b3f1d]"
                  }`}
                  style={{
                    width: `${(service.value / maxServiceValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}