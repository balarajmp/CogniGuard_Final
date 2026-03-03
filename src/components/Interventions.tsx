"use client";
import { motion } from "framer-motion";
import { Zap, Coffee, Wind } from "lucide-react";

export default function Interventions() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors duration-500"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 mb-6 relative z-20">
                <Zap className="text-cyan-400 w-8 h-8 fill-cyan-400/20 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <h2 className="text-2xl font-bold text-white tracking-wide">Intelligent Interventions</h2>
            </div>

            <div className="space-y-4">
                <motion.div variants={item} className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <Coffee className="text-cyan-400 w-5 h-5" />
                        <span className="text-white font-medium">Mandatory Micro-Break</span>
                    </div>
                    <span className="text-cyan-300 font-mono text-xs px-3 py-1 bg-cyan-400/10 rounded-md border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.2)] animate-pulse">INITIATING</span>
                </motion.div>

                <motion.div variants={item} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <Wind className="text-gray-400 w-5 h-5" />
                        <span className="text-gray-300 font-medium">Adaptive Rest Cycle</span>
                    </div>
                    <span className="text-gray-500 font-mono text-xs px-3 py-1 bg-white/5 rounded-md border border-white/10">STANDBY</span>
                </motion.div>
            </div>
        </motion.div>
    );
}
