"use client";
import { motion } from "framer-motion";
import { Shield, Lock, Cpu, Server, Database, Eye } from "lucide-react";

const guarantees = [
    {
        icon: Cpu,
        title: "On-Device Processing",
        desc: "All AI inference runs locally on your hardware. Biometric data is never serialised to a network request.",
    },
    {
        icon: Lock,
        title: "AES-256 Encryption at Rest",
        desc: "Every telemetry record stored locally is encrypted using AES-256-GCM before being written to disk.",
    },
    {
        icon: Server,
        title: "Federated Learning Aggregation",
        desc: "Only anonymised, differentially-private gradient updates leave your device — never raw signals.",
    },
    {
        icon: Database,
        title: "Zero Raw Biometric Storage",
        desc: "Facial, cardiac, and keystroke data is processed in-memory and discarded. Nothing persists in original form.",
    },
    {
        icon: Eye,
        title: "No Surveillance Architecture",
        desc: "Individual-level data is inaccessible to employers, managers, or third parties — by cryptographic design.",
    },
];

export default function PrivacyBreakdown() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-[10vh]">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white/5 backdrop-blur-xl border border-t-cyan-400/50 border-cyan-500/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,242,255,0.08)] transition-all duration-700"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <Shield className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(0,242,255,0.7)]" strokeWidth={1.5} />
                        <div>
                            <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                                Security Architecture
                            </p>
                            <h2 className="text-3xl font-bold text-white tracking-wide">
                                Privacy Is Not a Feature — It&apos;s the Foundation
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Guarantee Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                    {guarantees.map(({ icon: Icon, title, desc }, i) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-cyan-500/20 transition-colors duration-500"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan] shrink-0" />
                                    <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed pl-1">{desc}</p>
                        </motion.div>
                    ))}

                    {/* Compliance badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                        className="bg-black/40 border border-cyan-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                    >
                        <Lock className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,242,255,0.6)] mb-3" strokeWidth={1.5} />
                        <p className="text-white font-bold text-sm tracking-wide mb-1">GDPR / HIPAA Ready</p>
                        <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest opacity-70">
                            Compliance-aligned by design
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}
