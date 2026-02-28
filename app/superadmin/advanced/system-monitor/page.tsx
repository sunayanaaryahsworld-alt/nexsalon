"use client";

import { RefreshCw } from "lucide-react";

const METRICS = [
  { label: "Overall Uptime", value: "99.8%", color: "text-green-600" },
  { label: "Avg Latency", value: "79ms", color: "text-[#2d241a]" },
  { label: "Active Errors", value: "2", color: "text-red-600" },
  { label: "Last Backup", value: "2 hrs ago", color: "text-[#7a6a55]" },
];

const SERVICES = [
  { name: "API Gateway", latency: "42ms", status: "healthy", uptime: "99.9%" },
  { name: "Database Cluster", latency: "8ms", status: "healthy", uptime: "99.7%" },
  { name: "Storage CDN", latency: "120ms", status: "degraded", uptime: "98.4%" },
  { name: "Auth Service", latency: "15ms", status: "healthy", uptime: "100%" },
  { name: "Notification Service", latency: "210ms", status: "healthy", uptime: "99.2%" },
  { name: "Backup Service", latency: "N/A", status: "degraded", uptime: "97.8%" },
];

export default function SystemMonitorPage() {
  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">
            System Monitoring
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Real-time server health, API monitoring and error logs
          </p>
        </div>

        <button className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#e8e0d4] bg-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#f3eee6] transition">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {METRICS.map((metric, index) => (
          <div
            key={index}
            className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm text-center"
          >
            <h2 className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </h2>
            <p className="text-sm text-[#7a6a55] mt-2">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      {/* SERVICE STATUS */}
      <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl shadow-sm overflow-hidden">

        {/* SECTION HEADER */}
        <div className="px-6 py-5 border-b border-[#eee7dc]">
          <h2 className="text-xl font-serif font-bold text-[#2d241a]">
            Service Status
          </h2>
        </div>

        {/* SERVICES LIST */}
        {SERVICES.map((service, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-6 border-t border-[#eee7dc] bg-white"
          >
            {/* LEFT SIDE */}
            <div className="flex items-start gap-4">
              <div
                className={`w-3 h-3 rounded-full mt-2 ${
                  service.status === "healthy"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              />

              <div>
                <p className="font-medium text-[#2d241a]">
                  {service.name}
                </p>
                <p className="text-xs text-[#7a6a55] mt-1">
                  Latency: {service.latency}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="text-sm font-semibold text-[#2d241a]">
                {service.uptime}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.status === "healthy"
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                {service.status}
              </span>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}