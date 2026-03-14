"use client";

import Link from "next/link";
import Image from "next/image";

export function Topbar({ pageTitle }: { pageTitle: string }) {
    return (
        <header className="flex items-center h-[64px] px-4 sm:px-6 bg-[#2C1E17] flex-shrink-0 z-20 shadow-[0_2px_12px_rgba(44,30,23,0.25)] gap-4">

            {/* Logo + Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <Image
                    src="/logo.png"
                    alt="NexSalon"
                    width={34}
                    height={34}
                    className="rounded-md"
                />

                <div className="flex flex-col leading-tight">
                    <span className="text-[15px] font-bold tracking-[0.8px] text-[#C9A96E]">
                        NEXSALON
                    </span>
                    <span className="text-[10px] text-[#C8B99A] uppercase tracking-[1px]">
                        Admin
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-7 bg-[#4A382D]" />

            {/* Page Title */}
            <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium text-[rgba(255,248,240,0.75)] truncate tracking-[0.2px]">
                    {pageTitle}
                </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">

                {/* Notifications */}
                <Link
                    href="/superadmin/advanced/notifications"
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl text-[#C9A96E] hover:bg-[#3D2D22] transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>

                    <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-red-500 border-[1.5px] border-[#2C1E17]" />
                </Link>

                {/* Profile */}
                <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#C9A96E] text-white font-bold text-[13px] transition-all group-hover:shadow-[0_0_0_3px_rgba(201,169,110,0.28)]">
                        A
                    </div>

                    <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-[13px] font-semibold text-white">
                            Super Admin
                        </span>
                        <span className="text-[11px] text-[#C8B99A]">
                            System
                        </span>
                    </div>

                    <svg
                        className="hidden md:block text-[#7A6858]"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>

            </div>
        </header>
    );
}