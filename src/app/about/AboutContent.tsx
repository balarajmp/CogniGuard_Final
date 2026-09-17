"use client";

import PageTransition from "@/components/ui/PageTransition";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import {
  Brain,
  Shield,
  Eye,
  Target,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import NeuralBackground from "@/components/NeuralBackground";

const values = [
  {
    icon: Shield,
    title: "Privacy by Design",
    description:
      "Every architectural decision starts with user privacy. Zero raw data leaves the device — ever.",
  },
  {
    icon: Brain,
    title: "Science-Driven",
    description:
      "Built on peer-reviewed research in cognitive psychology, HCI, and behavioral biometrics.",
  },
  {
    icon: Eye,
    title: "Passive & Non-Invasive",
    description:
      "No cameras, no wearables, no surveys. CogniGuard observes typing and interaction patterns silently.",
  },
  {
    icon: Users,
    title: "Human-Centered",
    description:
      "Technology should serve people, not surveil them. Every feature is designed to empower, not control.",
  },
];

const milestones = [
  { year: "2023", label: "Research Phase", description: "Academic research on passive cognitive load detection begins." },
  { year: "2024", label: "Alpha Launch", description: "First prototype deployed with 50 beta users across 3 organizations." },
  { year: "2025", label: "Privacy Certification", description: "SOC 2 Type II and GDPR compliance achieved. Open-source privacy audit published." },
  { year: "2026", label: "Enterprise GA", description: "General availability for enterprise customers with full API and SSO support." },
];

const stats = [
  { value: "99.7%", label: "Privacy Score" },
  { value: "<2%", label: "CPU Overhead" },
  { value: "12+", label: "Behavioral Signals" },
  { value: "60s", label: "Update Interval" },
];

export default function AboutContent() {
  return (
    <PageTransition>
      <main className="min-h-screen relative" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {/* Neural background — minimal for info pages */}
        <NeuralBackground variant="minimal" />

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 px-4 sm:px-8 overflow-hidden">
          <div className="absolute inset-0 grid-pattern-bg opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(0,217,255,0.05)" }} />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <SectionHeader
              label="Our Mission"
              title="Protecting Minds, Preserving Privacy"
              subtitle="CogniGuard was born from a simple belief: cognitive health is as important as physical health, and protecting it shouldn't require sacrificing privacy."
            />
          </div>
        </section>

        {/* ── Stats Bar ────────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-white/[0.02]">
          <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.08} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
                  {stat.label}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── Values ───────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 py-24">
          <SectionHeader
            label="Core Values"
            title="What We Stand For"
            subtitle="Four principles that guide every line of code and every product decision."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-14">
            {values.map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 0.08}>
                <Card glow className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <v.icon className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1.5">{v.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{v.description}</p>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-8 py-24">
          <SectionHeader
            label="Journey"
            title="Our Story"
          />
          <div className="mt-14 relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <div className="space-y-10">
              {milestones.map((m, i) => (
                <ScrollReveal key={m.year} delay={i * 0.1}>
                  <div className="flex items-start gap-5 pl-2">
                    {/* Dot */}
                    <div className="relative mt-1.5 shrink-0">
                      <div className="w-5 h-5 rounded-full border-2 border-cyan-500/40 bg-black flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      </div>
                    </div>
                    {/* Content */}
                    <div>
                      <span className="text-xs font-mono text-cyan-400 tracking-widest">{m.year}</span>
                      <h3 className="text-white font-bold text-lg mt-0.5">{m.label}</h3>
                      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-24">
          <ScrollReveal>
            <div className="glass-card p-10 sm:p-14 text-center section-glow">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                  <Target className="w-7 h-7 text-cyan-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Ready to Protect Your Team?
                </h2>
                <p className="text-gray-400 text-sm font-mono tracking-wide mb-8 max-w-md mx-auto">
                  Start monitoring cognitive health today — free for individuals, scalable for enterprises.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button variant="primary" size="lg" icon={Zap}>
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="secondary" size="lg" iconRight={ArrowRight}>
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </PageTransition>
  );
}
