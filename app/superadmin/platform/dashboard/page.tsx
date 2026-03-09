//.........................................................................................................................//
"use client";
import React, { useState, useEffect } from "react";
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
    icon: <span className="text-sm font-bold">₹</span>
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

/* ───────────────────────────────────────── CHART DATA ───────────────────────────────────────── */
const MONTHS      = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
const REVENUE_PTS = [340, 320, 305, 295, 285, 265, 230];
const BAR_DATA    = [190, 210, 200, 230, 215, 240, 260];

/* ───────────────────────────────────────── PLAN COLORS ───────────────────────────────────────── */
const PLAN_COLORS: Record<string, string> = {
  Enterprise: "#c8922a",
  Pro:        "#5c3d1a",
  Starter:    "#c9b89a",
  Trial:      "#e8d5b0",
};

const API_BASE =
 process.env.NEXT_PUBLIC_API_URL;

const API_URL = `${API_BASE}/superdashboard/dashboard`;
  
/* ───────────────────────────────────────── HELPERS ───────────────────────────────────────── */
function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

/* ───────────────────────────────────────── CARD COMPONENT ───────────────────────────────────────── */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e0d0",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────────────────── ICON BUBBLE ───────────────────────────────────────── */
function IconBubble({ gold, children }: { gold?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: gold ? "#c8922a" : "#f0ebe0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────── STAT CARD ───────────────────────────────────────── */
function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: "#7a6a50", fontWeight: 500, lineHeight: 1.3 }}>{stat.label}</span>
        <IconBubble gold={stat.gold}>{stat.icon}</IconBubble>
      </div>
      <div style={{
        fontSize: 26,
        fontWeight: 700,
        color: stat.gold ? "#c8922a" : "#1a1208",
        marginTop: 8,
        letterSpacing: "-0.5px",
      }}>
        {stat.value}
      </div>
      <div style={{
        fontSize: 12,
        color: stat.up ? "#22c55e" : "#ef4444",
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        <span>{stat.up ? "↗" : "↘"}</span>
        <span style={{ fontWeight: 600 }}>{stat.trend}</span>
        <span style={{ color: "#9a8a70" }}>vs last month</span>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────── REVENUE CHART ───────────────────────────────────────── */
function RevenueChart() {
  const w = 560, h = 200;
  const padL = 48, padB = 24, padR = 8, padT = 10;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const xStep  = chartW / (MONTHS.length - 1);
  const minV = 200, maxV = 380;
  const toY  = (v: number) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH;
  const toX  = (i: number) => padL + i * xStep;
  const pts  = REVENUE_PTS.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const fillPts = `${padL},${h - padB} ${pts} ${toX(MONTHS.length - 1)},${h - padB}`;
  const gridLines = [0, 25000, 50000, 75000, 100000];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c8922a" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#c8922a" stopOpacity={0}    />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((val, i) => {
        const pct = i / (gridLines.length - 1);
        const y   = padT + chartH - pct * chartH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#e8e0d0" strokeWidth={1} strokeDasharray="4 3" />
            <text x={padL - 6} y={y + 4} fill="#9a8a70" fontSize={9} textAnchor="end">
              {val === 0 ? "0" : val >= 1000 ? `${val / 1000}k` : val}
            </text>
          </g>
        );
      })}

      {/* Fill */}
      <polygon points={fillPts} fill="url(#revGrad)" />

      {/* Line */}
      <polyline points={pts} fill="none" stroke="#c8922a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {REVENUE_PTS.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={3.5} fill="#c8922a" />
      ))}

      {/* X labels */}
      {MONTHS.map((m, i) => (
        <text key={i} x={toX(i)} y={h - 4} fill="#9a8a70" fontSize={10} textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

/* ───────────────────────────────────────── DONUT CHART ───────────────────────────────────────── */
function DonutChart({ plans }: { plans: Plan[] }) {
  const total = plans.reduce((s, p) => s + p.count, 0);
  const r = 54, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;

  const segments = plans.map((p) => {
    const pct    = total > 0 ? p.count / total : 0;
    const dash   = pct * circ;
    const gap    = circ - dash;
    const offset = -cumulative * circ;
    cumulative  += pct;
    return { ...p, dash, gap, offset };
  });

  return (
    <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0ebe0" strokeWidth={16} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={16}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={s.offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      <text x={cx} y={cy - 6}  fill="#1a1208" fontSize={16} fontWeight={700} textAnchor="middle">{total}</text>
      <text x={cx} y={cy + 10} fill="#9a8a70" fontSize={9}  textAnchor="middle">Active</text>
    </svg>
  );
}

/* ───────────────────────────────────────── SYSTEM HEALTH GRID ───────────────────────────────────────── */
function SystemHealthGrid() {
  const items = [
    { label: "API",     pct: 99.9, color: "#22c55e" },
    { label: "DB",      pct: 99.7, color: "#22c55e" },
    { label: "Storage", pct: 98.4, color: "#c8922a" },
    { label: "CDN",     pct: 99.8, color: "#22c55e" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
      {items.map((h) => (
        <div key={h.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#7a6a50", fontSize: 13 }}>{h.label}</span>
            <span style={{ color: h.color, fontSize: 13, fontWeight: 700 }}>{h.pct}%</span>
          </div>
          <div style={{ background: "#f0ebe0", borderRadius: 4, height: 7 }}>
            <div style={{ background: h.color, borderRadius: 4, height: 7, width: `${h.pct}%`, transition: "width 0.6s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────── SUBSCRIPTION GROWTH BARS ───────────────────────────────────────── */
function SubGrowthBars() {
  const maxVal =
  BAR_DATA.length > 0
    ? Math.max(...BAR_DATA)
    : 1;
    
  const barH   = 90;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox="0 0 430 120" style={{ width: "100%", minWidth: 280 }}>
        {/* Y labels */}
        {[80, 320].map((v, i) => {
          const y = barH - (v / maxVal) * barH + 10;
          return (
            <text key={i} x={0} y={y} fill="#9a8a70" fontSize={9}>{v}</text>
          );
        })}
        {/* Grid lines */}
        {[80, 320].map((v, i) => {
          const y = barH - (v / maxVal) * barH + 10;
          return (
            <line key={i} x1={28} y1={y} x2={430} y2={y} stroke="#e8e0d0" strokeWidth={1} strokeDasharray="3 3" />
          );
        })}
        {BAR_DATA.map((val, i) => {
          const bw      = 40;
          const gap     = 20;
          const x       = 30 + i * (bw + gap);
          const bh      = (val / maxVal) * barH;
          const y       = barH - bh + 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={bh} rx={6} fill="#c8922a" opacity={0.75 + (val / maxVal) * 0.25} />
              <text x={x + bw / 2} y={barH + 22} fill="#9a8a70" fontSize={9} textAnchor="middle">{MONTHS[i]}</text>
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
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [topSalons,  setTopSalons]  = useState<Salon[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
      const res  = await fetch(API_URL);
        const data = await res.json().catch(() => ({}));

        setStats(data.stats);

        // Build plan array for donut
       const pd: Record<string, number> =
  data.planDistribution || {};
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
            rank:    idx + 1,
            name:    s.name,
            city:    s.city,
            revenue: formatINR(s.revenue),
            trend:   "+0%",
            up:      true,
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
    return (
      <div style={{ color: "#c8922a", padding: 40, textAlign: "center", background: "#f5f0e8", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        Loading...
      </div>
    );
  }

  const s = stats || {};

  const DYNAMIC_STATS: Stat[] = [
    {
      label: "Total Salons & Spas",
      value: s.totalSalonsAndSpas?.toString() || "0",
      trend: "+14%", up: true,
      icon: "🏪",
    },
    {
      label: "Active Branches",
      value: s.totalBranches?.toString() || "0",
      trend: "+8%", up: true,
      icon: "📊",
    },
    {
      label: "Total Customers",
      value: s.totalCustomers?.toLocaleString() || "0",
      trend: "+22%", up: true,
      icon: "👥",
    },
    {
      label: "Platform Revenue",
      value: formatINR(s.totalRevenue || 0),
      trend: "+18%", up: true, gold: true,
      icon: "₹",
    },
    {
      label: "Active Subscriptions",
      value: s.activeSubscriptions?.toString() || "0",
      trend: "+11%", up: true,
      icon: "💳",
    },
    {
      label: "Pending Approvals",
      value: s.pendingApprovals?.toString() || "0",
      trend: "-30%", up: false,
      icon: "🕐",
    },
    {
      label: "MRR",
      value: formatINR(s.mrr || 0),
      trend: "+16%", up: true,
      icon: "📈",
    },
    {
      label: "System Uptime",
      value: "99.8%",
      trend: "+0.1%", up: true,
      icon: "✓",
    },
  ];

  const displayStats = stats ? DYNAMIC_STATS : STATS;
  const displaySalons = topSalons.length > 0 ? topSalons : TOP_SALONS;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .dashboard-root {
          min-height: 100vh;
          background: #f5f0e8;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        /* ── Revenue + Plan row ── */
        .rev-plan-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        /* ── Bottom row ── */
        .bottom-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }

        .right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Tablet: 768–1023px ── */
        @media (max-width: 1023px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .rev-plan-grid {
            grid-template-columns: 1fr;
          }
          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Mobile: <640px ── */
        @media (max-width: 639px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .rev-plan-grid {
            gap: 12px;
            margin-bottom: 12px;
          }
          .bottom-grid {
            gap: 12px;
          }
        }

        /* ── Very small: <400px ── */
        @media (max-width: 399px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Plan distribution — side-by-side on tablet */
        .plan-inner {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .plan-list {
          flex: 1;
        }
        @media (max-width: 639px) {
          .plan-inner {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .plan-list {
            width: 100%;
          }
        }
      `}</style>

      <div className="dashboard-root">

        {/* Greeting */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, color: "#1a1208", margin: 0, letterSpacing: "-0.5px" }}>
            Good morning, SuperAdmin ✦
          </h1>
          <p style={{ color: "#7a6a50", margin: "6px 0 0", fontSize: 14 }}>
            Here's what's happening across your platform today.
          </p>
        </div>

        {/* Stats Grid — 4 cols desktop, 2 cols tablet+mobile */}
        <div className="stats-grid">
          {displayStats.map((st, i) => <StatCard key={i} stat={st} />)}
        </div>

        {/* Revenue Chart + Plan Distribution */}
        <div className="rev-plan-grid">

          {/* Revenue Chart */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "#1a1208", fontWeight: 700, fontSize: 16 }}>Revenue Overview</div>
                <div style={{ color: "#9a8a70", fontSize: 12, marginTop: 2 }}>Monthly platform revenue & subscriptions</div>
              </div>
              <span style={{
                background: "#f0ebe0",
                border: "1px solid #e0d8c8",
                borderRadius: 20,
                padding: "4px 14px",
                color: "#7a6a50",
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {chartPeriod}
              </span>
            </div>
            <RevenueChart />
          </Card>

          {/* Plan Distribution */}
          <Card>
            <div style={{ color: "#1a1208", fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Plan Distribution</div>
            <div style={{ color: "#9a8a70", fontSize: 12, marginBottom: 16 }}>Active subscription tiers</div>
            <div className="plan-inner">
              <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
                <DonutChart plans={plans} />
              </div>
              <div className="plan-list">
                {plans.map((p) => (
                  <div key={p.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#7a6a50", fontSize: 13 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
                      {p.label}
                    </span>
                    <span style={{ color: "#1a1208", fontWeight: 700, fontSize: 14 }}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performing Salons + System Health + Subscription Growth */}
        <div className="bottom-grid">

          {/* Top Performing Salons */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 8 }}>
              <div>
                <div style={{ color: "#1a1208", fontWeight: 700, fontSize: 16 }}>Top Performing Salons</div>
                <div style={{ color: "#9a8a70", fontSize: 12, marginTop: 2 }}>By revenue this month</div>
              </div>
              <span style={{ color: "#c8922a", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>View All →</span>
            </div>

            {displaySalons.map((salon) => (
              <div key={salon.rank} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderBottom: "1px solid #f0ebe0",
              }}>
                {/* Rank badge */}
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: salon.rank === 1 ? "#c8922a" : "#f0ebe0",
                  color: salon.rank === 1 ? "#ffffff" : "#7a6a50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  flexShrink: 0,
                }}>
                  #{salon.rank}
                </div>

                {/* Avatar circle */}
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#f0ebe0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}>
                  ✂
                </div>

                {/* Name + city */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#1a1208", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{salon.name}</div>
                  <div style={{ color: "#9a8a70", fontSize: 11, marginTop: 1 }}>{salon.city}</div>
                </div>

                {/* Revenue + trend */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: "#1a1208", fontWeight: 700, fontSize: 13 }}>{salon.revenue}</div>
                  <div style={{ color: salon.up ? "#22c55e" : "#ef4444", fontSize: 11, marginTop: 1, fontWeight: 600 }}>
                    {salon.trend}
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Right column */}
          <div className="right-col">

            {/* System Health */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                <div style={{ color: "#1a1208", fontWeight: 700, fontSize: 16 }}>System Health</div>
                <span style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  ● Operational
                </span>
              </div>
              <SystemHealthGrid />
            </Card>

            {/* Subscription Growth */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ color: "#1a1208", fontWeight: 700, fontSize: 16 }}>Subscription Growth</div>
                <span style={{
                  background: "#f0ebe0",
                  border: "1px solid #e0d8c8",
                  borderRadius: 20,
                  padding: "3px 10px",
                  color: "#c8922a",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
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