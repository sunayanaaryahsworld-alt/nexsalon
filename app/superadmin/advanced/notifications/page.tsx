"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE =
process.env.NEXT_PUBLIC_API_URL;

const API_URL = `${API_BASE}/superadmin/notifications`;

const PAGE_SIZE = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp?: number) {
  if (!timestamp) return "—";

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(timestamp?: number) {
  if (!timestamp) return "—";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

const TYPE_LABELS: Record<string, string> = {
  NEW_ADMIN: "New Admin",
  NEW_APPOINTMENT: "New Appointment",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt?: number;
}

interface ApiResponse {
  total: number;
  count: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  notifications: Notification[];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="p-6 bg-white border border-[#eee7dc] rounded-xl shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-full space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-5 bg-gray-100 rounded w-24 mt-3" />
          <div className="h-3 bg-gray-100 rounded w-32 mt-2" />
        </div>
        <div className="h-4 w-10 bg-gray-200 rounded ml-4" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Type filter state — NEW_ADMIN only by default (replaces the old client-side hack)
  const [typeFilter, setTypeFilter] = useState<string>("NEW_ADMIN");

  const fetchNotifications = useCallback(
    async (page: number, type: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(type !== "ALL" && { type }),
        });

       const res = await fetch(`${API_URL}?${params.toString()}`);

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data: ApiResponse = await res.json();

        setNotifications(data.notifications || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setHasNext(data.hasNextPage);
        setHasPrev(data.hasPrevPage);
      } catch (err: any) {
  setError(err?.message || "Failed to load notifications");
  setNotifications([]);
}finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch when page or type filter changes
  useEffect(() => {
    fetchNotifications(currentPage, typeFilter);
  }, [currentPage, typeFilter, fetchNotifications]);

  // Reset to page 1 when type filter changes
  const handleTypeChange = (type: string) => {
    setCurrentPage(1);
    setTypeFilter(type);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-serif font-bold">
          Recent Activity{" "}
          <span className="text-lg font-normal text-gray-400">
            (Last 3 Days)
          </span>
        </h1>

        {/* Type Filter */}
        <div className="flex gap-2">
          {["ALL", "NEW_ADMIN", "NEW_APPOINTMENT"].map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? "bg-[#c8922a] text-white border-[#c8922a]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#c8922a]"
              }`}
            >
              {t === "ALL" ? "All" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex justify-between items-center">
          <span>⚠ {error}</span>
          <button
            onClick={() => fetchNotifications(currentPage, typeFilter)}
            className="ml-4 underline text-red-700 hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-lg">No recent activity</p>
          <p className="text-sm mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="p-6 bg-white border border-[#eee7dc] rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{item.title}</p>

                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>

                  {/* Type Badge */}
                  <span className="inline-block mt-3 px-3 py-1 text-xs bg-[#fdf3e0] text-[#c8922a] rounded-full">
                    {TYPE_LABELS[item.type] || item.type.replace(/_/g, " ")}
                  </span>

                  {/* Date */}
                  <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                    <p>{formatDate(item.createdAt)}</p>
                    <p className="text-gray-500 font-medium">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => clearNotification(item.id)}
                  className="shrink-0 text-red-400 hover:text-red-600 text-sm transition-colors"
                  aria-label="Clear notification"
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-medium text-gray-700">{total}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={!hasPrev}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600
                         hover:border-[#c8922a] hover:text-[#c8922a] disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {/* Page number pills */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                // Show a window of 5 pages around the current page
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 2
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                    acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-2 text-sm text-gray-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === currentPage
                          ? "bg-[#c8922a] text-white"
                          : "border border-gray-200 text-gray-600 hover:border-[#c8922a] hover:text-[#c8922a]"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              disabled={!hasNext}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600
                         hover:border-[#c8922a] hover:text-[#c8922a] disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}