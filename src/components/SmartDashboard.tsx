"use client";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export default function SmartDashboard() {
    const [risk, setRisk] = useState(20);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-200px" });

    useEffect(() => {
        if (isInView) {
            const startRisk = 20;
            const targetRisk = 88;
            const duration = 2500;
            const steps = 60;
            const stepTime = duration / steps;
            let current = startRisk;

            const timer = setInterval(() => {
                current += (targetRisk - startRisk) / steps;
                if (current >= targetRisk) {
                    setRisk(targetRisk);
                    clearInterval(timer);
                } else {
                    setRisk(Math.floor(current));
                }
            }, stepTime);

            return () => clearInterval(timer);
        }
    }, [isInView]);

    const isCritical = risk >= 85;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    // Dynamic offset mapping from 20 -> 88
    const strokeDashoffset = Math.max(0, circumference - (risk / 100) * circumference);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`bg-white/5 backdrop-blur-xl border-t shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-8 relative overflow-hidden transition-colors duration-1000 ${isCritical ? "border-t-red-500 border-red-500/20 shadow-[0_0_40px_rgba(255,59,59,0.15)]" : "border-t-cyan-400 border-cyan-500/10"
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
                                className={`transition-colors duration-500 ${isCritical ? "text-red-500 drop-shadow-[0_0_10px_red]" : "text-cyan-400 drop-shadow-[0_0_10px_cyan]"
                                    }`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black ${isCritical ? "text-red-400" : "text-white"}`}>{risk}</span>
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
                                d="M 0 80 Q 40 50, 80 70 T 160 30 T 200 10"
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
                            <span>MON</span>
                            <span>WED</span>
                            <span>FRI</span>
                            <span>SUN</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
