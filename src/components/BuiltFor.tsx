"use client";
import { motion } from "framer-motion";
import { Terminal, Wifi, Building2 } from "lucide-react";

const audiences = [
    {
        icon: Terminal,
        title: "Engineers",
        badge: "Individual",
        features: [
            "Keystroke & focus-pattern monitoring",
            "Flow-state aura and deep work tracking",
            "Cognitive load spike alerts",
            "Personal burnout trend history",
        ],
        accent: "cyan",
    },
    {
        icon: Wifi,
        title: "Remote Teams",
        badge: "Team",
        features: [
            "Anonymised team risk overview",
            "No individual surveillance — aggregate only",
            "Asynchronous collaboration health metrics",
            "Manager-safe burnout heatmaps",
        ],
        accent: "cyan",
    },
    {
        icon: Building2,
        title: "Enterprise Orgs",
        badge: "Enterprise",
        features: [
            "Org-level compliance-ready analytics",
            "Department risk breakdowns",
            "Federated learning across all endpoints",
            "Custom SLA & dedicated deployment",
        ],
        accent: "cyan",
    },
];

export default function BuiltFor() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-[10vh]">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-center mb-16"
            >
                <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-4 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                    Built For
                </p>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    Every Layer of{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-600">
                        the Modern Workforce
                    </span>
                </h2>
            </motion.div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {audiences.map(({ icon: Icon, title, badge, features }, i) => (
                    <motion.div
                        key={title}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.12 }}
                        className="bg-white/5 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 hover:shadow-[0_8px_32px_rgba(0,242,255,0.08)] transition-all duration-700"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Badge + Icon Row */}
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/50 transition-colors duration-500">
                                <Icon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full tracking-widest uppercase">
                                {badge}
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold text-white tracking-wide mb-5 relative z-10">
                            {title}
                        </h3>

                        {/* Feature List */}
                        <ul className="space-y-3 relative z-10">
                            {features.map((feat) => (
                                <li key={feat} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan] mt-1.5 shrink-0" />
                                    <span className="text-sm text-gray-300 leading-snug">{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
