"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getBiometricWS } from "@/lib/ws";

export default function RealTimeAnalytics() {
    const [latency, setLatency] = useState(42);
    const [focus, setFocus] = useState(89);
    const [entropy, setEntropy] = useState<number | string>(0.12);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const ws = getBiometricWS();
        ws.connect();

        // Listen for biometric updates
        const unsubscribeUpdate = ws.on("biometric_update", (message) => {
            const payload = message.payload;
            // Map telemetry data to HUD metrics
            // Simulated neural latency based on typing speed fluctuations
            const typingSpeed = payload.typing_speed_wpm || 75;
            setLatency(Math.max(10, Math.round(120 - typingSpeed)));
            
            // Focus stability mapped from focus_reserves_pct (0-100)
            setFocus(Math.round(payload.focus_reserves_pct ?? 89));
            
            // Entropy based on stress_level (0-100)
            const stress = payload.stress_level ?? 12;
            setEntropy((stress / 100).toFixed(2));
        });

        // Listen for connection status updates
        const unsubscribeStatus = ws.on("connection_status", (message) => {
            setIsConnected(!!message.payload.connected);
        });

        // Set initial connection status
        setIsConnected(ws.connected);

        // Fallback simulation if WS is not active
        const fallbackInterval = setInterval(() => {
            if (!ws.connected) {
                setLatency(40 + Math.floor(Math.random() * 5));
                setFocus(85 + Math.floor(Math.random() * 10));
                setEntropy((0.10 + Math.random() * 0.05).toFixed(2));
            }
        }, 2000);

        return () => {
            unsubscribeUpdate();
            unsubscribeStatus();
            clearInterval(fallbackInterval);
        };
    }, []);

    useEffect(() => {
        let status: "Calm" | "Focus" | "Overload" = "Focus";
        if (focus < 60) {
            status = "Overload";
        } else if (focus < 85) {
            status = "Calm";
        }
        window.dispatchEvent(new CustomEvent("cognitive-status-change", { detail: { status } }));
    }, [focus]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-50 pointer-events-none"
        >
            {/* Connection Indicator */}
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-3 shadow-[0_0_15px_rgba(0,242,255,0.1)] flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">
                    {isConnected ? "Telemetry Sync Active" : "Telemetry Sync Standby"}
                </span>
            </div>

            {/* Metric 1 */}
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Neural Latency</p>
                <div className="flex items-end gap-2 text-cyan-400 font-mono">
                    <span className="text-2xl font-black">{latency}</span>ms
                </div>
                <div className="w-full h-1 bg-white/5 mt-2 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-cyan-400"
                        animate={{ width: `${Math.min(100, (latency / 120) * 100)}%` }}
                        transition={{ type: "spring", bounce: 0.3 }}
                    />
                </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Focus Stability</p>
                <div className="flex items-end gap-2 text-white font-mono">
                    <span className="text-2xl font-black">{focus}</span>%
                </div>
                <div className="w-full h-1 bg-white/5 mt-2 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-cyan-400"
                        animate={{ width: `${focus}%` }}
                        transition={{ type: "spring", bounce: 0.3 }}
                    />
                </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Entropy Score</p>
                <div className="flex items-end gap-2 text-gray-300 font-mono">
                    <span className="text-2xl font-black">{entropy}</span>
                </div>
                {/* Tiny live wave-form simulation */}
                <div className="flex items-end h-3 gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-cyan-500/50 rounded-t-sm"
                            animate={{ height: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
