"use client";

import { Download, FileText } from "lucide-react";

const AUDIT_LOGS = [
  {
    title: "Salon Suspended",
    meta: "Super Admin · Serenity Spa House",
    time: "10 min ago",
  },
  {
    title: "Plan Upgraded",
    meta: "Super Admin · Crown Hair Lounge → Pro",
    time: "1 hr ago",
  },
  {
    title: "User Blocked",
    meta: "Super Admin · Sunita Rao",
    time: "3 hrs ago",
  },
  {
    title: "Commission Rate Changed",
    meta: "Super Admin · Haircut 10% → 12%",
    time: "Yesterday",
  },
  {
    title: "New Automation Rule",
    meta: "Super Admin · Churn Risk Alert",
    time: "2 days ago",
  },
];

export default function CompliancePage() {
  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">
            Compliance & Audit
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Audit logs, data exports and legal compliance settings
          </p>
        </div>

        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#c8922a] hover:bg-[#b07d20] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-sm transition">
          <Download size={16} />
          Export Data
        </button>
      </div>

      {/* AUDIT CARD */}
      <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl shadow-sm overflow-hidden">

        {/* CARD HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eee7dc]">
          <h2 className="text-xl font-serif font-bold text-[#2d241a]">
            Audit Log
          </h2>
          <span className="text-sm text-[#7a6a55]">
            Last 30 days
          </span>
        </div>

        {/* LOG ITEMS */}
        <div>
          {AUDIT_LOGS.map((log, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-t border-[#eee7dc] bg-white"
            >
              {/* Left Section */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#f3eee6] flex items-center justify-center text-[#7a6a55]">
                  <FileText size={18} />
                </div>

                <div>
                  <p className="font-medium text-[#2d241a]">
                    {log.title}
                  </p>
                  <p className="text-xs text-[#7a6a55] mt-1">
                    {log.meta}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="text-sm text-[#7a6a55] sm:text-right">
                {log.time}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}