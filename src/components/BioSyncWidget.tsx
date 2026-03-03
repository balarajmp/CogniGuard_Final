"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import TiltCard from "./TiltCard";

import axios from "axios";

export default function BioSyncWidget() {
    const [bpm, setBpm] = useState(72);
    const [hrv, setHrv] = useState(45);
    const [stressTrend, setStressTrend] = useState<any[]>([]);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const token = localStorage.getItem("token");
                const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
                const res = await axios.get(`${base}/biometrics/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStressTrend(res.data);
            } catch (error) {
                console.error("Failed to fetch stress trends", error);
            }
        };
        fetchTrends();

        const interval = setInterval(() => {
            const newBpm = bpm + (Math.random() > 0.5 ? 1 : -1);
            setBpm(newBpm);
            setHrv(prev => prev + (Math.random() > 0.5 ? 2 : -2));

            // Post real-time ingestion
            const token = localStorage.getItem("token");
            if (token) {
                const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
                axios.post(`${base}/biometrics/ingest`, {
                    typing_speed_wpm: 60,
                    heart_rate_bpm: newBpm,
                    facial_fatigue_score: 0.1
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => { });
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [bpm]);

    return (
        <TiltCard>
            <motion.div
                whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(6,182,212,0.6)" }}
                className="bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-[pulse_1s_ease-in-out_infinite]">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Bio-Sync</h3>
                        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Live Vital Feed</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center relative z-10 space-y-6">
                    {/* Animated Pulse Wave */}
                    <div className="w-full h-16 relative flex items-center">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                            <motion.path
                                d="M0 20 L20 20 L25 5 L30 35 L35 20 L50 20 L55 10 L60 30 L65 20 L80 20 L85 0 L90 40 L95 20 L100 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest">HEART RATE</p>
                            <p className="text-2xl font-black text-white">{bpm} <span className="text-sm font-normal text-cyan-500">BPM</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest">HRV METRIC</p>
                            <p className="text-2xl font-black text-white">{hrv} <span className="text-sm font-normal text-cyan-500">ms</span></p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </TiltCard>
    );
}
