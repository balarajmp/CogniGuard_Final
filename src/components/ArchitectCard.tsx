"use client";
import { motion } from "framer-motion";
import { BrainCircuit, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";

export default function ArchitectCard() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto mt-24 mb-16 px-4"
    >
      <div className="cs-glass border border-white/[0.06] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[--accent-surf] border border-[--border-accent] flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-[--accent]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-white font-black tracking-widest text-sm">CognitoShield AI</p>
            <p className="text-[--text-muted] text-xs font-mono tracking-wider">v1.0.0 · Secure Platform</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy-First
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[--accent-surf] border border-[--border-accent] text-[--accent] text-xs font-mono">
            <Activity className="w-3.5 h-3.5" />
            Live Telemetry
          </span>
        </div>

        {/* Links */}
        <div className="flex gap-4 text-xs font-mono text-[--text-muted]">
          <Link href="/privacy" className="hover:text-[--accent] transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-[--accent] transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-[--accent] transition-colors">Contact</Link>
        </div>
      </div>
    </motion.footer>
  );
}
