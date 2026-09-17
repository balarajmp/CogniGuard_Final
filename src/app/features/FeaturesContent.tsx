"use client";

import PageTransition from "@/components/ui/PageTransition";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { FEATURES } from "@/lib/constants";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import NeuralBackground from "@/components/NeuralBackground";

const categories = ["All", "Detection", "Privacy", "Wellness", "Enterprise"];

const comparisonRows = [
  { feature: "Cognitive Load Detection", free: true, team: true, enterprise: true },
  { feature: "Personal Burnout Dashboard", free: true, team: true, enterprise: true },
  { feature: "Smart Break Interventions", free: true, team: true, enterprise: true },
  { feature: "History Retention", free: "7 days", team: "30 days", enterprise: "Unlimited" },
  { feature: "Team Health Analytics", free: false, team: true, enterprise: true },
  { feature: "API Access", free: false, team: false, enterprise: true },
  { feature: "Self-Hosted Deployment", free: false, team: false, enterprise: true },
  { feature: "SSO / SAML", free: false, team: false, enterprise: true },
  { feature: "Priority Support", free: false, team: true, enterprise: true },
  { feature: "Custom SLA", free: false, team: false, enterprise: true },
];

function FeatureCheck({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-gray-300 font-mono">{value}</span>;
  }
  return value ? (
    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
  ) : (
    <span className="w-4 h-4 block rounded-full border border-white/10" />
  );
}

export default function FeaturesContent() {
  return (
    <PageTransition>
      <main className="min-h-screen relative" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <NeuralBackground variant="minimal" />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 px-4 sm:px-8 overflow-hidden">
          <div className="absolute inset-0 grid-pattern-bg opacity-40" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(0,217,255,0.05)" }} />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <SectionHeader
              label="Platform Capabilities"
              title="Built for Cognitive Intelligence"
              subtitle="Every feature is designed to detect burnout early, intervene gently, and preserve absolute privacy."
            />
          </div>
        </section>

        {/* ── Feature Grid ─────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
          {/* Category pills */}
          <ScrollReveal className="flex flex-wrap justify-center gap-2 mb-14">
            {categories.map((cat) => (
              <Badge key={cat} variant={cat === "All" ? "accent" : "default"}>
                {cat}
              </Badge>
            ))}
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.06}>
                <Card glow className="h-full">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    <Badge variant="default">{f.category}</Badge>
                    <h3 className="text-white font-bold text-base">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── Comparison Table ──────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-24">
          <SectionHeader
            label="Plan Comparison"
            title="Choose Your Tier"
            subtitle="All plans include core cognitive load detection. Scale up for team analytics and enterprise features."
          />

          <ScrollReveal className="mt-14">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left text-xs font-mono text-gray-500 uppercase tracking-wider py-4 pr-4">
                      Feature
                    </th>
                    <th className="text-center text-xs font-mono text-gray-500 uppercase tracking-wider py-4 px-4 w-28">
                      Personal
                    </th>
                    <th className="text-center text-xs font-mono text-cyan-400 uppercase tracking-wider py-4 px-4 w-28">
                      Team
                    </th>
                    <th className="text-center text-xs font-mono text-gray-500 uppercase tracking-wider py-4 px-4 w-28">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="text-sm text-gray-300 py-3.5 pr-4">{row.feature}</td>
                      <td className="text-center py-3.5 px-4">
                        <div className="flex justify-center">
                          <FeatureCheck value={row.free} />
                        </div>
                      </td>
                      <td className="text-center py-3.5 px-4 bg-cyan-500/[0.02]">
                        <div className="flex justify-center">
                          <FeatureCheck value={row.team} />
                        </div>
                      </td>
                      <td className="text-center py-3.5 px-4">
                        <div className="flex justify-center">
                          <FeatureCheck value={row.enterprise} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-24">
          <ScrollReveal>
            <div className="glass-card p-10 sm:p-14 text-center section-glow">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Experience It Yourself
                </h2>
                <p className="text-gray-400 text-sm font-mono tracking-wide mb-8 max-w-md mx-auto">
                  Start with the free personal tier. No credit card. No commitment.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button variant="primary" size="lg" icon={Zap}>
                      Start Free
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button variant="secondary" size="lg" iconRight={ArrowRight}>
                      View Services
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
