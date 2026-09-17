"use client";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { getBiometricWS } from "@/lib/ws";
import { getApiUrl } from "@/lib/api";

export default function SmartDashboard() {
    const [risk, setRisk] = useState(0);
    const [animatedRisk, setAnimatedRisk] = useState(0);
    const [weeklyData, setWeeklyData] = useState<{ day: string; stress: number; label: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-200px" });

    const fetchDashboardData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication required");
                setLoading(false);
                return;
            }
            const base = getApiUrl();
            
            // 1. Fetch latest stress history to get the latest burnout risk
            const historyRes = await axios.get(`${base}/biometrics/history`, {
                params: { limit: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (historyRes.data && historyRes.data.length > 0) {
                const latest = historyRes.data[0];
                setRisk(Math.round(latest.burnout_risk_pct));
            } else {
                setRisk(0);
            }
            
            // 2. Fetch daily averages for last 7 days
            const today = new Date();
            const start = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
            const startStr = start.toISOString().split("T")[0];
            const endStr = today.toISOString().split("T")[0];
            
            const avgRes = await axios.get(`${base}/biometrics/history/daily-averages`, {
                params: { start_date: startStr, end_date: endStr },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const mappedPoints = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
                const dStr = d.toISOString().split("T")[0];
                const dayLabel = daysOfWeek[d.getDay()];
                
                const record = avgRes.data.find((r: any) => r.date === dStr);
                mappedPoints.push({
                    day: dStr,
                    stress: record ? record.avg_stress_level : 0,
                    label: dayLabel
                });
            }
            setWeeklyData(mappedPoints);
        } catch (err: any) {
            console.error("Failed to fetch dashboard telemetry", err);
            setError(err.response?.data?.detail || "Failed to retrieve dashboard data");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData(true);
    }, [fetchDashboardData]);

    useEffect(() => {
        const ws = getBiometricWS();
        ws.connect();

        let debounceTimer: NodeJS.Timeout;

        const unsubscribe = ws.on("biometric_update", (msg) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchDashboardData(false);
            }, 5000);
        });

        return () => {
            unsubscribe();
            clearTimeout(debounceTimer);
        };
    }, [fetchDashboardData]);

    // Circular gauge animation
    useEffect(() => {
        if (!isInView || loading || risk === 0) return;
        
        let current = 0;
        const duration = 1500;
        const steps = 40;
        const stepTime = duration / steps;
        
        const timer = setInterval(() => {
            current += risk / steps;
            if (current >= risk) {
                setAnimatedRisk(risk);
                clearInterval(timer);
            } else {
                setAnimatedRisk(Math.floor(current));
            }
        }, stepTime);
        
        return () => clearInterval(timer);
    }, [risk, isInView, loading]);

    const isCritical = animatedRisk >= 85;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = Math.max(0, circumference - (animatedRisk / 100) * circumference);

    // Compute real SVG path from weeklyData
    const linePath = useMemo(() => {
        if (weeklyData.length === 0) return "M 0 100 L 200 100";
        return weeklyData.map((p, index) => {
            const x = (index / (weeklyData.length - 1)) * 200;
            // Map stress 0-100 to SVG height 100-0
            const y = 100 - p.stress;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(" ");
    }, [weeklyData]);

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-80 flex flex-col items-center justify-center text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-mono tracking-widest uppercase">Loading Analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 shadow-[0_8px_32px_rgba(255,59,59,0.1)] rounded-3xl p-8 h-80 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Failed to Load Dashboard</h3>
                <p className="text-xs text-gray-400 mb-6 max-w-xs">{error}</p>
                <button
                    onClick={() => fetchDashboardData(true)}
                    className="bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 font-mono text-xs tracking-wider uppercase px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`bg-white/5 backdrop-blur-xl border-t shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-8 relative overflow-hidden transition-colors duration-1000 ${
                isCritical ? "border-t-red-500 border-red-500/20 shadow-[0_0_40px_rgba(255,59,59,0.15)]" : "border-t-cyan-400 border-cyan-500/10"
            }`}
        >
            <h2 className="text-2xl font-bold text-white tracking-wide mb-8">Burnout Risk Dashboard</h2>

            {isCritical && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-8 right-8 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider flex items-center gap-2 animate-pulse"
                >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Critical Warning: Cognitive Reserves Exhausted
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-12">
                {/* Interactive Glass Gauge */}
                <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                            {/* Track */}
                            <circle
                                cx="96"
                                cy="96"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="16"
                                fill="transparent"
                                className="text-white/5"
                            />
                            {/* Progress */}
                            <motion.circle
                                cx="96"
                                cy="96"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="16"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className={`transition-colors duration-500 ${
                                    isCritical ? "text-red-500 drop-shadow-[0_0_10px_red]" : "text-cyan-400 drop-shadow-[0_0_10px_cyan]"
                                }`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black ${isCritical ? "text-red-400" : "text-white"}`}>{animatedRisk}</span>
                            <span className={`text-[10px] font-mono tracking-widest mt-1 ${isCritical ? "text-red-500" : "text-cyan-400"}`}>
                                RISK INDEX
                            </span>
                        </div>
                    </div>
                </div>

                {/* Minimalist Glowing Line Graph */}
                <div className="w-full h-40 relative flex flex-col justify-end">
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest absolute top-0 left-0">WEEKLY STRESS TRENDS</p>
                    <div className="w-full h-32 border-b border-l border-white/10 relative mt-4">
                        <svg className="w-full h-full absolute inset-0 preserve-3d" viewBox="0 0 200 100" preserveAspectRatio="none">
                            <motion.path
                                d={linePath}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className={isCritical ? "text-red-500" : "text-cyan-400"}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                                style={{ filter: `drop-shadow(0 0 8px ${isCritical ? 'red' : 'cyan'})` }}
                            />
                        </svg>
                        <div className="absolute bottom-[-24px] left-0 w-full flex justify-between text-[10px] text-gray-400 font-mono">
                            {weeklyData.map((d, idx) => (
                                <span key={idx}>{d.label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
