"use client";

const STATS = [
  {
    title: "Churn Probability",
    value: "8.4%",
    subtitle: "Down from 10.5% last month",
    subtitleColor: "text-green-600",
    icon: "⚠️",
  },
  {
    title: "Revenue Forecast (Apr)",
    value: "₹91L",
    subtitle: "Based on current trajectory",
    subtitleColor: "text-[#7a6a55]",
    icon: "📈",
  },
  {
    title: "Platform Growth Score",
    value: "84/100",
    subtitle: "Strong expansion momentum",
    subtitleColor: "text-green-600",
    icon: "📊",
  },
];

const CHURN_LIST = [
  { name: "Serenity Spa House", risk: 89, reason: "Payment failed 2x, low activity" },
  { name: "Bloom Studio", risk: 74, reason: "No bookings in 30 days" },
  { name: "Curl & Co", risk: 61, reason: "Subscription downgraded" },
  { name: "The Nail Bar", risk: 48, reason: "Support tickets unresolved" },
  { name: "Glow Lab", risk: 33, reason: "Low engagement" },
];

const GROWTH = [
  { rank: 1, name: "The Refinery", city: "Chennai", growth: "+34%" },
  { rank: 2, name: "Luxe Beauty Studio", city: "Mumbai", growth: "+28%" },
  { rank: 3, name: "Velvet Touch Spa", city: "Bangalore", growth: "+22%" },
  { rank: 4, name: "Crown Hair Lounge", city: "Jaipur", growth: "+19%" },
];

const UNDERPERFORMING = [
  { name: "Nail Art", change: "-18%", salons: 12 },
  { name: "Hair Spa", change: "-12%", salons: 8 },
  { name: "Waxing", change: "-9%", salons: 5 },
];

export default function AIInsightsPage() {
  const getRiskColor = (risk: number) => {
    if (risk > 75) return "bg-red-500";
    if (risk > 55) return "bg-orange-400";
    return "bg-yellow-400";
  };

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#c8922a] rounded-xl flex items-center justify-center text-xl">
            🧠
          </div>
          <div>
            <h1 className="text-2xl sm:text-[32px] font-serif font-semibold">
              AI Insights
            </h1>
            <p className="text-sm text-[#7a6a55]">
              Predictive analytics powered by platform data
            </p>
          </div>
        </div>

        <button className="bg-[#f4e6c9] text-[#a97b1f] px-4 py-2 rounded-full text-sm font-medium w-fit">
          ⚡ Live Model
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {STATS.map((stat) => (
          <div
            key={stat.title}
            className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm text-[#7a6a55]">{stat.title}</span>
              <div className="w-10 h-10 bg-[#c8922a] text-white rounded-xl flex items-center justify-center">
                {stat.icon}
              </div>
            </div>

            <div className="text-[26px] font-semibold mt-4">
              {stat.value}
            </div>

            <p className={`text-sm mt-1 ${stat.subtitleColor}`}>
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* FORECAST + CHURN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* REVENUE FORECAST */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6">
          <h2 className="text-lg font-serif font-semibold mb-1">
            Revenue Forecast
          </h2>
          <p className="text-sm text-[#7a6a55] mb-6">
            AI-projected platform MRR (₹L)
          </p>

          <div className="relative h-[240px]">

            {[0, 30, 60, 90, 120].map((val) => (
              <div
                key={val}
                className="absolute w-full border-t border-dashed border-[#e3d9cc]"
                style={{ bottom: `${(val / 120) * 100}%` }}
              >
                <span className="absolute -left-6 -translate-y-1/2 text-xs text-[#8a7a66]">
                  {val}
                </span>
              </div>
            ))}

            <svg viewBox="0 0 400 240" className="absolute inset-0 w-full h-full">
              <circle cx="40" cy="150" r="6" fill="white" stroke="#5a3a22" strokeWidth="3" />

              <polyline
                fill="none"
                stroke="#c8922a"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                points="100,145 180,135 260,115 340,95"
              />

              {[100, 180, 260, 340].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={[145, 135, 115, 95][i]}
                  r="5"
                  fill="white"
                  stroke="#c8922a"
                  strokeWidth="2.5"
                />
              ))}
            </svg>

            <div className="absolute bottom-0 w-full flex justify-between px-6 text-xs text-[#8a7a66]">
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
            </div>
          </div>

          <div className="flex gap-6 mt-6 text-sm text-[#8a7a66]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-[2px] bg-[#5a3a22]"></span>
              Actual
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 border-t-2 border-dashed border-[#c8922a]"></span>
              Forecast
            </div>
          </div>
        </div>

        {/* CHURN RISK */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <div>
              <h2 className="text-lg font-serif font-semibold">
                Churn Risk Prediction
              </h2>
              <p className="text-sm text-[#7a6a55]">
                Salons at risk of cancellation
              </p>
            </div>
            <button className="text-[#c8922a] text-sm font-medium">
              View All →
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {CHURN_LIST.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.risk}% risk</span>
                </div>
                <div className="h-2 bg-[#e9e1d6] rounded-full mt-1">
                  <div
                    className={`h-2 rounded-full ${getRiskColor(item.risk)}`}
                    style={{ width: `${item.risk}%` }}
                  />
                </div>
                <p className="text-xs text-[#7a6a55] mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TOP GROWTH */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6">
          <h2 className="text-lg font-serif font-semibold mb-4">
            Top Growth Salons
          </h2>

          {GROWTH.map((item) => (
            <div key={item.rank} className="flex justify-between py-4">
              <div>
                <span className="font-medium mr-2">#{item.rank}</span>
                <span>{item.name}</span>
                <p className="text-xs text-[#7a6a55]">{item.city}</p>
              </div>

              <span className="flex items-center gap-[3px] text-[#059669] font-semibold text-[15px]">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M5 14l5-5 4 4 5-5" />
                </svg>
                {item.growth}
              </span>
            </div>
          ))}
        </div>

        {/* UNDERPERFORMING */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6">
          <h2 className="text-lg font-serif font-semibold mb-4">
            Underperforming Services
          </h2>

          {UNDERPERFORMING.map((item) => (
            <div
              key={item.name}
              className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4 flex justify-between"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-[#7a6a55]">
                  Offered by {item.salons} salons
                </p>
              </div>

              <span className="flex items-center gap-[3px] text-[#dc2626] font-semibold text-[15px]">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M5 10l5 5 4-4 5 5" />
                </svg>
                {item.change}
              </span>
            </div>
          ))}

          <p className="text-xs text-center text-[#7a6a55] mt-4">
            Based on last 30 days booking data
          </p>
        </div>
      </div>
    </div>
  );
}