"use client";
import { motion } from "framer-motion";
import { Users, BarChart3, TrendingUp } from "lucide-react";

export default function EnterpriseInsights() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white/5 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 transition-colors duration-500 w-full"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex items-center gap-4 mb-8">
                <Users className="text-cyan-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" />
                <h2 className="text-3xl font-bold text-white tracking-wide">Enterprise View</h2>
            </div>

            <p className="text-gray-400 text-sm font-mono uppercase tracking-wider mb-8">Anonymized Team Insights</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Widget 1 */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 group-hover:border-cyan-500/20 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-xs font-mono uppercase">Global Dept Risk</p>
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">42<span className="text-xl text-cyan-400">%</span></div>
                    <p className="text-[10px] text-cyan-300 font-mono">+12% from last week</p>
                </div>

                {/* Widget 2 */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 group-hover:border-cyan-500/20 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-xs font-mono uppercase">Deep Work Average</p>
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">2.4<span className="text-xl text-cyan-400">h</span></div>
                    <p className="text-[10px] text-cyan-300 font-mono">Optimal across Engineering</p>
                </div>

                {/* Widget 3 */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 group-hover:border-cyan-500/20 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-xs font-mono uppercase">Interventions</p>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">18</div>
                    <p className="text-[10px] text-cyan-300 font-mono">Active Micro-breaks deployed</p>
                </div>

            </div>
        </motion.div>
    );
}
