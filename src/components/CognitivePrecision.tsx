"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import TiltCard from "./TiltCard";

import axios from "axios";
import { getApiUrl } from "@/lib/api";

export default function CognitivePrecision() {
    const [wpm, setWpm] = useState(85);
    const [errorBurst, setErrorBurst] = useState(1.2);

    useEffect(() => {
        const interval = setInterval(() => {
            const newWpm = wpm + Math.floor(Math.random() * 5) - 2;
            setWpm(newWpm);
            setErrorBurst(prev => Math.max(0.1, prev + (Math.random() * 0.4 - 0.2)));

            const token = localStorage.getItem("token");
            if (token) {
                axios.post(`${getApiUrl()}/biometrics/ingest`, {
                    typing_speed_wpm: newWpm,
                    heart_rate_bpm: 72, // default placeholder
                    facial_fatigue_score: 0.1 // default placeholder
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => { });
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [wpm]);

    return (
        <TiltCard>
            <motion.div
                whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(6,182,212,0.6)" }}
                className="bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 relative overflow-hidden group transition-all duration-300"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Cognitive Precision</h3>
                        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Pattern Accuracy</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Analyzing <span className="text-cyan-300 font-semibold">typing speed</span> dynamics and <span className="text-cyan-300 font-semibold">error-burst frequency</span> to detect cognitive over-saturation in real-time.
                    </p>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4">
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest">KEYSTROKE VELOCITY</p>
                            <p className="text-xl font-black text-white">{wpm} <span className="text-sm font-normal text-cyan-500">WPM</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest text-right">ERROR BURST</p>
                            <p className={`text-xl font-black text-right ${errorBurst > 2.0 ? 'text-red-400' : 'text-white'}`}>
                                {errorBurst.toFixed(1)} <span className="text-sm font-normal text-cyan-500">/min</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </TiltCard>
    );
}
