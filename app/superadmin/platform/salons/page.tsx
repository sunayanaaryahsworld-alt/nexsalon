"use client";

import { useState, useEffect } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type Status = "Active" | "Pending" | "Suspended";
type Plan = "Enterprise" | "Pro" | "Starter" | "Trial";
type Filter = "All" | Status;

interface Salon {
  id: number;
  firebaseId: string;
  name: string;
  owner: string;
  city: string;
  plan: Plan;
  branches: number;
  revenue: string;
  rating: number | null;
  status: Status;
}

const ITEMS_PER_PAGE = 8;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function normalizePlan(raw = ""): Plan {
  const p = raw.toLowerCase();
  if (p.includes("enterprise"))                          return "Enterprise";
  if (p.includes("premium") || p.includes("pro"))       return "Pro";
  if (p.includes("standard") || p.includes("starter"))  return "Starter";
  if (p.includes("trial"))                               return "Trial";
  return "Starter";
}

function normalizeStatus(raw = ""): Status {
  const s = raw.toLowerCase();
  if (s === "active")                          return "Active";
  if (s === "suspended" || s === "cancelled")  return "Suspended";
  return "Pending";
}

/* ─────────────────────────────────────────
   HELPERS — styling maps (unchanged)
───────────────────────────────────────── */
const planColors: Record<Plan, string> = {
  Enterprise: "bg-[#fdf3e0] text-[#c8922a] border-[#f0d9b0]",
  Pro:        "bg-[#fdf3e0] text-[#c8922a] border-[#f0d9b0]",
  Starter:    "bg-[#fdf3e0] text-[#c8922a] border-[#f0d9b0]",
  Trial:      "bg-[#fdf3e0] text-[#c8922a] border-[#f0d9b0]",
};

const statusStyles: Record<Status, string> = {
  Active:    "bg-[#eaf7f0] text-[#27ae60] border-[#c3ecd4]",
  Pending:   "bg-[#fdf3e0] text-[#c8922a] border-[#f0d9b0]",
  Suspended: "bg-[#fdecea] text-[#c0392b] border-[#f5c6c2]",
};

const statusCountColors: Record<Status, string> = {
  Active:    "text-[#27ae60]",
  Pending:   "text-[#c8922a]",
  Suspended: "text-[#c0392b]",
};

