"use client";

const STATS = [
  { label: "Active Rules", value: 5, color: "text-green-600" },
  { label: "Paused Rules", value: 1, color: "text-orange-500" },
  { label: "Executions Today", value: 34, color: "text-[#1a1208]" },
  { label: "Total Executions", value: 225, color: "text-[#c8922a]" },
];

const RULES = [
  {
    name: "Auto-Suspend on Payment Failure",
    status: "active",
    runs: 12,
    trigger: "Payment fails 2 consecutive times",
    action: "Suspend salon account",
  },
  {
    name: "Auto-Upgrade Trial to Starter",
    status: "active",
    runs: 45,
    trigger: "Trial expires with active bookings",
    action: "Auto-upgrade to Starter plan",
  },
  {
    name: "Expiry Warning Notification",
    status: "active",
    runs: 138,
    trigger: "7 days before subscription expires",
    action: "Send WhatsApp + Email alert",
  },
  {
    name: "Churn Risk Alert",
    status: "active",
    runs: 23,
    trigger: "No bookings for 14 days",
    action: "Notify account manager",
  },
  {
    name: "Bulk Discount on Annual Plan",
    status: "paused",
    runs: 0,
    trigger: "Salon active for 6+ months",
    action: "Offer 20% annual plan discount",
  },
  {
    name: "Auto Branch Limit Enforcement",
    status: "active",
    runs: 7,
    trigger: "Branch limit exceeded for plan",
    action: "Block new branch creation + notify",
  },
];

export default function AutomationPage() {
  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-[32px] font-serif font-semibold">
            Automation Rules Engine
          </h1>
          <p className="text-sm text-[#7a6a55] mt-2">
            Configure rule-based workflows and automated actions
          </p>
        </div>

        <button className="bg-[#c8922a] text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md">
          + New Rule
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
          >
            <div className="flex flex-col items-center justify-center">
              <span className={`text-[26px] font-semibold ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[13px] text-[#7a6a55] mt-1">
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* RULE LIST */}
      <div className="flex flex-col gap-4">
        {RULES.map((rule, index) => {
          const isActive = rule.status === "active";

          return (
            <div
              key={index}
              className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            >
              {/* LEFT */}
              <div className="flex items-start gap-3">

                {/* Lightning Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive
                      ? "bg-green-100"
                      : "bg-[#f1ede6]"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isActive ? "#16a34a" : "#7a6a55"}
                    strokeWidth="2"
                  >
                    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[15px]">
                      {rule.name}
                    </h3>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>

                  {/* Trigger + Action */}
                  <div className="flex gap-5 text-[13px] text-[#7a6a55] mt-1.5">

                    {/* Trigger */}
                    <span className="flex items-center gap-1.5">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <circle cx="12" cy="16" r="1" />
                      </svg>
                      <span>
                        <span className="font-medium">Trigger:</span>{" "}
                        {rule.trigger}
                      </span>
                    </span>

                    {/* Action */}
                    <span className="flex items-center gap-1.5">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>
                        <span className="font-medium">Action:</span>{" "}
                        {rule.action}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right">
                <p className="text-[13px] text-[#8a7a66]">
                  {rule.runs} runs
                </p>

                <button
                  className={`flex items-center gap-1 text-[13px] font-medium mt-1 ${
                    isActive ? "text-green-600" : "text-[#7a6a55]"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isActive ? "#16a34a" : "#7a6a55"}
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
                  </svg>
                  {isActive ? "Pause" : "Enable"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}