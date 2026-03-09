"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL

type AuditLog = {
  id?: string;
  _id?: string;
  type?: string;
  activity?: string;
  createdAt?: number;
  updatedBy?: {
    name?: string;
    role?: string;
  };
  businessId?: string;
  ipAddress?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (ms: number | undefined) => {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return `Just now`;
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const TYPE_META = {
  Test:           { label: "Test",             color: "#8b5cf6", bg: "#ede9fe" },
  PlanUpgrade:    { label: "Plan Upgraded",     color: "#059669", bg: "#d1fae5" },
  PlanDowngrade:  { label: "Plan Downgraded",   color: "#d97706", bg: "#fef3c7" },
  UserBlocked:    { label: "User Blocked",      color: "#dc2626", bg: "#fee2e2" },
  UserUnblocked:  { label: "User Unblocked",    color: "#2563eb", bg: "#dbeafe" },
  SalonSuspend:   { label: "Salon Suspended",   color: "#7c3aed", bg: "#ede9fe" },
  Commission:     { label: "Commission Changed",color: "#0891b2", bg: "#cffafe" },
  Automation:     { label: "Automation Rule",   color: "#65a30d", bg: "#ecfccb" },
  default:        { label: "Activity",          color: "#6b7280", bg: "#f3f4f6" },
};

const getTypeMeta = (type: string = "") =>
  TYPE_META[type as keyof typeof TYPE_META] || TYPE_META.default;

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }: any) => (
  <div style={{
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 160,
    flex: "1 1 160px",
  }}>
    <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: 30, fontWeight: 700, color: accent || "#111827", lineHeight: 1.1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: "#6b7280" }}>{sub}</span>}
  </div>
);

const Badge = ({ type }: any) => {
  const meta = getTypeMeta(type);
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 20,
      background: meta.bg,
      color: meta.color,
      letterSpacing: "0.02em",
    }}>
      {meta.label}
    </span>
  );
};

const LogRow = ({ log }: any) => (
  <div style={{
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    padding: "18px 24px",
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.15s",
  }}
    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: "#f3f4f6", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
          {log.activity}
        </span>
        <Badge type={log.type} />
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
        {log.updatedBy?.name && (
          <span>👤 {log.updatedBy.name}
            {log.updatedBy.role && ` · ${log.updatedBy.role}`}
          </span>
        )}
        {log.businessId && <span>🏢 {log.businessId}</span>}
        {log.ipAddress && <span>🌐 {log.ipAddress}</span>}
      </div>
    </div>

    <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
      {timeAgo(log.createdAt)}
    </span>
  </div>
);

const EmptyState = () => (
  <div style={{ padding: "60px 24px", textAlign: "center" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
    <p style={{ color: "#6b7280", fontSize: 14 }}>No audit logs found for this period.</p>
  </div>
);

const Spinner = () => (
  <div style={{ padding: "60px 24px", textAlign: "center" }}>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      .loading-spinner {
        width: 32px; height: 32px; border: 3px solid #e5e7eb;
        border-top-color: #b8860b; borderRadius: 50%;
        animation: spin 0.8s linear infinite; margin: 0 auto;
      }
    `}</style>
    <div className="loading-spinner" />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ComplianceAuditPage() {
const [logs, setLogs] = useState<AuditLog[]>([]);
 const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [days, setDays]         = useState("30");
  const [typeFilter, setTypeFilter] = useState("all");
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportSection, setExportSection] = useState("all");
  const [error, setError]       = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const logsPerPage = 10;

  const fetchLogs = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(
      `${API_BASE}/compliance/logs?days=${days}&page=${currentPage}&limit=${logsPerPage}`,
      { headers: { Accept: "application/json" } }
    );

    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    setLogs(json.data || []);
    setTotalPages(json.totalPages || 1);

  } catch (err: any) {
  setError(err?.message || "Something went wrong");
} finally {
    setLoading(false);
  }
}, [days, currentPage, logsPerPage]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/summary?days=${days}`, {
        headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json.success) setSummary(json);
    } catch (_) {}
  }, [days]);

