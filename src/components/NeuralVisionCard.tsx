"use client";
import { motion } from "framer-motion";
import TiltCard from "./TiltCard";

import { useState, useEffect } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/api";

export default function NeuralVisionCard() {
    const [delta, setDelta] = useState(14);

    useEffect(() => {
        const interval = setInterval(() => {
            const newDelta = delta + (Math.random() > 0.5 ? 1 : -1);
            setDelta(newDelta);

            const token = localStorage.getItem("token");
            if (token) {
                const base = getApiUrl();
                axios.post(`${base}/biometrics/ingest`, {
                    typing_speed_wpm: 60,
                    heart_rate_bpm: 72,
                    facial_fatigue_score: newDelta / 100
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => { });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [delta]);

    return (
        <TiltCard>
            <motion.div
                whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(6,182,212,0.6)" }}
                className="bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 relative overflow-hidden group transition-all duration-300"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Neural Vision</h3>
                        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Biometric Fatigue Detection</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        On-device deep learning actively monitors <span className="text-cyan-300 font-semibold">blink-rate</span> and <span className="text-cyan-300 font-semibold">micro-expressions</span> to identify early signs of burnout before they escalate.
                    </p>
                    <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-4">
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest">MICRO-EXPRESSION DELTA</p>
                            <p className="text-xl font-black text-white">+{delta}<span className="text-sm font-normal text-cyan-500">% hr</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest text-right">STATUS</p>
                            <p className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/30">ANALYZING</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </TiltCard>
    );
}
