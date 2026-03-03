"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RealTimeAnalytics() {
    const [latency, setLatency] = useState(42);
    const [focus, setFocus] = useState(89);
    const [entropy, setEntropy] = useState<number | string>(0.12);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

    useEffect(() => {
        let ws: WebSocket;
        let isConnected = false;

        const connect = () => {
            try {
                ws = new WebSocket(`${WS_URL}/monitor`);

                ws.onopen = () => {
                    console.log("Connected to telemetry stream");
                    isConnected = true;
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        // Map telemetry data to HUD metrics
                        // Simulated neural latency based on typing speed fluctuations
                        setLatency(Math.max(10, 120 - (data.typingSpeed || 75)));
                        // Focus stability mapped from attentionSpan (0-1) to %
                        setFocus(Math.round((data.attentionSpan || 0.85) * 100));
                        // Entropy based on fatigueScore
                        setEntropy(Number(data.fatigueScore || 0.15).toFixed(2));
                    } catch (e) {
                        console.error("Error parsing telemetry data", e);
                    }
                };

                ws.onclose = () => {
                    if (isConnected) console.log("Disconnected from telemetry stream");
                    isConnected = false;
                    // Attempt reconnect after 5s
                    setTimeout(connect, 5000);
                };
            } catch (error) {
                console.error("WebSocket connection failed", error);
            }
        };

        connect();

        // Fallback simulation if WS fails or while waiting
        const fallbackInterval = setInterval(() => {
            if (!isConnected) {
                setLatency(40 + Math.floor(Math.random() * 5));
                setFocus(85 + Math.floor(Math.random() * 10));
                setEntropy((0.10 + Math.random() * 0.05).toFixed(2));
            }
        }, 2000);

        return () => {
            if (ws) ws.close();
            clearInterval(fallbackInterval);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-50 pointer-events-none"
        >

            {/* Metric 1 */}
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Neural Latency</p>
                <div className="flex items-end gap-2 text-cyan-400 font-mono">
                    <span className="text-2xl font-black">{latency}</span>ms
                </div>
                <div className="w-full h-1 bg-white/5 mt-2 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-cyan-400"
                        animate={{ width: `${(latency / 50) * 100}%` }}
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
