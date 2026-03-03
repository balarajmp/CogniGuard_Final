"use client";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Activity } from "lucide-react";

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Linearly interpolate two values */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Map stress 0-100 → RGB string
 *  0–40  : Deep Teal  (#0d4f4f) → Neon Cyan  (#00f2ff)
 *  40–70 : Neon Cyan  (#00f2ff) → Amber      (#f59e0b)
 *  70–100: Amber      (#f59e0b) → Vivid Red  (#ef4444)
 */
function stressRgb(stress: number): string {
    const s = Math.max(0, Math.min(100, stress));
    let r: number, g: number, b: number;
    if (s <= 40) {
        const t = s / 40;
        r = Math.round(lerp(13, 0, t));
        g = Math.round(lerp(79, 242, t));
        b = Math.round(lerp(79, 255, t));
    } else if (s <= 70) {
        const t = (s - 40) / 30;
        r = Math.round(lerp(0, 245, t));
        g = Math.round(lerp(242, 158, t));
        b = Math.round(lerp(255, 11, t));
    } else {
        const t = (s - 70) / 30;
        r = Math.round(lerp(245, 239, t));
        g = Math.round(lerp(158, 68, t));
        b = Math.round(lerp(11, 68, t));
    }
    return `${r}, ${g}, ${b}`;
}

function stressLabel(s: number) {
    if (s > 70) return "High Burnout Risk";
    if (s > 40) return "Elevated Load";
    if (s > 15) return "Normal";
    return "Flow State";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

/** Deterministic seeded pseudo-random so each month has a stable pattern */
function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function generateMonth(monthIndex: number): { day: number; stress: number }[] {
    const rand = seededRandom(monthIndex * 31337 + 97);
    // Days in month (non-leap simplified)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex] ?? 30;
    const sprintStart = Math.floor(rand() * (daysInMonth - 7)) + 1;
    const recoveryStart = Math.floor(rand() * (daysInMonth - 5)) + 1;

    return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        // Day of week from Jan 1 2025 (Wednesday = index 2)
        const dow = (day + monthIndex * 31 + 2) % 7;
        let stress = 20 + rand() * 45;
        if (dow === 5 || dow === 6) stress = 5 + rand() * 18;      // weekend recovery
        if (day >= sprintStart && day < sprintStart + 5) stress = 72 + rand() * 28;  // sprint
        if (day >= recoveryStart && day < recoveryStart + 3) stress = 5 + rand() * 12; // rest
        return { day, stress };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Work out which column (0=Mon … 6=Sun) day-1 of a month falls on */
function startDow(monthIndex: number): number {
    // Jan 1 2025 was Wednesday (dow=2 in Mon-based)
    const jan1Dow = 2; // Mon=0
    return (jan1Dow + [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][monthIndex]) % 7;
}

export default function CognitiveHistory() {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

    const days = useMemo(() => generateMonth(selectedMonth), [selectedMonth]);
    const offset = useMemo(() => startDow(selectedMonth), [selectedMonth]);

    const prev = useCallback(() => setSelectedMonth(m => (m - 1 + 12) % 12), []);
    const next = useCallback(() => setSelectedMonth(m => (m + 1) % 12), []);

    // Summary stats
    const avgStress = Math.round(days.reduce((a, d) => a + d.stress, 0) / days.length);
    const peakStress = Math.round(Math.max(...days.map(d => d.stress)));
    const highDays = days.filter(d => d.stress > 70).length;

    return (
        <section className="w-full max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white/5 backdrop-blur-md border border-t-cyan-400/40 border-cyan-500/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(0,242,255,0.07)] hover:border-cyan-500/25 transition-all duration-700"
            >
                {/* Ambient glow */}
                <div className="absolute top-0 left-0 w-96 h-64 bg-cyan-500/4 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* ── Header row ──────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-cyan-400 w-7 h-7 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" />
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-wide">Cognitive History</h2>
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.25em]">Monthly Stress Dot Matrix</p>
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center gap-3 bg-black/40 border border-white/8 rounded-2xl px-4 py-2 backdrop-blur-md">
                        <button
                            onClick={prev}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all duration-200 active:scale-90"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="text-white font-mono text-sm tracking-widest w-24 text-center">
                            {MONTH_NAMES[selectedMonth]}
                        </span>

                        <button
                            onClick={next}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all duration-200 active:scale-90"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Summary stats ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                    {[
                        { label: "Avg Stress", value: `${avgStress}%`, color: stressRgb(avgStress) },
                        { label: "Peak Stress", value: `${peakStress}%`, color: stressRgb(peakStress) },
                        { label: "High-Risk Days", value: `${highDays}d`, color: stressRgb(highDays > 5 ? 80 : 40) },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 flex flex-col items-center text-center"
                        >
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-xl font-black" style={{ color: `rgb(${color})`, textShadow: `0 0 12px rgba(${color},0.5)` }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Dot Matrix ──────────────────────────────────────────────────── */}
                <div className="relative z-10">
                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                        {DOW_LABELS.map((d, i) => (
                            <div key={i} className="h-5 flex items-center justify-center text-[10px] font-mono text-gray-600 tracking-widest">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* AnimatePresence: re-mount dots on month change for slide-in effect */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedMonth}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="grid grid-cols-7 gap-1.5"
                        >
                            {/* Start offset: empty ghost cells */}
                            {Array.from({ length: offset }).map((_, i) => (
                                <div key={`off-${i}`} className="h-8" />
                            ))}

                            {/* Day dots */}
                            {days.map(({ day, stress }, i) => {
                                const rgb = stressRgb(stress);
                                const glowSize = stress > 70 ? "10px" : stress > 40 ? "6px" : "4px";
                                return (
                                    <motion.div
                                        key={`${selectedMonth}-${day}`}
                                        initial={{ opacity: 0, scale: 0.4 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2, delay: i * 0.006, ease: "backOut" }}
                                        className="h-8 flex items-center justify-center relative group/dot"
                                    >
                                        {/* Dot */}
                                        <div
                                            className="w-1.5 h-1.5 rounded-full backdrop-blur-md cursor-pointer
                        transition-all duration-200 group-hover/dot:w-2.5 group-hover/dot:h-2.5 group-hover/dot:z-20"
                                            style={{
                                                backgroundColor: `rgba(${rgb}, 0.80)`,
                                                border: `1px solid rgba(${rgb}, 0.95)`,
                                                boxShadow: `0 0 ${glowSize} rgba(${rgb}, 0.7), inset 0 0 2px rgba(255,255,255,0.12)`,
                                            }}
                                        />

                                        {/* Day number (visible on hover) */}
                                        <span className="absolute -top-0.5 right-0.5 text-[8px] font-mono text-gray-700 opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 leading-none">
                                            {day}
                                        </span>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                                            <p className="text-[10px] font-mono text-gray-400">
                                                {MONTH_NAMES[selectedMonth]} {day}
                                            </p>
                                            <p className="text-xs font-bold" style={{ color: `rgb(${rgb})` }}>
                                                {stress.toFixed(0)}% &mdash; {stressLabel(stress)}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Legend ──────────────────────────────────────────────────────── */}
                <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2 shrink-0">
                        <Activity className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Stress</span>
                    </div>
                    <div
                        className="flex-1 h-1.5 rounded-full"
                        style={{
                            background: "linear-gradient(to right, rgb(13,79,79), rgb(0,242,255), rgb(245,158,11), rgb(239,68,68))",
                        }}
                    />
                    <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
                        <span className="text-[#0d9488]">Flow</span>
                        <span className="text-cyan-400">Normal</span>
                        <span className="text-amber-400">Elevated</span>
                        <span className="text-red-400">Burnout</span>
                    </div>
                </div>

            </motion.div>
        </section>
    );
}
