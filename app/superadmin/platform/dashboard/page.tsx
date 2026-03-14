//.........................................................................................................................//
"use client";
import React, { useState, useEffect } from "react";
import LoadingScreen from "@/app/components/LoadingScreen";
import type { ReactNode } from "react";

type DashboardStats = {
  totalSalonsAndSpas?: number;
  totalBranches?: number;
  totalCustomers?: number;
  totalRevenue?: number;
  activeSubscriptions?: number;
  pendingApprovals?: number;
  mrr?: number;
};

/* ───────────────────────────────────────── TYPES ───────────────────────────────────────── */
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    icon: <span className="text-lg font-bold">₹</span>
  },
  {
    label: "Active Subscriptions",
    value: "259",
    trend: "+11%",
    up: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────
   TOP SALONS DATA
───────────────────────────────────────── */
const TOP_SALONS: Salon[] = [
  { rank: 1, name: "Luxe Beauty Studio", city: "Mumbai", revenue: "₹2.4L", trend: "+18%", up: true },
  { rank: 2, name: "Velvet Touch Spa", city: "Bangalore", revenue: "₹1.9L", trend: "+12%", up: true },
  { rank: 3, name: "Golden Hour Salon", city: "Delhi", revenue: "₹1.7L", trend: "+8%", up: true },
  { rank: 4, name: "Aura Wellness", city: "Pune", revenue: "₹1.4L", trend: "-3%", up: false },
  { rank: 5, name: "The Refinery", city: "Chennai", revenue: "₹1.2L", trend: "+22%", up: true },
];

/* ───────────────────────────────────────── CHART DATA ───────────────────────────────────────── */
const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
const REVENUE_PTS = [340, 320, 305, 295, 285, 265, 230];
const BAR_DATA = [190, 210, 200, 230, 215, 240, 260];

/* ───────────────────────────────────────── PLAN COLORS ───────────────────────────────────────── */
const PLAN_COLORS: Record<string, string> = {
  Enterprise: "#C9A227",
  Pro: "#3B2B23",
  Starter: "#C9B89A",
  Trial: "#EBE0D2",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const API_URL = `${API_BASE}/superdashboard/dashboard`;

/* ───────────────────────────────────────── HELPERS ───────────────────────────────────────── */
function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

/* ───────────────────────────────────────── CARD COMPONENT ───────────────────────────────────────── */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`card-premium p-6 ${className}`}>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────── ICON BUBBLE ───────────────────────────────────────── */
function IconBubble({ gold, children }: { gold?: boolean; children: React.ReactNode }) {
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 transition-transform hover:scale-105 duration-300 ${gold ? 'bg-premium-gold text-white shadow-md' : 'bg-[#F2EDEA] text-premium-primary'}`}>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────── STAT CARD ───────────────────────────────────────── */
function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card>
      <div className="flex justify-between items-start">
        <span className="text-[13px] text-premium-secondary font-semibold uppercase tracking-wide">{stat.label}</span>
        <IconBubble gold={stat.gold}>{stat.icon}</IconBubble>
      </div>
      <div className={`text-[28px] font-bold mt-3 tracking-tight ${stat.gold ? 'text-premium-gold' : 'text-premium-primary'}`}>
        {stat.value}
      </div>
      <div className="text-[13px] mt-3 flex items-center gap-1.5">
        <span className={`w-5 h-5 flex items-center justify-center rounded-full ${stat.up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} font-bold`}>
          {stat.up ? "↑" : "↓"}
        </span>
        <span className={`font-semibold ${stat.up ? "text-green-600" : "text-red-500"}`}>{stat.trend}</span>
        <span className="text-premium-secondary">vs last month</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────── REVENUE CHART ───────────────────────────────────────── */
function RevenueChart() {
  const w = 560, h = 220;
  const padL = 48, padB = 24, padR = 16, padT = 16;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const xStep = chartW / (MONTHS.length - 1);
  const minV = 200, maxV = 380;
  const toY = (v: number) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH;
  const toX = (i: number) => padL + i * xStep;

  // Smooth curves using bezier
  let ptsRaw = "";
  if (REVENUE_PTS.length > 0) {
    ptsRaw = `M ${toX(0)},${toY(REVENUE_PTS[0])} `;
    for (let i = 1; i < REVENUE_PTS.length; i++) {
      const cx1 = toX(i - 1) + xStep / 2;
      const cy1 = toY(REVENUE_PTS[i - 1]);
      const cx2 = toX(i) - xStep / 2;
      const cy2 = toY(REVENUE_PTS[i]);
      ptsRaw += `C ${cx1},${cy1} ${cx2},${cy2} ${toX(i)},${toY(REVENUE_PTS[i])} `;
    }
  }

  const fillPts = `${ptsRaw} L ${toX(MONTHS.length - 1)},${h - padB} L ${padL},${h - padB} Z`;
  const gridLines = [0, 25000, 50000, 75000, 100000];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A227" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((val, i) => {
        const pct = i / (gridLines.length - 1);
        const y = padT + chartH - pct * chartH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#EBE0D2" strokeWidth={1.5} strokeDasharray="6 6" />
            <text x={padL - 10} y={y + 4} fill="#897E72" fontSize={10} fontWeight="500" textAnchor="end">
              {val === 0 ? "0" : val >= 1000 ? `${val / 1000}k` : val}
            </text>
          </g>
        );
      })}

      {/* Fill */}
      <path d={fillPts} fill="url(#revGrad)" />

      {/* Line */}
      <path d={ptsRaw} fill="none" stroke="#C9A227" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {REVENUE_PTS.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={4.5} fill="#FFF8F0" stroke="#C9A227" strokeWidth={2.5} />
      ))}

      {/* X labels */}
      {MONTHS.map((m, i) => (
        <text key={i} x={toX(i)} y={h - 4} fill="#897E72" fontSize={11} fontWeight="600" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

/* ───────────────────────────────────────── DONUT CHART ───────────────────────────────────────── */
function DonutChart({ plans }: { plans: Plan[] }) {
  const total = plans.reduce((s, p) => s + p.count, 0);
  const r = 58, cx = 74, cy = 74;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;

  const segments = plans.map((p) => {
    const pct = total > 0 ? p.count / total : 0;
    const dash = pct * circ;
    const gap = circ - dash;
    const offset = -cumulative * circ;
    cumulative += pct;
    return { ...p, dash, gap, offset };
  });

  return (
    <svg viewBox="0 0 148 148" style={{ width: 148, height: 148 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F5EFE7" strokeWidth={16} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={16}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={s.offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dashoffset 1s ease" }}
        />
      ))}
      <text x={cx} y={cy - 4} fill="#2D211A" fontSize={22} fontWeight={800} textAnchor="middle">{total}</text>
      <text x={cx} y={cy + 14} fill="#897E72" fontSize={11} fontWeight="600" textAnchor="middle">Active</text>
    </svg>
  );
}

/* ───────────────────────────────────────── SYSTEM HEALTH GRID ───────────────────────────────────────── */
function SystemHealthGrid() {
  const items = [
    { label: "API", pct: 99.9, color: "#16A34A" },
    { label: "DB", pct: 99.7, color: "#16A34A" },
    { label: "Storage", pct: 98.4, color: "#C9A227" },
    { label: "CDN", pct: 99.8, color: "#16A34A" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
      {items.map((h) => (
        <div key={h.label}>
          <div className="flex justify-between mb-2">
            <span className="text-premium-secondary text-[13px] font-medium">{h.label}</span>
            <span style={{ color: h.color }} className="text-[13px] font-bold">{h.pct}%</span>
          </div>
          <div className="bg-[#F2EDEA] rounded-full h-2.5 overflow-hidden">
            <div style={{ background: h.color, width: `${h.pct}%` }} className="h-full rounded-full transition-all duration-700 ease-out" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────── SUBSCRIPTION GROWTH BARS ───────────────────────────────────────── */
function SubGrowthBars() {
  const maxVal = BAR_DATA.length > 0 ? Math.max(...BAR_DATA) : 1;
  const barH = 110;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox="0 0 430 140" style={{ width: "100%", minWidth: 280 }}>
        {/* Y labels */}
        {[100, 300].map((v, i) => {
          const y = barH - (v / maxVal) * barH + 10;
          return <text key={i} x={0} y={y} fill="#897E72" fontSize={10} fontWeight="600">{v}</text>;
        })}
        {/* Grid lines */}
        {[100, 300].map((v, i) => {
          const y = barH - (v / maxVal) * barH + 10;
          return <line key={i} x1={32} y1={y} x2={430} y2={y} stroke="#EBE0D2" strokeWidth={1.5} strokeDasharray="5 5" />;
        })}
        {BAR_DATA.map((val, i) => {
          const bw = 36;
          const gap = 24;
          const x = 36 + i * (bw + gap);
          const bh = (val / maxVal) * barH;
          const y = barH - bh + 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={bh} rx={8} fill="#C9A227" opacity={0.65 + (val / maxVal) * 0.35} className="hover:opacity-100 transition-opacity cursor-pointer" />
              <text x={x + bw / 2} y={barH + 26} fill="#897E72" fontSize={11} fontWeight="600" textAnchor="middle">{MONTHS[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────── DASHBOARD PAGE ───────────────────────────────────────── */
export default function DashboardPage() {
  const [chartPeriod] = useState("Last 7 Months");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [topSalons, setTopSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json().catch(() => ({}));

        setStats(data.stats);

        // Build plan array for donut
        const pd: Record<string, number> = data.planDistribution || {};
        setPlans(
          Object.entries(pd)
            .filter(([, count]) => (count as number) > 0)
            .map(([label, count]) => ({
              label,
              count: count as number,
              color: PLAN_COLORS[label] || "#888",
            }))
        );

        // Build top salons list
        setTopSalons(
          (data.topSalons || []).map((s: any, idx: number) => ({
            rank: idx + 1,
            name: s.name,
            city: s.city,
            revenue: formatINR(s.revenue),
            trend: "+0%",
            up: true,
          }))
        );

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [API_URL]);

  if (loading) {
    return <LoadingScreen />;
  }

  const s = stats || {};

  const DYNAMIC_STATS: Stat[] = [
    {
      label: "Total Salons & Spas",
      value: s.totalSalonsAndSpas?.toString() || "0",
      trend: "+14%", up: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18v13H3z" />
          <path d="M8 7V5a4 4 0 0 1 8 0v2" />
        </svg>
      )
    },
    {
      label: "Active Branches",
      value: s.totalBranches?.toString() || "0",
      trend: "+8%", up: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    {
      label: "Total Customers",
      value: s.totalCustomers?.toLocaleString() || "0",
      trend: "+22%", up: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Platform Revenue",
      value: formatINR(s.totalRevenue || 0),
      trend: "+18%", up: true, gold: true,
      icon: <span className="text-xl font-bold">₹</span>,
    },
    {
      label: "Active Subscriptions",
      value: s.activeSubscriptions?.toString() || "0",
      trend: "+11%", up: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      label: "Pending Approvals",
      value: s.pendingApprovals?.toString() || "0",
      trend: "-30%", up: false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "MRR",
      value: formatINR(s.mrr || 0),
      trend: "+16%", up: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      label: "System Uptime",
      value: "99.8%",
      trend: "+0.1%", up: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
  ];

  const displayStats = stats ? DYNAMIC_STATS : STATS;
  const displaySalons = topSalons.length > 0 ? topSalons : TOP_SALONS;

  return (
    <>
      <style>{`
        /* Setup the fonts to override defaults, making it soft and premium */
        .dashboard-root {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          animation: fadeUp 0.6s ease-out forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .rev-plan-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1023px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .rev-plan-grid { grid-template-columns: 1fr; }
          .bottom-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 639px) {
          .stats-grid { grid-template-columns: 1fr; gap: 16px; }
          .rev-plan-grid { gap: 16px; margin-bottom: 16px; }
          .bottom-grid { gap: 16px; }
        }
      `}</style>

      <div className="dashboard-root">

        {/* Greeting Section */}
        <div className="mb-8 pl-1">
          <h1 className="text-[32px] font-bold text-premium-primary mb-1 tracking-tight" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Good morning, SuperAdmin ✦
          </h1>
          <p className="text-[15px] text-premium-secondary font-medium">
            Here's what's happening across your platform today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {displayStats.map((st, i) => <StatCard key={i} stat={st} />)}
        </div>

        {/* Revenue Chart + Plan Distribution */}
        <div className="rev-plan-grid">

          {/* Revenue Chart */}
          <Card>
            <div className="flex justify-between items-start mb-6 gap-2 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-premium-primary">Revenue Trend <span className="text-premium-gold ml-1">↗</span></h2>
                <p className="text-premium-secondary text-[13px] mt-1 font-medium">Monthly platform revenue & subscriptions</p>
              </div>
              <div className="flex bg-[#F2EDEA] rounded-full p-1 border border-[#EBE0D2]">
                <button className="px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider rounded-full bg-white text-premium-primary shadow-sm">Monthly</button>
              </div>
            </div>
            <div className="pt-2">
              <RevenueChart />
            </div>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <h2 className="text-xl font-bold text-premium-primary mb-1">Plan Distribution</h2>
            <p className="text-premium-secondary text-[13px] mb-8 font-medium">Active subscription tiers</p>
            <div className="flex flex-col items-center gap-8 xl:flex-row xl:justify-between px-2">
              <div className="flex justify-center shrink-0">
                <DonutChart plans={plans} />
              </div>
              <div className="flex-1 w-full space-y-4 max-w-[200px]">
                {plans.map((p) => (
                  <div key={p.label} className="flex justify-between items-center group">
                    <span className="flex items-center gap-3 text-premium-secondary text-[14px] font-medium group-hover:text-premium-primary transition-colors">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: p.color }} />
                      {p.label}
                    </span>
                    <span className="text-premium-primary font-bold text-[15px]">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performing Salons + System Health + Subscription Growth */}
        <div className="bottom-grid">

          {/* Popular Services / Salons */}
          <Card>
            <div className="flex justify-between items-center mb-6 gap-2">
              <div>
                <h2 className="text-xl font-bold text-premium-primary">Popular Salons</h2>
                <p className="text-premium-secondary text-[13px] mt-1 font-medium">This month's top performers</p>
              </div>
              <span className="text-premium-gold text-[13px] font-bold uppercase tracking-wider cursor-pointer hover:underline underline-offset-4">View All</span>
            </div>

            <div className="space-y-2">
              {displaySalons.map((salon) => (
                <div key={salon.rank} className="flex items-center gap-4 py-3 border-b border-[#F2EDEA] last:border-0 hover:bg-[#FDFBF9] rounded-lg px-2 transition-colors">
                  {/* Rank badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${salon.rank === 1 ? 'bg-premium-gold text-white' : 'bg-white border border-[#EBE0D2] text-premium-primary'}`}>
                    #{salon.rank}
                  </div>

                  {/* Name + city */}
                  <div className="flex-1 min-w-0">
                    <div className="text-premium-primary font-bold text-[15px] truncate">{salon.name}</div>
                    <div className="text-premium-secondary text-[12px] font-medium mt-0.5">{salon.city}</div>
                  </div>

                  {/* Revenue + trend */}
                  <div className="text-right shrink-0">
                    <div className="text-premium-primary font-bold text-[15px]">{salon.revenue}</div>
                    <div className={`text-[12px] mt-0.5 font-bold ${salon.up ? "text-green-600" : "text-red-500"}`}>
                      {salon.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* System Health */}
            <Card>
              <div className="flex justify-between items-center mb-5 gap-2 flex-wrap">
                <h2 className="text-[17px] font-bold text-premium-primary">System Health</h2>
                <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Operational
                </span>
              </div>
              <SystemHealthGrid />
            </Card>

            {/* Subscription Growth */}
            <Card className="flex-1">
              <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                <h2 className="text-[17px] font-bold text-premium-primary">Subscription Growth</h2>
                <span className="bg-[#FAF7F2] text-premium-gold border border-[#EBE0D2] rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                  +19% MoM
                </span>
              </div>
              <SubGrowthBars />
            </Card>
          </div>
        </div>

      </div>
    </>
  );
}