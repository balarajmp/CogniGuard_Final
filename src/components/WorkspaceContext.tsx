"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import TiltCard from "./TiltCard";

export default function WorkspaceContext() {
    const [noise, setNoise] = useState(45);
    const [blueLight, setBlueLight] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => {
            setNoise(prev => Math.max(30, Math.min(85, prev + (Math.random() * 10 - 5))));
            setBlueLight(prev => Math.max(20, Math.min(100, prev + (Math.random() * 8 - 4))));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const stressRisk = (noise > 70 || blueLight > 80) ? "ELEVATED" : "NOMINAL";
    const riskColor = stressRisk === "ELEVATED" ? "text-yellow-400" : "text-cyan-400";

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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Workspace Context</h3>
                        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Environmental Sensing</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Analyzing ambient <span className="text-cyan-300 font-semibold">noise levels</span> and screen <span className="text-cyan-300 font-semibold">blue-light exposure</span> to assess environmental stress.
                    </p>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4">
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest">AMBIENT NOISE</p>
                            <p className="text-xl font-black text-white">{noise.toFixed(0)} <span className="text-sm font-normal text-cyan-500">dB</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 mb-1 tracking-widest text-right">LUMINANCE</p>
                            <p className="text-xl font-black text-right text-white">
                                {blueLight.toFixed(0)} <span className="text-sm font-normal text-cyan-500">%</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded overflow-hidden p-2">
                        <span className="text-[10px] font-mono text-gray-400 tracking-widest">ENV STRESS INDEX</span>
                        <span className={`text-xs font-bold tracking-widest ${riskColor} animate-pulse`}>{stressRisk}</span>
                    </div>
                </div>
            </motion.div>
        </TiltCard>
    );
}
