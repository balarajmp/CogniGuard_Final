"use client";
import { motion } from "framer-motion";
import { Activity, MousePointer2, Keyboard, AppWindow } from "lucide-react";

export default function PassiveMonitoring() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(0,255,255,0.05)] relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Scanning Laser Animation */}
            <motion.div
                animate={{ y: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-cyan-400/50 shadow-[0_0_10px_cyan] z-10"
                style={{ top: "0%" }}
            />

            <div className="flex items-center gap-4 mb-6 relative z-20">
                <Activity className="text-cyan-400 w-8 h-8" />
                <h2 className="text-2xl font-bold text-white tracking-wide">Passive Monitoring Engine</h2>
            </div>

            <div className="space-y-6 relative z-20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <Keyboard className="text-gray-300 w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm text-cyan-400 font-mono tracking-wider mb-1 uppercase">Metric 01</p>
                        <p className="text-white font-medium">Keystroke Dynamics</p>
                        <p className="text-gray-400 text-sm">Analyzing typing rhythm and Micro-Hesitations</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <MousePointer2 className="text-gray-300 w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm text-cyan-400 font-mono tracking-wider mb-1 uppercase">Metric 02</p>
                        <p className="text-white font-medium">Trajectory Mapping</p>
                        <p className="text-gray-400 text-sm">Tracking cursor velocity and precision deviations</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <AppWindow className="text-gray-300 w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm text-cyan-400 font-mono tracking-wider mb-1 uppercase">Metric 03</p>
                        <p className="text-white font-medium">Context Switching</p>
                        <p className="text-gray-400 text-sm">Measuring application hop frequency and focus dilution</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
