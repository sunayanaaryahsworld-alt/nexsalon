
"use client";

import { useEffect, useState } from "react";

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchNotifications = async () => {
    const res = await fetch(
      "http://localhost:3001/api/superadmin/notifications"
    );
    const data = await res.json();

    // ❌ Remove appointments
    const filtered = (data.notifications || []).filter(
      (item: any) => item.type !== "NEW_APPOINTMENT"
    );

    setNotifications(filtered);
    setLoading(false);
  };

  fetchNotifications();
}, []);

  const clearNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="w-full">
      <h1 className="text-3xl font-serif font-bold mb-8">
        Recent Activity (Last 3 Days)
      </h1>

      {notifications.length === 0 ? (
        <p>No recent activity</p>
      ) : (
        <div className="space-y-5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="p-6 bg-white border border-[#eee7dc] rounded-xl shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">
                    {item.title}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    {item.message}
                  </p>

                  {/* Type Badge */}
                  <span className="inline-block mt-3 px-3 py-1 text-xs bg-[#fdf3e0] text-[#c8922a] rounded-full">
                    {item.type.replace("_", " ")}
                  </span>

                  {/* Date */}
                  <div className="mt-3 text-xs text-gray-500">
                    <p>{formatDate(item.createdAt)}</p>
                    <p>{timeAgo(item.createdAt)}</p>
                  </div>
                </div>

                <button
                  onClick={() => clearNotification(item.id)}
                  className="text-red-500 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}