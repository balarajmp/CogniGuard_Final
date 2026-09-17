"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Activity, Loader2 } from "lucide-react";
import axios from "axios";
import { getBiometricWS } from "@/lib/ws";
import { getApiUrl } from "@/lib/api";

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

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Work out which column (0=Mon … 6=Sun) day-1 of a month falls on */
function startDow(monthIndex: number): number {
    const jan1Dow = 2; // Jan 1 2025 was Wednesday (dow=2 in Mon-based)
    return (jan1Dow + [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][monthIndex]) % 7;
}

export default function CognitiveHistory() {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dailyAverages, setDailyAverages] = useState<any[]>([]);

    const daysInMonth = useMemo(() => {
        const year = new Date().getFullYear();
        return new Date(year, selectedMonth + 1, 0).getDate();
    }, [selectedMonth]);

    const offset = useMemo(() => startDow(selectedMonth), [selectedMonth]);

    const prev = useCallback(() => setSelectedMonth(m => (m - 1 + 12) % 12), []);
    const next = useCallback(() => setSelectedMonth(m => (m + 1) % 12), []);

    const fetchDailyAverages = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication required.");
                setLoading(false);
                return;
            }
            const year = new Date().getFullYear();
            const startStr = `${year}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
            const endStr = `${year}-${String(selectedMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
            
            const base = getApiUrl();
            const res = await axios.get(`${base}/biometrics/history/daily-averages`, {
                params: { start_date: startStr, end_date: endStr },
                headers: { Authorization: `Bearer ${token}` }
            });
            setDailyAverages(res.data);
        } catch (err: any) {
            console.error("Failed to fetch daily averages", err);
            setError(err.response?.data?.detail || "Failed to retrieve cognitive history");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [selectedMonth, daysInMonth]);

    useEffect(() => {
        fetchDailyAverages(true);
    }, [fetchDailyAverages]);

    useEffect(() => {
        const ws = getBiometricWS();
        ws.connect();

        let debounceTimer: NodeJS.Timeout;

        const unsubscribe = ws.on("biometric_update", (msg) => {
            const isCurrentMonth = selectedMonth === new Date().getMonth();
            if (!isCurrentMonth) return;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchDailyAverages(false);
            }, 5000);
        });

        return () => {
            unsubscribe();
            clearTimeout(debounceTimer);
        };
    }, [selectedMonth, fetchDailyAverages]);

    const days = useMemo(() => {
        const dataMap = new Map<number, number>();
        dailyAverages.forEach(item => {
            if (item.date) {
                const parts = item.date.split("-");
                const dayNum = parseInt(parts[2], 10);
                dataMap.set(dayNum, item.avg_stress_level);
            }
        });

        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const stress = dataMap.has(day) ? dataMap.get(day)! : 0;
            const hasData = dataMap.has(day);
            return { day, stress, hasData };
        });
    }, [selectedMonth, dailyAverages, daysInMonth]);

    // Summary stats
    const activeDays = useMemo(() => days.filter(d => d.hasData), [days]);
    const avgStress = useMemo(() => {
        if (activeDays.length === 0) return 0;
        return Math.round(activeDays.reduce((a, d) => a + d.stress, 0) / activeDays.length);
    }, [activeDays]);
    const peakStress = useMemo(() => {
        if (activeDays.length === 0) return 0;
        return Math.round(Math.max(...activeDays.map(d => d.stress)));
    }, [activeDays]);
    const highDays = useMemo(() => {
        return activeDays.filter(d => d.stress > 70).length;
    }, [activeDays]);

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
                        { label: "Avg Stress", value: activeDays.length > 0 ? `${avgStress}%` : "--", color: activeDays.length > 0 ? stressRgb(avgStress) : "156, 163, 175" },
                        { label: "Peak Stress", value: activeDays.length > 0 ? `${peakStress}%` : "--", color: activeDays.length > 0 ? stressRgb(peakStress) : "156, 163, 175" },
                        { label: "High-Risk Days", value: activeDays.length > 0 ? `${highDays}d` : "--", color: activeDays.length > 0 ? stressRgb(highDays > 5 ? 80 : 40) : "156, 163, 175" },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 flex flex-col items-center text-center"
                        >
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-xl font-black" style={{ color: `rgb(${color})`, textShadow: activeDays.length > 0 ? `0 0 12px rgba(${color},0.5)` : "none" }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Dot Matrix ──────────────────────────────────────────────────── */}
                <div className="relative z-10 min-h-[180px] flex flex-col justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-cyan-400 animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-xs font-mono tracking-widest uppercase">Fetching Telemetry...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-red-400 text-sm font-semibold">{error}</p>
                            <p className="text-gray-500 text-xs font-mono mt-1 mb-4">Please ensure the backend is running and you are logged in.</p>
                            <button
                                onClick={() => fetchDailyAverages(true)}
                                className="bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 font-mono text-[10px] tracking-wider uppercase px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
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
                                    {days.map(({ day, stress, hasData }, i) => {
                                        const rgb = hasData ? stressRgb(stress) : "156, 163, 175";
                                        const glowSize = hasData ? (stress > 70 ? "10px" : stress > 40 ? "6px" : "4px") : "0px";
                                        const borderStyle = hasData ? `1px solid rgba(${rgb}, 0.95)` : "1px solid rgba(255,255,255,0.08)";
                                        const bgStyle = hasData ? `rgba(${rgb}, 0.80)` : "rgba(255,255,255,0.04)";

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
                                                        backgroundColor: bgStyle,
                                                        border: borderStyle,
                                                        boxShadow: hasData ? `0 0 ${glowSize} rgba(${rgb}, 0.7), inset 0 0 2px rgba(255,255,255,0.12)` : "none",
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
                                                    <p className="text-xs font-bold" style={{ color: hasData ? `rgb(${rgb})` : "#9ca3af" }}>
                                                        {hasData ? `${stress.toFixed(0)}% — ${stressLabel(stress)}` : "No telemetry recorded"}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </>
                    )}
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
