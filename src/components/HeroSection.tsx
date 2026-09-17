"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BrainCircuit, ArrowRight, ShieldCheck, Activity, Zap } from "lucide-react";

const pillars = [
  { icon: ShieldCheck, label: "Privacy-First", desc: "Zero raw data leaves your device" },
  { icon: Activity,    label: "Live Telemetry", desc: "Real-time biometric analysis" },
  { icon: Zap,         label: "AI Insights",   desc: "XGBoost-powered predictions" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 z-10 pt-20 pb-32">

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 mb-8"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[--accent] animate-pulse shadow-[0_0_8px_var(--accent)]" />
        <span className="mono-label" style={{ color: "var(--text-accent)" }}>
          CognitoShield AI · Cognitive Analytics Platform
        </span>
      </motion.div>

      {/* Main heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-center max-w-5xl mx-auto"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
          <span className="gradient-text">Understand Your</span>
          <br />
          <span style={{ color: "var(--text-primary)" }}>Cognitive State</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-light max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Privacy-first behavioral intelligence platform for real-time cognitive load,
          focus, fatigue, and burnout analytics.
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center gap-4 mt-12"
      >
        <Link
          href="/register"
          className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "var(--accent)",
            color: "#05070A",
            boxShadow: "0 0 32px rgba(0,217,255,0.35)"
          }}
        >
          Start Free Trial
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:border-[--accent]"
          style={{
            background: "var(--accent-surf)",
            border: "1px solid var(--border-accent)",
            color: "var(--text-primary)",
          }}
        >
          Sign In
        </Link>
        <Link
          href="/login"
          className="text-sm font-mono transition-colors duration-200 hover:text-[--accent]"
          style={{ color: "var(--text-muted)" }}
        >
          Try as Guest →
        </Link>
      </motion.div>

      {/* Pillar badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-3 mt-16"
      >
        {pillars.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} strokeWidth={1.5} />
            <div>
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
              <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Scroll to explore
        </span>
        <div className="w-px h-12" style={{ background: "linear-gradient(to bottom, var(--accent), transparent)" }} />
      </motion.div>

    </section>
  );
}
