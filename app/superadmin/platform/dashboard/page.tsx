"use client";

import { useState } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Stat {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  gold?: boolean;
  icon: React.ReactNode;
}

interface Salon {
  rank: number;
  name: string;
  city: string;
  revenue: string;
  trend: string;
  up: boolean;
}

interface HealthItem {
  label: string;
  pct: number;
  color: string;
}

interface Plan {
  label: string;
  count: number;
  color: string;
}

/* ─────────────────────────────────────────
   STAT CARDS DATA
───────────────────────────────────────── */
const STATS: Stat[] = [
  {
    label: "Total Salons & Spas",
    value: "312",
    trend: "+14%",
    up: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7h18v13H3z" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
      </svg>
    ),
  },
  {
    label: "Active Branches",
    value: "847",
    trend: "+8%",
    up: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Total Customers",
    value: "1.24M",
    trend: "+22%",
    up: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Platform Revenue",
    value: "₹84.2L",
    trend: "+18%",
    up: true,
    gold: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Active Subscriptions",
    value: "259",
    trend: "+11%",
    up: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: "Pending Approvals",
    value: "7",
    trend: "-30%",
    up: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: "MRR",
    value: "₹18.4L",
    trend: "+16%",
    up: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    label: "System Uptime",
    value: "99.8%",
    trend: "+0.1%",
    up: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────
   TOP SALONS DATA
───────────────────────────────────────── */
const TOP_SALONS: Salon[] = [
  { rank: 1, name: "Luxe Beauty Studio", city: "Mumbai",    revenue: "₹2.4L", trend: "+18%", up: true  },
  { rank: 2, name: "Velvet Touch Spa",   city: "Bangalore", revenue: "₹1.9L", trend: "+12%", up: true  },
  { rank: 3, name: "Golden Hour Salon",  city: "Delhi",     revenue: "₹1.7L", trend: "+8%",  up: true  },
  { rank: 4, name: "Aura Wellness",      city: "Pune",      revenue: "₹1.4L", trend: "-3%",  up: false },
  { rank: 5, name: "The Refinery",       city: "Chennai",   revenue: "₹1.2L", trend: "+22%", up: true  },
];

/* ─────────────────────────────────────────
   SYSTEM HEALTH DATA
───────────────────────────────────────── */
const HEALTH: HealthItem[] = [
  { label: "API",     pct: 99.9, color: "#27ae60" },
  { label: "DB",      pct: 99.7, color: "#27ae60" },
  { label: "Storage", pct: 98.4, color: "#c8922a" },
  { label: "CDN",     pct: 99.8, color: "#27ae60" },
];

/* ─────────────────────────────────────────
   CHART DATA
───────────────────────────────────────── */
const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
const REVENUE_PTS = [340, 320, 305, 295, 285, 265, 230];
const BAR_DATA = [190, 210, 200, 230, 215, 240, 260];

/* ─────────────────────────────────────────
   DONUT PLAN DATA
───────────────────────────────────────── */
const PLANS: Plan[] = [
  { label: "Enterprise", count: 42,  color: "#c8922a" },
  { label: "Pro",        count: 128, color: "#5c3d1a" },
  { label: "Starter",    count: 89,  color: "#c9b89a" },
  { label: "Trial",      count: 53,  color: "#e8d5b0" },
];
const TOTAL_PLANS = PLANS.reduce((s, p) => s + p.count, 0);

/* ─────────────────────────────────────────
   CARD COMPONENT
───────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e8e0d4] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card>
      <div className="flex justify-between items-start">
        <span className="text-xs text-[#7a6a55]">{stat.label}</span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${stat.gold ? "bg-[#c8922a] text-white" : "bg-[#f7f4ef] text-[#7a6a55]"}`}
        >
          {stat.icon}
        </div>
      </div>
      <div
        className={`text-[26px] font-semibold mt-2 tracking-tight
          ${stat.gold ? "text-[#c8922a]" : "text-[#1a1208]"}`}
      >
        {stat.value}
      </div>
      <div className="flex gap-1 text-xs text-[#7a6a55] mt-1">
        <span className={`font-medium ${stat.up ? "text-[#2d7a4f]" : "text-[#c0392b]"}`}>
          {stat.up ? "↑" : "↓"} {stat.trend}
        </span>
        vs last month
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────
   REVENUE CHART
───────────────────────────────────────── */
function RevenueChart() {
  const w = 500, h = 200;
  const xStep = w / (MONTHS.length - 1);
  const minV = 220, maxV = 360;
  const toY = (v: number) => h - ((v - minV) / (maxV - minV)) * (h - 20) - 5;

  const pts = REVENUE_PTS.map((v, i) => `${i * xStep},${toY(v)}`).join(" ");
  const fillPts = `0,${h} ${pts} ${w},${h}`;

  return (
    <div className="w-full overflow-x-hidden">
      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full" preserveAspectRatio="none">
        {[0, 25000, 50000, 75000, 100000].map((val, i) => {
          const y = h - (i / 4) * (h - 10);
          return (
            <g key={val}>
              <line x1="0" y1={y} x2={w} y2={y} stroke="#ede5d8" strokeWidth="1" />
              <text x="0" y={y - 3} fontSize="9" fill="#b0a090">
                {val === 0 ? "0" : val >= 1000 ? `${val / 1000}k` : val}
              </text>
            </g>
          );
        })}

        <polygon points={fillPts} fill="#c8922a" opacity="0.08" />

        <polyline
          points={pts}
          fill="none"
          stroke="#c8922a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {REVENUE_PTS.map((v, i) => (
          <circle
            key={i}
            cx={i * xStep}
            cy={toY(v)}
            r={i === REVENUE_PTS.length - 1 ? 5 : 3.5}
            fill="#c8922a"
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}

        {MONTHS.map((m, i) => (
          <text key={m} x={i * xStep} y={h + 22} fontSize="10" fill="#b0a090" textAnchor="middle">
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   DONUT CHART
───────────────────────────────────────── */
function DonutChart() {
  const r = 54, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;

  let cumulative = 0;
  const segments = PLANS.map((p) => {
    const pct = p.count / TOTAL_PLANS;
    const dash = pct * circ;
    const gap = circ - dash;
    const offset = -cumulative * circ;
    cumulative += pct;
    return { ...p, dash, gap, offset };
  });

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {segments.map((s) => (
        <circle
          key={s.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="22"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={s.offset}
          transform="rotate(-90 70 70)"
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="600" fill="#1a1208">
        {TOTAL_PLANS}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#7a6a55">
        Active
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   SUBSCRIPTION GROWTH BARS
───────────────────────────────────────── */
function SubGrowthBars() {
  const maxVal = Math.max(...BAR_DATA);
  const barH = 80;

  return (
    <div className="w-full overflow-x-hidden">
      <svg viewBox="0 0 420 110" className="w-full">
        {[80, 320].map((v, i) => (
          <text key={v} x="0" y={i === 0 ? 85 : 12} fontSize="9" fill="#b0a090">
            {v}
          </text>
        ))}

        {BAR_DATA.map((val, i) => {
          const bw = 38;
          const gap = 22;
          const x = 28 + i * (bw + gap);
          const h = (val / maxVal) * barH;
          const y = barH - h + 10;
          const opacity = 0.6 + (val / maxVal) * 0.4;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={h} rx="5" fill="#c8922a" opacity={opacity} />
              <text x={x + bw / 2} y={100} fontSize="9" fill="#b0a090" textAnchor="middle">
                {MONTHS[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────── */
export default function DashboardPage() {
  const [chartPeriod] = useState("Last 7 Months");

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Good morning, Admin ✦
        </h1>
        <p className="text-[13.5px] text-[#7a6a55] mt-0.5">
          Here&apos;s what&apos;s happening across your platform today.
        </p>
      </div>

      {/* Alert Banner */}
      <div className="flex items-center gap-2 bg-[#fdf6ec] border border-[#f0d9b0] rounded-[10px] px-4 py-[11px] text-[13px] mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8922a" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>
          <span className="text-[#c8922a] font-semibold">7 salons</span> are pending approval
        </span>
        <span className="text-[#e8e0d4] mx-1">·</span>
        <span>
          <span className="text-[#c8922a] font-semibold">12 subscriptions</span> expire this week
        </span>
        <span className="ml-auto text-[#c8922a] font-medium cursor-pointer whitespace-nowrap">
          Review Now →
        </span>
      </div>

      {/* Stats Grid — 2 rows × 4 cols */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{ animation: `fadeUp 0.35s ease ${i * 0.05}s both` }}
          >
            <StatCard stat={s} />
          </div>
        ))}
      </div>

      {/* Revenue Chart + Plan Distribution */}
      <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Revenue Chart */}
        <Card>
          <div className="flex justify-between items-start mb-3.5">
            <div>
              <p className="text-[15px] font-semibold">Revenue Overview</p>
              <p className="text-xs text-[#7a6a55] mt-0.5">Monthly platform revenue &amp; subscriptions</p>
            </div>
            <button className="bg-[#f7f4ef] border border-[#e8e0d4] rounded-full px-3 py-1 text-xs text-[#7a6a55] cursor-pointer">
              {chartPeriod}
            </button>
          </div>
          <RevenueChart />
        </Card>

        {/* Plan Distribution */}
        <Card>
          <p className="text-[15px] font-semibold">Plan Distribution</p>
          <p className="text-xs text-[#7a6a55] mt-0.5 mb-3.5">Active subscription tiers</p>
          <div className="flex justify-center">
            <DonutChart />
          </div>
          <div className="flex flex-col gap-2.5 mt-3.5">
            {PLANS.map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-[13px]">
                <span
                  className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                  style={{ background: p.color }}
                />
                <span className="text-[#7a6a55]">{p.label}</span>
                <span className="ml-auto font-medium text-[#1a1208]">{p.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Performing Salons + System Health + Subscription Growth */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Top Performing Salons */}
        <Card>
          <div className="flex justify-between items-center mb-1">
            <div>
              <p className="text-[15px] font-semibold">Top Performing Salons</p>
              <p className="text-xs text-[#7a6a55] mt-0.5">By revenue this month</p>
            </div>
            <span className="text-[13px] text-[#c8922a] font-medium cursor-pointer">
              View All →
            </span>
          </div>

          <div className="flex flex-col mt-3">
            {TOP_SALONS.map((salon, i) => (
              <div
                key={salon.rank}
                className={`flex items-center gap-3 py-3
                  ${i < TOP_SALONS.length - 1 ? "border-b border-[#f0ebe3]" : ""}`}
              >
                {/* Rank badge */}
                <div
                  className={`w-[30px] h-[30px] rounded-full flex items-center justify-center
                    text-[11px] font-bold flex-shrink-0
                    ${salon.rank === 1 ? "bg-[#c8922a] text-white" : "bg-[#f7f4ef] text-[#7a6a55]"}`}
                >
                  #{salon.rank}
                </div>

                {/* Name + city */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-[#1a1208]">{salon.name}</p>
                  <p className="text-[11.5px] text-[#7a6a55] mt-px">{salon.city}</p>
                </div>

                {/* Revenue + trend */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-semibold text-[#1a1208]">{salon.revenue}</p>
                  <p className={`text-[11.5px] font-medium mt-px ${salon.up ? "text-[#2d7a4f]" : "text-[#c0392b]"}`}>
                    {salon.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* System Health */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[15px] font-semibold">System Health</p>
              <span className="flex items-center gap-1.5 bg-[#eaf7f0] text-[#27ae60] text-[11.5px] font-medium px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27ae60] inline-block" />
                Operational
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
              {HEALTH.map((h) => (
                <div key={h.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#7a6a55]">{h.label}</span>
                    <span className="text-xs font-semibold" style={{ color: h.color }}>
                      {h.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f0ebe3] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${h.pct}%`, background: h.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Subscription Growth */}
          <Card>
            <div className="flex justify-between items-center mb-2.5">
              <p className="text-[15px] font-semibold">Subscription Growth</p>
              <span className="bg-[#fdf6ec] border border-[#f0d9b0] text-[#c8922a] text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full">
                +19% MoM
              </span>
            </div>
            <SubGrowthBars />
          </Card>
        </div>
      </div>

      {/* fadeUp keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}