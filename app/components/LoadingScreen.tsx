"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const steps = [
            { target: 35, delay: 300 },
            { target: 65, delay: 900 },
            { target: 88, delay: 1800 },
            { target: 100, delay: 2800 },
        ];

        const timers = steps.map(({ target, delay }) =>
            setTimeout(() => setProgress(target), delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[70vh] w-full bg-[#F5EDE0] overflow-hidden relative">

            {/* Ambient gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-[60%] h-[50%] rounded-full bg-[#C9A96E]/10 blur-3xl -translate-x-1/4 translate-y-1/4" />
                <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-[#C9A96E]/8 blur-3xl translate-x-1/4 -translate-y-1/4" />
            </div>

            {/* Corner ornaments */}
            <svg className="absolute top-4 left-4 w-16 h-16 opacity-15" viewBox="0 0 80 80" fill="none">
                <path d="M4 4 L4 30 M4 4 L30 4" stroke="#8B6A3E" strokeWidth="1" />
                <circle cx="4" cy="4" r="2" fill="#8B6A3E" />
            </svg>
            <svg className="absolute bottom-4 right-4 w-16 h-16 opacity-15 rotate-180" viewBox="0 0 80 80" fill="none">
                <path d="M4 4 L4 30 M4 4 L30 4" stroke="#8B6A3E" strokeWidth="1" />
                <circle cx="4" cy="4" r="2" fill="#8B6A3E" />
            </svg>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center animate-[fadeUp_0.8s_ease_both]">

                {/* Logo */}
                <div className="relative mb-7">
                    {/* Outer ring */}
                    <div className="absolute -inset-7 rounded-full border border-[#C9A96E]/12 animate-[breathe_3s_ease-in-out_infinite_0.4s]" />
                    {/* Inner ring */}
                    <div className="absolute -inset-4 rounded-full border border-[#C9A96E]/30 animate-[breathe_3s_ease-in-out_infinite]" />
                    {/* Circle */}
                    <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#B8924F] flex items-center justify-center shadow-[0_8px_32px_rgba(185,142,80,0.28)]">
                        <ScissorsIcon />
                    </div>
                </div>

                {/* Brand */}
                <p className="font-serif text-3xl font-light tracking-[0.22em] text-[#3D2B1A] uppercase mb-1">
                    NexSalon
                </p>

                {/* Divider */}
                <div className="flex items-center mb-7">
                    <div className="w-10 h-px bg-[#C9A96E]/35" />
                    <div className="w-1.5 h-1.5 bg-[#C9A96E]/50 rotate-45 mx-3" />
                    <div className="w-10 h-px bg-[#C9A96E]/35" />
                </div>

                {/* Progress bar */}
                <div className="relative w-[200px] mb-5">
                    <div className="h-px bg-[#C9A96E]/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#C9A96E] rounded-full relative overflow-hidden transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[shimmer_1.8s_ease-in-out_infinite_0.5s] translate-x-[-100%] w-[40%]" />
                        </div>
                    </div>
                    {/* Dots */}
                    <div className="absolute right-0 -top-1.5 flex gap-0.5 items-center">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-1 h-1 rounded-full bg-[#C9A96E]"
                                style={{ animation: `dotPulse 1.2s ease-in-out infinite ${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Label */}
                <p className="text-[10px] font-light tracking-[0.35em] text-[#9B7B5A] uppercase">
                    Preparing your experience
                </p>

            </div>
        </div>
    );
}

function ScissorsIcon() {
    return (
        <svg
            width="38" height="38" viewBox="0 0 38 38" fill="none"
            className="animate-[scissors_2.8s_ease-in-out_infinite] origin-center"
        >
            <circle cx="10" cy="27" r="5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <circle cx="10" cy="27" r="2" fill="rgba(255,255,255,0.6)" />
            <circle cx="10" cy="11" r="5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <circle cx="10" cy="11" r="2" fill="rgba(255,255,255,0.6)" />
            <path d="M14 25 L32 14" stroke="rgba(255,255,255,0.95)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14 13 L32 24" stroke="rgba(255,255,255,0.95)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="19" cy="19" r="2" fill="rgba(255,255,255,0.9)" />
        </svg>
    );
}