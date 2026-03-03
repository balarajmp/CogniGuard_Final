"use client";
import { motion } from "framer-motion";
import { User, TrendingUp, Building2 } from "lucide-react";

const tiers = [
    {
        icon: User,
        tier: "Individual",
        label: "Free / Demo",
        desc: "Full access to cognitive monitoring for personal use. No sign-up required to explore the live demo.",
        features: ["Personal burnout dashboard", "On-device processing", "Flow-state tracking", "Live demo access"],
        cta: "Enter Demo",
        badge: null,
        highlight: false,
    },
    {
        icon: TrendingUp,
        tier: "Pro",
        label: "Coming Soon",
        desc: "Advanced analytics, team features, and history exports for power users and small teams.",
        features: ["Everything in Individual", "30-day cognitive history", "Team risk overview", "Priority intervention engine"],
        cta: "Join Waitlist",
        badge: "COMING SOON",
        highlight: true,
    },
    {
        icon: Building2,
        tier: "Enterprise",
        label: "Contact Sales",
        desc: "Custom deployment, compliance tooling, and org-wide federated learning for large organisations.",
        features: ["Everything in Pro", "Federated org-level model", "GDPR / HIPAA compliance kit", "Dedicated SLA & support"],
        cta: "Request Access",
        badge: null,
        highlight: false,
    },
];

export default function PricingAccess() {
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
                    Access Model
                </p>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    Choose Your{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-600">
                        Deployment Path
                    </span>
                </h2>
                <p className="text-gray-400 text-sm font-mono tracking-wide mt-4 max-w-xl mx-auto">
                    Start free, scale with your team, or deploy across your entire organisation.
                </p>
            </motion.div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {tiers.map(({ icon: Icon, tier, label, desc, features, cta, badge, highlight }, i) => (
                    <motion.div
                        key={tier}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.12 }}
                        className={`relative flex flex-col rounded-3xl p-8 overflow-hidden transition-all duration-700
              ${highlight
                                ? "bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,242,255,0.12)] hover:border-cyan-400/60 hover:shadow-[0_0_40px_rgba(0,242,255,0.2)]"
                                : "bg-white/5 backdrop-blur-xl border border-cyan-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 hover:shadow-[0_8px_32px_rgba(0,242,255,0.08)]"
                            } group`}
                    >
                        {/* Hover gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Coming Soon Overlay Badge */}
                        {badge && (
                            <div className="absolute top-5 right-5 z-20">
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full tracking-widest uppercase animate-pulse">
                                    {badge}
                                </span>
                            </div>
                        )}

                        {/* Icon + Tier */}
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors duration-500
                ${highlight
                                    ? "bg-cyan-500/20 border-cyan-400/50 group-hover:border-cyan-400"
                                    : "bg-cyan-500/10 border-cyan-500/30 group-hover:border-cyan-400/50"
                                }`}>
                                <Icon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-wide">{tier}</h3>
                                <p className={`text-xs font-mono tracking-widest uppercase ${highlight ? "text-cyan-300" : "text-cyan-400/70"}`}>
                                    {label}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed mb-6 relative z-10">{desc}</p>

                        {/* Feature list */}
                        <ul className="space-y-2.5 mb-8 flex-1 relative z-10">
                            {features.map((f) => (
                                <li key={f} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan] mt-1.5 shrink-0" />
                                    <span className="text-sm text-gray-300 leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA */}
                        <div className="relative z-10">
                            <a
                                href="#"
                                className={`block w-full text-center px-6 py-3 rounded-xl border font-mono text-sm tracking-wide transition-all duration-300
                  ${highlight
                                        ? "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white shadow-[0_0_20px_rgba(0,242,255,0.15)] hover:shadow-[0_0_30px_rgba(0,242,255,0.3)]"
                                        : "bg-white/5 hover:bg-cyan-500/10 border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300"
                                    }`}
                            >
                                {cta}
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center text-[11px] text-gray-600 font-mono tracking-widest uppercase mt-8"
            >
                No credit card required · Privacy-first by design · GDPR compliant
            </motion.p>
        </section>
    );
}
