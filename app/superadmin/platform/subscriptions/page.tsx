"use client";

import { useState } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  salons: number;
  features: string[];
  popular?: boolean;
}

interface ExpiringItem {
  id: number;
  name: string;
  owner: string;
  plan: string;
  daysLeft: number;
}

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: "₹0",
    period: "/14 days",
    salons: 53,
    features: ["1 Branch", "Basic Booking", "Email Support", "50 Appointments/mo"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹2,999",
    period: "/month",
    salons: 89,
    features: ["2 Branches", "Online Booking", "SMS Notifications", "500 Appointments/mo", "Basic Reports"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹7,999",
    period: "/month",
    salons: 128,
    popular: true,
    features: ["5 Branches", "Advanced Booking", "WhatsApp + SMS", "Unlimited Appointments", "Full Reports", "Staff Management", "Inventory"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹19,999",
    period: "/month",
    salons: 42,
    features: ["Unlimited Branches", "White Label", "Custom Domain", "API Access", "Priority Support", "Dedicated Manager", "Custom Integrations"],
  },
];

const EXPIRING: ExpiringItem[] = [
  { id: 1, name: "Bloom & Glow",   owner: "Kavita Nair",  plan: "Starter",    daysLeft: 2  },
  { id: 2, name: "Curl House",     owner: "Suresh Babu",  plan: "Pro",        daysLeft: 5  },
  { id: 3, name: "Nature's Touch", owner: "Lakshmi R",    plan: "Starter",    daysLeft: 7  },
  { id: 4, name: "Studio Noir",    owner: "Vikram Shah",  plan: "Enterprise", daysLeft: 10 },
];

const BAR_DATA = [
  { label: "Trial",      value: 0   },
  { label: "Starter",    value: 2.7 },
  { label: "Pro",        value: 10.2 },
  { label: "Enterprise", value: 8.4 },
];
const MAX_BAR = 12;

/* ─────────────────────────────────────────
   EDIT PLAN MODAL
───────────────────────────────────────── */
function EditModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [price, setPrice] = useState(plan.price.replace("₹", "").replace(",", ""));
  const [name, setName]   = useState(plan.name);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-[#e8e0d4]">
          <h2 className="text-lg font-semibold text-[#1a1208]">Edit Plan — {plan.name}</h2>
          <button onClick={onClose} className="text-[#7a6a55] hover:text-[#1a1208] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#7a6a55] mb-1.5 block">Plan Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#c8922a] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#7a6a55] mb-1.5 block">Price (₹)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              className="w-full border border-[#e8e0d4] rounded-lg px-3 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#c8922a] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#7a6a55] mb-1.5 block">Features</label>
            <div className="flex flex-col gap-1.5">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#1a1208]">
                  <span className="text-[#27ae60]">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#e8e0d4] text-[#7a6a55] font-medium py-2.5 rounded-lg hover:bg-[#f7f4ef] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#c8922a] hover:bg-[#b07d20] text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function SubscriptionsPage() {
  const [editingPlan, setEditingPlan]     = useState<Plan | null>(null);
  const [renewed, setRenewed]             = useState<number[]>([]);

  const handleRenew = (id: number) => setRenewed((prev) => [...prev, id]);

  return (
    <div className="font-['DM_Sans',sans-serif] text-[#1a1208]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#1a1208] leading-tight">
            Subscription &amp; Billing
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Manage plans, track payments and subscription lifecycle
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#c8922a] hover:bg-[#b07d20] text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Plan
        </button>
      </div>

      {/* ── Plan Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl p-5 flex flex-col relative
              ${plan.popular
                ? "border-2 border-[#c8922a] shadow-sm"
                : "border border-[#e8e0d4]"
              }`}
          >
            {/* Most Popular badge */}
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#c8922a] text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                  ★ Most Popular
                </span>
              </div>
            )}

            {/* Plan name */}
            <p className="text-base font-semibold text-[#1a1208] mb-1 mt-1">{plan.name}</p>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-[28px] font-bold text-[#1a1208]">{plan.price}</span>
              <span className="text-sm text-[#7a6a55]">{plan.period}</span>
            </div>

            {/* Salons active */}
            <div className="flex items-center gap-1.5 text-[13px] text-[#7a6a55] mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8922a" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-[#c8922a] font-medium">{plan.salons}</span> salons active
            </div>

            {/* Features */}
            <div className="flex flex-col gap-2 flex-1 mb-5">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-[13px] text-[#1a1208]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditingPlan(plan)}
              className="w-full flex items-center justify-center gap-2 border border-[#e8e0d4] hover:border-[#c8922a] hover:text-[#c8922a] text-[#1a1208] font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* ── Bottom Section ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Revenue by Plan Bar Chart */}
        <div className="bg-white border border-[#e8e0d4] rounded-2xl p-6">
          <p className="text-lg font-bold text-[#1a1208]">Revenue by Plan</p>
          <p className="text-xs text-[#7a6a55] mt-0.5 mb-6">Monthly recurring revenue (₹L)</p>

          {/* Chart */}
          <div className="w-full overflow-x-hidden">
            <svg viewBox="0 0 480 220" className="w-full">
              {/* Y-axis grid lines + labels */}
              {[0, 3, 6, 9, 12].map((v, i) => {
                const y = 185 - (v / MAX_BAR) * 160;
                return (
                  <g key={v}>
                    <line x1="36" y1={y} x2="470" y2={y} stroke="#ede5d8" strokeWidth="1" strokeDasharray="4 3" />
                    <text x="28" y={y + 4} fontSize="10" fill="#b0a090" textAnchor="end">{v}</text>
                  </g>
                );
              })}

              {/* Bars */}
              {BAR_DATA.map((d, i) => {
                const bw   = 68;
                const gap  = 28;
                const x    = 52 + i * (bw + gap);
                const barH = (d.value / MAX_BAR) * 160;
                const y    = 185 - barH;
                return (
                  <g key={d.label}>
                    {d.value > 0 && (
                      <rect x={x} y={y} width={bw} height={barH} rx="6" fill="#c8922a" opacity="0.9" />
                    )}
                    <text x={x + bw / 2} y="205" fontSize="11" fill="#b0a090" textAnchor="middle">
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white border border-[#e8e0d4] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-lg font-bold text-[#1a1208]">Expiring Soon</p>
            <span className="flex items-center gap-1.5 bg-[#fdf3e0] border border-[#f0d9b0] text-[#c8922a] text-xs font-semibold px-3 py-1 rounded-full">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              12 expiring
            </span>
          </div>
          <p className="text-xs text-[#7a6a55] mb-5">Subscriptions requiring attention</p>

          <div className="flex flex-col gap-0">
            {EXPIRING.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-4
                  ${i < EXPIRING.length - 1 ? "border-b border-[#f0ebe3]" : ""}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#f0ebe3] flex items-center justify-center text-[13px] font-bold text-[#7a6a55] flex-shrink-0">
                  {item.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-[#1a1208]">{item.name}</p>
                  <p className="text-[11.5px] text-[#7a6a55] mt-px">{item.owner} · {item.plan}</p>
                </div>

                {/* Days + Renew */}
                <div className="text-right flex-shrink-0">
                  {renewed.includes(item.id) ? (
                    <p className="text-[12px] font-medium text-[#27ae60]">✓ Renewed</p>
                  ) : (
                    <>
                      <p className="text-[12px] font-semibold text-[#c8922a]">
                        in {item.daysLeft} {item.daysLeft === 1 ? "day" : "days"}
                      </p>
                      <button
                        onClick={() => handleRenew(item.id)}
                        className="text-[12px] font-semibold text-[#c8922a] hover:text-[#b07d20] transition-colors mt-0.5 block w-full text-right"
                      >
                        Renew
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit Plan Modal ── */}
      {editingPlan && (
        <EditModal plan={editingPlan} onClose={() => setEditingPlan(null)} />
      )}
    </div>
  );
}