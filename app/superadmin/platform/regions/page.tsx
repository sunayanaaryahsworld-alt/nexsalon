"use client";

import React, { useEffect, useState, useCallback } from 'react';
import LoadingScreen from "@/app/components/LoadingScreen";
import {
  MapPin,
  Building2,
  Users,
  TrendingUp,
  ChevronRight,
  Star,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/* ─── Types ─── */
interface RegionStat {
  city: string;
  salons: number;
  spas: number;
  total: number;
  revenue: number;
  revenueFormatted: string;
  employees: number;
  avgRating: number | null;
}

interface PlanDist {
  name: string;
  value: number;
}

interface Summary {
  totalCities: number;
  totalSalons: number;
  totalSpas: number;
  totalEmployees: number;
  totalRevenue: string;
  planDist: PlanDist[];
  regions: RegionStat[];
}

/* ─── Helpers ─── */
function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

const PLAN_COLORS: Record<string, string> = {
  Enterprise: '#D4A117',
  Pro: '#c8922a',
  Starter: '#f0c040',
  Trial: '#a3c4bc',
  None: '#e0d8c8',
};

/* ─── Loading skeleton ─── */
function SkeletonCard() {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#F2EFE6] shadow-sm animate-pulse">
      <div className="h-3 w-24 bg-[#F2EFE6] rounded mb-4" />
      <div className="h-8 w-16 bg-[#F2EFE6] rounded" />
    </div>
  );
}

/* ─── Main Page ─── */
export default function RegionControlPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!API_BASE) { setError("API URL not set"); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/superdashboard/regions`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingScreen />;

  /* ─ Stats cards ─ */
  const stats = summary
    ? [
      { label: 'Total Cities', value: String(summary.totalCities), icon: MapPin },
      { label: 'Total Businesses', value: String(summary.totalSalons + summary.totalSpas), icon: Building2 },
      { label: 'Total Employees', value: String(summary.totalEmployees), icon: Users },
      { label: 'Total Revenue', value: summary.totalRevenue, icon: TrendingUp },
    ]
    : [];

  /* ─ Chart data: top 5 cities by salon count ─ */
  const chartData = summary?.regions
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((r) => ({ name: r.city.slice(0, 5), value: r.total, revenue: r.revenueFormatted })) ?? [];

  /* ─ Error state ─ */
  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#c0392b] font-medium mb-2">Failed to load regions</p>
          <p className="text-sm text-[#8C877D] mb-4">{error}</p>
          <button onClick={fetchData} className="bg-[#D4A117] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b8891a] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF3] font-sans text-[#433E37]">

      {/* Header */}
      <header className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-[22px] sm:text-3xl font-serif font-bold text-[#2D2A26]">
          Region &amp; Franchise Control
        </h1>
        <p className="text-[#8C877D] mt-1 text-sm">
          Real-time breakdown by city — salons, spas, employees and revenue
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#F2EFE6] shadow-sm">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <p className="text-[#8C877D] text-xs sm:text-sm font-medium leading-snug">{stat.label}</p>
                <stat.icon size={16} className="text-[#D4A117] flex-shrink-0" strokeWidth={1.5} />
              </div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2A26]">{stat.value}</p>
            </div>
          ))
        }
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 mb-6 sm:mb-8">

        {/* ── Bar Chart: City vs Total Businesses ── */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#F2EFE6] shadow-sm">
          <h2 className="text-base sm:text-lg font-serif font-bold mb-5 sm:mb-8">
            Businesses by City
          </h2>
          {loading ? (
            <div className="h-56 sm:h-72 animate-pulse bg-[#F9F8F3] rounded-xl" />
          ) : (
            <div className="h-56 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EFE6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8C877D', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8C877D', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#FDFBF3' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(value: any) => [value, "Businesses"]}
                  />
                  <Bar dataKey="value" fill="#D4A117" radius={[4, 4, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* ── Pie Chart: Plan Distribution ── */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#F2EFE6] shadow-sm">
          <h2 className="text-base sm:text-lg font-serif font-bold mb-5 sm:mb-8">
            Subscription Plan Distribution
          </h2>
          {loading ? (
            <div className="h-56 sm:h-72 animate-pulse bg-[#F9F8F3] rounded-xl" />
          ) : (
            <div className="h-56 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.planDist ?? []}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {(summary?.planDist ?? []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name] ?? '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* ── Regions Overview Table ── */}
      <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#F2EFE6] shadow-sm">
        <h2 className="text-base sm:text-lg font-serif font-bold mb-5 sm:mb-6">
          City-wise Overview
        </h2>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F2EFE6]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-[#F2EFE6] rounded" />
                  <div className="h-2.5 w-48 bg-[#F2EFE6] rounded" />
                </div>
                <div className="h-3 w-16 bg-[#F2EFE6] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-[#B3AE9F] font-bold border-b border-[#F9F8F3]">
                    <th className="pb-3 pr-6">City</th>
                    <th className="pb-3 pr-6">Salons</th>
                    <th className="pb-3 pr-6">Spas</th>
                    <th className="pb-3 pr-6">Employees</th>
                    <th className="pb-3 pr-6">Revenue</th>
                    <th className="pb-3">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF9F6]">
                  {(summary?.regions ?? [])
                    .sort((a, b) => b.total - a.total)
                    .filter((r) => r.city !== 'Unknown' && !r.city.match(/^[a-z]{4,}$/))
                    .map((region, idx) => (
                      <tr key={idx} className="hover:bg-[#FDFBF3]/50 transition-colors group">
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#FDFBF3] flex items-center justify-center border border-[#F2EFE6] flex-shrink-0">
                              <MapPin size={15} className="text-[#D4A117]" />
                            </div>
                            <span className="text-sm font-bold text-[#2D2A26]">{region.city}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-6 text-sm font-semibold text-[#433E37]">{region.salons}</td>
                        <td className="py-4 pr-6 text-sm font-semibold text-[#433E37]">{region.spas}</td>
                        <td className="py-4 pr-6 text-sm font-semibold text-[#433E37]">{region.employees}</td>
                        <td className="py-4 pr-6 text-sm font-bold text-[#2D2A26]">{region.revenueFormatted}</td>
                        <td className="py-4">
                          {region.avgRating !== null ? (
                            <div className="flex items-center gap-1">
                              <Star size={13} fill="#D4A117" stroke="#D4A117" />
                              <span className="text-sm font-semibold text-[#433E37]">{region.avgRating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-[#B3AE9F]">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {(summary?.regions ?? [])
                .sort((a, b) => b.total - a.total)
                .filter((r) => r.city !== 'Unknown' && !r.city.match(/^[a-z]{4,}$/))
                .map((region, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FDFBF3] flex items-center justify-center border border-[#F2EFE6] flex-shrink-0">
                        <MapPin size={15} className="text-[#D4A117]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#2D2A26] truncate">{region.city}</h3>
                        <p className="text-xs text-[#8C877D]">
                          {region.salons} salons · {region.spas} spas · {region.employees} staff
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#2D2A26]">{region.revenueFormatted}</p>
                      {region.avgRating !== null && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <Star size={11} fill="#D4A117" stroke="#D4A117" />
                          <span className="text-xs font-semibold text-[#433E37]">{region.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}