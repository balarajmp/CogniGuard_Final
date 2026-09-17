"use client";

import Link from "next/link";
import { BrainCircuit, ArrowUpRight } from "lucide-react";
import { FOOTER_LINKS, SITE } from "@/lib/constants";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative" style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-accent)" }} role="contentinfo">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-cyan-500/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        {/* ── Top Row: Logo + Columns ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand Column */}
          <ScrollReveal className="col-span-2 sm:col-span-4 lg:col-span-2">
            <div className="space-y-5">
              <Link href="/home" className="flex items-center gap-2.5 group">
                <BrainCircuit
                  className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_cyan] group-hover:scale-110 transition-transform"
                  strokeWidth={1.5}
                />
                <span className="text-white font-black tracking-widest text-lg">
                  CognitoShield AI
                </span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                {SITE.tagline}. Powered by edge AI, built for privacy.
              </p>
              <p className="text-xs font-mono text-gray-600 tracking-wider">
                {SITE.email}
              </p>
            </div>
          </ScrollReveal>

          {/* Product Links */}
          <ScrollReveal delay={0.1}>
            <div>
              <h4 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">
                Product
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-white text-sm transition-colors duration-200 flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Company Links */}
          <ScrollReveal delay={0.15}>
            <div>
              <h4 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">
                Company
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-white text-sm transition-colors duration-200 flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Legal Links */}
          <ScrollReveal delay={0.2}>
            <div>
              <h4 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-white text-sm transition-colors duration-200 flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-gray-600 tracking-wider">
              © {currentYear} CogniGuard. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_green]" />
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
