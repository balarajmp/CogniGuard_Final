"use client";
import { motion } from "framer-motion";
import TiltCard from "./TiltCard";

export default function BurnoutForecast() {
    return (
        <TiltCard>
            <motion.div
                whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(6,182,212,0.6)" }}
                className="bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Burnout Forecast</h3>
                        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Predictive Formatting</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center relative z-10 space-y-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Estimating <span className="text-cyan-300 font-semibold">Focus Reserves</span> depletion within the next <span className="text-cyan-300 font-semibold">24 hours</span>.
                    </p>

                    {/* Animated Forecast Line Graph */}
                    <div className="w-full h-24 relative flex items-end border-b border-l border-white/20 pb-2 pl-2">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 w-full h-full flex flex-col justify-between ml-2">
                            <div className="w-full border-t border-white/5 h-0"></div>
                            <div className="w-full border-t border-white/5 h-0"></div>
                            <div className="w-full border-t border-white/5 h-0"></div>
                        </div>

                        <svg className="w-full h-[90%] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                            {/* Forecast Path */}
                            <motion.path
                                d="M0 5 Q 20 10, 40 25 T 70 35 T 100 40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                strokeDasharray="4 2"
                            />

                            {/* Current Time Indicator */}
                            <motion.line
                                x1="20" y1="0" x2="20" y2="40"
                                stroke="currentColor" strokeWidth="1" className="text-white/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 }}
                            />
                            <motion.circle
                                cx="20" cy="10" r="2" fill="cyan" className="drop-shadow-[0_0_5px_cyan]"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 2, type: "spring" }}
                            />

                            {/* Depletion Point Indicator */}
                            <motion.circle
                                cx="85" cy="38" r="2" fill="red" className="drop-shadow-[0_0_5px_red] animate-pulse"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 2.5, type: "spring" }}
                            />
                        </svg>

                        {/* Labels */}
                        <div className="absolute -left-6 top-0 text-[8px] text-gray-500 font-mono rotate-[-90deg]">100%</div>
                        <div className="absolute -left-5 bottom-0 text-[8px] text-gray-500 font-mono">0%</div>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                        <span>NOW</span>
                        <span>+8h</span>
                        <span>+16h</span>
                        <span className="text-red-400">+24h</span>
                    </div>

                    <div className="text-center mt-2">
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/30">
                            EST. DEPLETION: 18 HOURS
                        </span>
                    </div>
                </div>
            </motion.div>
        </TiltCard>
    );
}