useEffect(() => {
  fetchLogs();
  fetchSummary();
}, [fetchLogs, fetchSummary]);

  const handleExport = async () => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const url = `${API_BASE}/export?format=${exportFormat}&section=${exportSection}&days=${days}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const ext  = exportFormat === "json" ? "json" : "csv";
      const filename = `compliance_export_${new Date().toISOString().slice(0, 10)}.${ext}`;
      
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err: any) {
  alert("Export failed: " + err.message);
} finally {
      setExporting(false);
    }
  };

  const filteredLogs = typeFilter === "all"
    ? logs
    : logs.filter((l) => l.type === typeFilter);

  const uniqueTypes = ["all", ...new Set(logs.map((l) => l.type).filter(Boolean))];

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#f5f4ef",
      minHeight: "100vh",
      padding: "32px 24px",
      position: "relative"
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>
            Compliance &amp; Audit
          </h1>
          <p style={{ color: "#6b7280", margin: "6px 0 0", fontSize: 14 }}>
            Audit logs, data exports and legal compliance settings
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 101 }}>
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={exporting}
            style={{
              background: "#b8860b",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: exporting ? 0.7 : 1,
              boxShadow: "0 2px 8px rgba(184,134,11,0.3)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? "Exporting…" : "Export Data"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showExportMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showExportMenu && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 102,
              padding: 16, width: 240,
            }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Format</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["csv", "json"].map((f) => (
                  <button key={f} onClick={() => setExportFormat(f)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", border: "1.5px solid",
                    borderColor: exportFormat === f ? "#b8860b" : "#e5e7eb",
                    background: exportFormat === f ? "#fef9ec" : "#fff",
                    color: exportFormat === f ? "#b8860b" : "#374151",
                  }}>{f.toUpperCase()}</button>
                ))}
              </div>

              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Section</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {[["all", "All Data"], ["logs", "Audit Logs Only"], ["subscriptions", "Subscriptions Only"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => setExportSection(val)} style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: 13, textAlign: "left", cursor: "pointer",
                    border: "1.5px solid", borderColor: exportSection === val ? "#b8860b" : "#e5e7eb",
                    background: exportSection === val ? "#fef9ec" : "#fff",
                    color: exportSection === val ? "#b8860b" : "#374151", fontWeight: exportSection === val ? 600 : 400,
                  }}>{lbl}</button>
                ))}
              </div>

              <button onClick={handleExport} style={{
                width: "100%", padding: "10px 0", background: "#b8860b", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      {summary && (
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard
            label="Total Logs"
            value={summary.auditLogs?.total ?? 0}
            sub={`Last ${days} days`}
            accent="#1a1a1a"
          />
          <StatCard
            label="Active Subscriptions"
            value={summary.subscriptions?.active ?? 0}
            accent="#059669"
          />
          <StatCard
            label="Trial Accounts"
            value={summary.subscriptions?.trial ?? 0}
            accent="#d97706"
          />
          <StatCard
            label="Expired"
            value={summary.subscriptions?.expired ?? 0}
            accent="#dc2626"
          />
        </div>
      )}

      {/* ── Audit Log Card ──────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "visible", // Changed from hidden so dropdowns can overflow
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 12,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Audit Log</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={days}
              onChange={(e) => {
  setDays(e.target.value);
  setCurrentPage(1);
}}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", outline: "none",
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
  setTypeFilter(e.target.value);
  setCurrentPage(1);
}}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", outline: "none",
              }}
            >
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
              ))}
            </select>

            <span style={{ fontSize: 13, color: "#9ca3af" }}>
              {loading ? "Loading…" : `${filteredLogs.length} record${filteredLogs.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {error ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ color: "#dc2626", fontSize: 14 }}>⚠️ {error}</p>
            <button onClick={fetchLogs} style={{
              marginTop: 12, padding: "8px 20px", background: "#b8860b",
              color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13,
            }}>Retry</button>
          </div>
        ) : loading ? (
          <Spinner />
        ) : filteredLogs.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ overflow: "hidden", borderRadius: "0 0 16px 16px" }}>
            {filteredLogs.map((log) => (
              <LogRow key={log.id || log._id} log={log} />
            ))}
            <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid #f3f4f6"
  }}
>
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    style={{
      padding: "6px 16px",
      borderRadius: 6,
      border: "1px solid #e5e7eb",
      cursor: "pointer",
      opacity: currentPage === 1 ? 0.4 : 1
    }}
  >
    Previous
  </button>

  <span style={{ fontSize: 13, color: "#6b7280" }}>
    Page {currentPage} of {totalPages}
  </span>

  <button
    onClick={() =>
      setCurrentPage((p) => Math.min(p + 1, totalPages))
    }
    disabled={currentPage === totalPages}
    style={{
      padding: "6px 16px",
      borderRadius: 6,
      border: "1px solid #e5e7eb",
      cursor: "pointer",
      opacity: currentPage === totalPages ? 0.4 : 1
    }}
  >
    Next
  </button>
</div>
          </div>
        )}
      </div>

      {showExportMenu && (
        <div
          onClick={() => setShowExportMenu(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100 }}
        />
      )}
    </div>
  );
}