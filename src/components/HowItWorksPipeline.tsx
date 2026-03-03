"use client";
import { motion } from "framer-motion";
import { MousePointerClick, Radio, Cpu, Activity, Lightbulb } from "lucide-react";

const steps = [
    {
        icon: MousePointerClick,
        step: "01",
        title: "User Activity",
        desc: "Keyboard dynamics, mouse patterns, and app focus are passively captured.",
    },
    {
        icon: Radio,
        step: "02",
        title: "Telemetry Capture",
        desc: "Behavioural signals are collected locally with zero network transmission.",
    },
    {
        icon: Cpu,
        step: "03",
        title: "On-Device AI",
        desc: "Deep learning models run entirely on-device — biometrics never leave your machine.",
    },
    {
        icon: Activity,
        step: "04",
        title: "Burnout Risk Score",
        desc: "Cognitive load and fatigue are scored in real time against your baseline.",
    },
    {
        icon: Lightbulb,
        step: "05",
        title: "Intelligent Intervention",
        desc: "Timely, context-aware nudges are delivered before burnout takes hold.",
    },
];

export default function HowItWorksPipeline() {
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
                    How It Works
                </p>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    From Signal to{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-600">
                        Intervention
                    </span>
                </h2>
            </motion.div>

            {/* Pipeline */}
            <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-0 w-full">
                {steps.map(({ icon: Icon, step, title, desc }, i) => (
                    <div key={step} className="flex flex-col lg:flex-row items-center w-full lg:flex-1">
                        {/* Step Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                            className="flex-1 bg-black/40 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/70 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all duration-500 w-full lg:w-auto"
                        >
                            {/* Hover shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Step number */}
                            <p className="text-[10px] font-mono text-cyan-500/60 tracking-[0.3em] mb-3 relative z-10">
                                STEP {step}
                            </p>

                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 relative z-10 group-hover:border-cyan-400/60 transition-colors duration-500">
                                <Icon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,242,255,0.6)]" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-sm font-bold text-white tracking-wide mb-2 relative z-10">
                                {title}
                            </h3>
                            <p className="text-xs text-gray-400 leading-relaxed relative z-10">
                                {desc}
                            </p>
                        </motion.div>

                        {/* Connector Arrow */}
                        {i < steps.length - 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
                                className="flex items-center justify-center px-2 py-4 lg:py-0 shrink-0"
                            >
                                <span className="text-cyan-400/60 font-mono text-xl lg:text-2xl drop-shadow-[0_0_6px_rgba(0,242,255,0.4)] rotate-90 lg:rotate-0">
                                    →
                                </span>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
