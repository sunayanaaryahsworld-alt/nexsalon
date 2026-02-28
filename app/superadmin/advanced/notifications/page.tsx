"use client";

import { Send, Globe, Image } from "lucide-react";

const ANNOUNCEMENTS = [
  {
    title: "Platform Maintenance",
    meta: "All Salons · System · Feb 15",
    status: "sent",
  },
  {
    title: "New Feature: WhatsApp Booking",
    meta: "Pro & Enterprise · Feature · Feb 10",
    status: "sent",
  },
  {
    title: "Subscription Price Update",
    meta: "All Salons · Billing · Scheduled Feb 28",
    status: "scheduled",
  },
];

export default function NotificationsPage() {
  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#2d241a]">
            Notifications & CMS
          </h1>
          <p className="text-sm text-[#7a6a55] mt-1">
            Send announcements and manage platform content
          </p>
        </div>

        <button className="w-full sm:w-auto bg-[#c8922a] hover:bg-[#b07d20] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-sm transition">
          + New Announcement
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* LEFT — COMPOSE */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 sm:p-8 shadow-sm">

          <h2 className="text-xl font-serif font-bold mb-6">
            Compose Notification
          </h2>

          {/* Title */}
          <div className="mb-5">
            <label className="text-sm text-[#7a6a55]">Title</label>
            <input
              type="text"
              placeholder="Announcement title..."
              className="mt-2 w-full bg-white border border-[#e8e0d4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8922a]/30"
            />
          </div>

          {/* Audience */}
          <div className="mb-5">
            <label className="text-sm text-[#7a6a55]">
              Target Audience
            </label>
            <select
              className="mt-2 w-full bg-white border border-[#e8e0d4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8922a]/30"
            >
              <option>All Salons</option>
              <option>Pro Plan</option>
              <option>Enterprise</option>
            </select>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="text-sm text-[#7a6a55]">
              Message
            </label>
            <textarea
              rows={5}
              placeholder="Write your message..."
              className="mt-2 w-full bg-white border border-[#e8e0d4] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#c8922a]/30"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center gap-2 bg-[#c8922a] hover:bg-[#b07d20] text-white px-6 py-3 rounded-full text-sm font-medium shadow-sm transition w-full sm:w-auto">
              <Send size={16} />
              Send Now
            </button>

            <button className="px-6 py-3 rounded-full text-sm border border-[#e8e0d4] bg-white hover:bg-[#f3eee6] transition w-full sm:w-auto">
              Schedule
            </button>
          </div>
        </div>

        {/* RIGHT — RECENT */}
        <div className="bg-[#f9f7f4] border border-[#eee7dc] rounded-2xl p-6 sm:p-8 shadow-sm">

          <h2 className="text-xl font-serif font-bold mb-6">
            Recent Announcements
          </h2>

          <div className="space-y-4">

            {ANNOUNCEMENTS.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-[#eee7dc] rounded-xl p-4 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-[#2d241a]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#7a6a55] mt-1">
                    {item.meta}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "sent"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}

          </div>

          {/* Divider */}
          <div className="my-6 border-t border-[#eee7dc]" />

          {/* CMS Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <button className="flex items-center justify-center gap-2 bg-white border border-[#e8e0d4] rounded-xl px-4 py-3 hover:bg-[#f3eee6] transition text-sm">
              <Globe size={16} />
              Landing Page CMS
            </button>

            <button className="flex items-center justify-center gap-2 bg-white border border-[#e8e0d4] rounded-xl px-4 py-3 hover:bg-[#f3eee6] transition text-sm">
              <Image size={16} />
              Banner Manager
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}