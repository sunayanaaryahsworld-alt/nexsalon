"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

const API_BASE =
process.env.NEXT_PUBLIC_API_URL;
  
  
  type Metric = {
  label: string;
  value: string | number;
  color?: string;
};

type Service = {
  name: string;
  status: string;
  latency: string;
  uptime: string;
};

export default function SystemMonitorPage() {
  // Initialize with empty arrays to prevent .map() errors
  const [data, setData] = useState<{
  metrics: Metric[];
  services: Service[];
}>({
  metrics: [],
  services: [],
});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/system/metrics`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setData({
          metrics: result.data.metrics || [],
          services: result.data.services || []
        });
      } else {
        throw new Error(result.message || "Failed to parse data");
      }
    } catch (err: any) {
  setError(err?.message || "Fetch failed");
  console.error("Fetch Error:", err);
}
finally {
      setLoading(false);
    }
 }, []);

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
        <AlertCircle size={48} className="mb-4" />
        <p className="font-bold">Connection Failed</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={fetchSystemData} className="px-4 py-2 bg-gray-100 rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">
            System Monitoring
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">Real-time server health and API status</p>
        </div>

        <button 
          onClick={fetchSystemData}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#e8e0d4] bg-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#f3eee6] transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {data.metrics.length > 0 ? data.metrics.map((metric, index) => (
          <div key={index} className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm text-center">
           <h2 className={`text-2xl font-bold ${metric.color || ""}`}>{metric.value}</h2>
            <p className="text-sm text-[#7a6a55] mt-2">{metric.label}</p>
          </div>
        )) : (
          <div className="col-span-full py-10 text-center text-gray-400">Loading metrics...</div>
        )}
      </div>

      {/* SERVICE STATUS */}
      <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#eee7dc]">
          <h2 className="text-xl font-serif font-bold text-[#2d241a]">Service Status</h2>
        </div>

        {data.services.map((service, index) => (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-6 border-t border-[#eee7dc] bg-white">
            <div className="flex items-start gap-4">
              <div className={`w-3 h-3 rounded-full mt-2 ${service.status === "healthy" ? "bg-green-500" : "bg-yellow-500"}`} />
              <div>
                <p className="font-medium text-[#2d241a]">{service.name}</p>
                <p className="text-xs text-[#7a6a55] mt-1">Latency: {service.latency}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="text-sm font-semibold text-[#2d241a]">{service.uptime}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${service.status === "healthy" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}