/* ─────────────────────────────────────────
   ICON COMPONENTS  (unchanged)
───────────────────────────────────────── */
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function BanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#c8922a" stroke="#c8922a" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   MODAL  (unchanged)
───────────────────────────────────────── */
function Modal({ salon, onClose }: { salon: Salon; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-[#e8e0d4]">
          <h2 className="text-lg font-semibold text-[#1a1208]">{salon.name}</h2>
          <button onClick={onClose} className="text-[#7a6a55] hover:text-[#1a1208] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-3 text-sm">
          {[
            ["Owner",    salon.owner],
            ["City",     salon.city],
            ["Plan",     salon.plan],
            ["Branches", String(salon.branches)],
            ["Revenue",  salon.revenue],
            ["Rating",   salon.rating !== null ? String(salon.rating) : "N/A"],
            ["Status",   salon.status],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-[#7a6a55]">{k}</span>
              <span className="font-medium text-[#1a1208]">{v}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-[#c8922a] hover:bg-[#b07d20] text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function SalonsPage() {
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<Filter>("All");
  const [page,      setPage]      = useState(1);
  const [salons,    setSalons]    = useState<Salon[]>([]);
  const [viewSalon, setViewSalon] = useState<Salon | null>(null);
  const [loading,   setLoading]   = useState(true);

  /* ── Fetch from API ── */
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const res  = await fetch("http://localhost:3001/api/salon/salons");
        const data = await res.json();

        // Handle both { salons: [...] } and plain array responses
        const raw: any[] = Array.isArray(data) ? data : (data.salons ?? []);

        const mapped: Salon[] = raw.map((item: any, idx: number) => ({
          id:         idx + 1,
          firebaseId: item.id ?? item.firebaseId ?? String(idx),
          name:       item.name      || item.branch    || "Unnamed",
          owner:      item.owner     || item.ownerName || "Unknown",
          city:       item.city      || item.address   || "—",
          plan:       normalizePlan(item.plan ?? item.planName ?? ""),
          branches:   Number(item.branches ?? item.branchCount ?? 1),
          // revenue may come as a raw number or pre-formatted string
          revenue:    item.revenue != null
                        ? (typeof item.revenue === "number"
                            ? formatINR(item.revenue)
                            : String(item.revenue))
                        : "₹0",
          rating:     item.rating != null ? Number(item.rating) : null,
          status:     normalizeStatus(item.status ?? item.subscriptionStatus ?? ""),
        }));

        setSalons(mapped);
      } catch (error) {
        console.error("Error fetching salons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, []);

  /* ── Derived counts ── */
  const total     = salons.length;
  const active    = salons.filter((s) => s.status === "Active").length;
  const pending   = salons.filter((s) => s.status === "Pending").length;
  const suspended = salons.filter((s) => s.status === "Suspended").length;

  /* ── Filtered data ── */
  const filtered = salons.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* ── Handlers ── */
  const handleFilterChange = (f: Filter) => { setFilter(f); setPage(1); };
  const handleSearch       = (val: string) => { setSearch(val); setPage(1); };

  const handleReactivate = (id: number) => {
    setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Active" } : s)));
  };
  const handleSuspend = (id: number) => {
    setSalons((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "Suspended" ? "Active" : "Suspended" }
          : s
      )
    );
  };

  const FILTERS: Filter[] = ["All", "Active", "Pending", "Suspended"];

  /* ── Loading state — same layout, no data yet ── */
  if (loading) {
    return (
      <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#1a1208] leading-tight">
              Salon &amp; Spa Management
            </h1>
            <p className="text-sm text-[#7a6a55] mt-1">
              Manage all registered salons and spas on the platform
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {["Total", "Active", "Pending", "Suspended"].map((label) => (
            <div key={label} className="bg-white border border-[#e8e0d4] rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-[#e8e0d4]">—</p>
              <p className="text-sm text-[#7a6a55] mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#e8e0d4] rounded-2xl p-16 text-center text-[#7a6a55] text-sm">
          Loading salons...
        </div>
      </div>
    );
  }

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#1a1208] leading-tight">
            Salon &amp; Spa Management
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Manage all registered salons and spas on the platform
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#c8922a] hover:bg-[#b07d20] text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
          <PlusIcon />
          Add Salon
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",     value: total,     cls: "text-[#1a1208]" },
          { label: "Active",    value: active,    cls: statusCountColors.Active },
          { label: "Pending",   value: pending,   cls: statusCountColors.Pending },
          { label: "Suspended", value: suspended, cls: statusCountColors.Suspended },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white border border-[#e8e0d4] rounded-xl p-5 text-center">
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
            <p className="text-sm text-[#7a6a55] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#e8e0d4] rounded-xl px-4 py-2.5 w-72 text-sm text-[#7a6a55]">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search salons or cities..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-transparent outline-none flex-1 text-[#1a1208] placeholder:text-[#7a6a55]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors
                ${filter === f
                  ? "bg-[#c8922a] text-white border-[#c8922a]"
                  : "bg-white text-[#7a6a55] border-[#e8e0d4] hover:border-[#c8922a] hover:text-[#c8922a]"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#e8e0d4] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3 border-b border-[#e8e0d4]">
          {["SALON", "PLAN", "BRANCHES", "REVENUE", "RATING", "STATUS", "ACTIONS"].map((h) => (
            <p key={h} className="text-[11px] font-semibold tracking-wider text-[#7a6a55] uppercase">
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div className="py-16 text-center text-[#7a6a55] text-sm">
            No salons found matching your criteria.
          </div>
        ) : (
          paginated.map((salon, i) => (
            <div
              key={salon.id}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] px-6 py-4 items-center
                ${i < paginated.length - 1 ? "border-b border-[#f0ebe3]" : ""}
                hover:bg-[#fdf9f4] transition-colors`}
            >
              {/* Salon name + owner */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f0ebe3] flex items-center justify-center text-[13px] font-bold text-[#7a6a55] flex-shrink-0">
                  {salon.name[0]}
                </div>
                <div>
                  <p className="text-[13.5px] font-medium text-[#1a1208]">{salon.name}</p>
                  <p className="text-[11.5px] text-[#7a6a55]">{salon.owner} · {salon.city}</p>
                </div>
              </div>

              {/* Plan */}
              <div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${planColors[salon.plan]}`}>
                  {salon.plan}
                </span>
              </div>

              {/* Branches */}
              <p className="text-[13.5px] text-[#1a1208]">{salon.branches}</p>

              {/* Revenue */}
              <p className="text-[13.5px] font-semibold text-[#1a1208]">{salon.revenue}</p>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {salon.rating !== null ? (
                  <>
                    <StarIcon />
                    <span className="text-[13.5px] text-[#1a1208]">{salon.rating}</span>
                  </>
                ) : (
                  <span className="text-[13px] text-[#b0a090]">N/A</span>
                )}
              </div>

              {/* Status */}
              <div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusStyles[salon.status]}`}>
                  {salon.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* View */}
                <button
                  onClick={() => setViewSalon(salon)}
                  title="View details"
                  className="text-[#b0a090] hover:text-[#1a1208] transition-colors"
                >
                  <EyeIcon />
                </button>
                {/* Reactivate */}
                <button
                  onClick={() => handleReactivate(salon.id)}
                  title="Reactivate"
                  className="text-[#b0a090] hover:text-[#27ae60] transition-colors"
                >
                  <RefreshIcon />
                </button>
                {/* Suspend / Unsuspend */}
                <button
                  onClick={() => handleSuspend(salon.id)}
                  title={salon.status === "Suspended" ? "Unsuspend" : "Suspend"}
                  className={`transition-colors ${
                    salon.status === "Suspended"
                      ? "text-[#c0392b]"
                      : "text-[#b0a090] hover:text-[#c0392b]"
                  }`}
                >
                  <BanIcon />
                </button>
              </div>
            </div>
          ))
        )}

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8e0d4]">
          <p className="text-[13px] text-[#7a6a55]">
            Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} salons
          </p>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors
                  ${page === p
                    ? "bg-[#c8922a] text-white"
                    : "text-[#7a6a55] hover:bg-[#f0ebe3]"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewSalon && (
        <Modal salon={viewSalon} onClose={() => setViewSalon(null)} />
      )}
    </div>
  );
}