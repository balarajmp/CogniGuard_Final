"use client";
import { motion } from "framer-motion";
import { Zap, PlayCircle, Building2 } from "lucide-react";

const ctas = [
    {
        icon: Zap,
        label: "Get Started",
        sublabel: "Free individual access",
        primary: true,
    },
    {
        icon: PlayCircle,
        label: "Enter Demo",
        sublabel: "No sign-up required",
        primary: false,
    },
    {
        icon: Building2,
        label: "Request Enterprise Access",
        sublabel: "Custom deployment & SLA",
        primary: false,
    },
];

export default function CTASection() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-[8vh]">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="bg-white/5 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-10 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/20 transition-colors duration-500"
            >
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-cyan-500/8 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-3 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                        Ready to Deploy
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                        Protect Your Team&apos;s Cognitive Health
                    </h2>
                    <p className="text-gray-400 text-sm font-mono tracking-wide mb-10 max-w-xl">
                        Choose how you want to get started — individual access, live demo, or full enterprise rollout.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        {ctas.map(({ icon: Icon, label, sublabel, primary }, i) => (
                            <motion.a
                                key={label}
                                href="#"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                                className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl border font-mono text-sm transition-all duration-300 group/btn min-w-[180px]
                  ${primary
                                        ? "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white shadow-[0_0_20px_rgba(0,242,255,0.15)] hover:shadow-[0_0_30px_rgba(0,242,255,0.3)]"
                                        : "bg-white/5 hover:bg-cyan-500/10 border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors duration-300 ${primary ? "text-cyan-400" : "text-gray-400 group-hover/btn:text-cyan-400"}`} strokeWidth={1.5} />
                                <span className="font-semibold tracking-wide">{label}</span>
                                <span className="text-[10px] uppercase tracking-widest text-current opacity-60">{sublabel}</span>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
