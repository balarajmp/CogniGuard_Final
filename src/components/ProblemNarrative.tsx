"use client";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart2, ShieldOff } from "lucide-react";

const problems = [
    {
        icon: AlertTriangle,
        title: "Burnout Is Reaching Crisis Levels",
        body: "77% of the workforce experiences burnout at least once. It costs organisations $1 trillion per year in lost productivity — yet most companies still don't see it coming.",
        stat: "77%",
        statLabel: "Workforce Burnout Rate",
    },
    {
        icon: BarChart2,
        title: "Surveys Fail to Catch It",
        body: "Self-reported wellness surveys are biased, infrequent, and lag weeks behind reality. By the time data is collected, the damage is already done. You can't act on yesterday's feelings.",
        stat: "14d",
        statLabel: "Average Survey Lag",
    },
    {
        icon: ShieldOff,
        title: "Privacy Can't Be an Afterthought",
        body: "Traditional employee monitoring tools transmit raw biometrics and behavioural data to centralised servers — exposing workers to surveillance and companies to compliance risk.",
        stat: "0%",
        statLabel: "Raw Data Leaves Device",
    },
];

export default function ProblemNarrative() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-[10vh]">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-center mb-16"
            >
                <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-4 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                    The Problem
                </p>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    The Workforce Is Burning Out
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-600">
                        And No One&apos;s Measuring It Right
                    </span>
                </h2>
            </motion.div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {problems.map(({ icon: Icon, title, body, stat, statLabel }, i) => (
                    <motion.div
                        key={title}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.12 }}
                        className="bg-white/5 backdrop-blur-xl border border-t-cyan-400/30 border-cyan-500/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,242,255,0.08)] hover:border-cyan-500/30 transition-all duration-700"
                    >
                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:border-cyan-400/50 transition-colors duration-500">
                            <Icon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white tracking-wide mb-3 leading-snug">
                                {title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                {body}
                            </p>

                            {/* Stat */}
                            <div className="border-t border-white/10 pt-5">
                                <p className="text-4xl font-black text-white">
                                    {stat}
                                </p>
                                <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-1">
                                    {statLabel}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
