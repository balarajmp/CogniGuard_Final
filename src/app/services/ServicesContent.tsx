"use client";

import PageTransition from "@/components/ui/PageTransition";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { SERVICE_TIERS } from "@/lib/constants";
import {
  ArrowRight,
  CheckCircle2,
  Code,
  Building2,
  Stethoscope,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import NeuralBackground from "@/components/NeuralBackground";

const useCases = [
  {
    icon: Code,
    title: "Software Teams",
    description:
      "Detect developer burnout before it leads to attrition. Integrate with your CI/CD pipeline for team health dashboards.",
  },
  {
    icon: Building2,
    title: "Enterprise",
    description:
      "Org-wide cognitive health analytics with SSO, custom SLA, and on-prem deployment options.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare",
    description:
      "Monitor clinician fatigue in high-stakes environments. HIPAA-ready architecture with audit trails.",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description:
      "Track student cognitive load during online learning. Help educators optimize course pacing.",
  },
];

export default function ServicesContent() {
  return (
    <PageTransition>
      <main className="min-h-screen relative" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <NeuralBackground variant="minimal" />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 px-4 sm:px-8 overflow-hidden">
          <div className="absolute inset-0 grid-pattern-bg opacity-40" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(0,217,255,0.05)" }} />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <SectionHeader
              label="Services & Pricing"
              title="Cognitive Health at Every Scale"
              subtitle="From individual developers to global enterprises — a tier built for every team size."
            />
          </div>
        </section>

        {/* ── Pricing Tiers ────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICE_TIERS.map((tier, i) => (
              <ScrollReveal key={tier.name} delay={i * 0.1}>
                <div
                  className={`relative rounded-2xl p-[1px] h-full ${
                    tier.highlighted
                      ? "bg-gradient-to-b from-cyan-500/40 via-cyan-500/10 to-transparent"
                      : ""
                  }`}
                >
                  <Card
                    hover
                    glow={tier.highlighted}
                    padding="lg"
                    className={`h-full flex flex-col ${
                      tier.highlighted ? "!border-cyan-500/30" : ""
                    }`}
                  >
                    {tier.highlighted && (
                      <Badge variant="accent" pulse className="self-start mb-4">
                        Most Popular
                      </Badge>
                    )}
                    <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                      {tier.tagline}
                    </p>
                    <h3 className="text-2xl font-black text-white mt-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mt-3 mb-6">
                      <span className="text-4xl font-black text-white">{tier.price}</span>
                      {tier.period !== "forever" && (
                        <span className="text-xs font-mono text-gray-500">{tier.period}</span>
                      )}
                    </div>

                    <ul className="space-y-3 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-300">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <Link href={tier.name === "Enterprise" ? "/contact" : "/register"}>
                        <Button
                          variant={tier.highlighted ? "primary" : "secondary"}
                          fullWidth
                          size="lg"
                          iconRight={ArrowRight}
                        >
                          {tier.cta}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── Use Cases ────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 py-24">
          <SectionHeader
            label="Use Cases"
            title="Built for Every Industry"
            subtitle="CogniGuard adapts to your workflow — whether you ship code, save lives, or shape minds."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-14">
            {useCases.map((uc, i) => (
              <ScrollReveal key={uc.title} delay={i * 0.08}>
                <Card className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <uc.icon className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1.5">{uc.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{uc.description}</p>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-24">
          <ScrollReveal>
            <div className="glass-card p-10 sm:p-14 text-center section-glow">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Need a Custom Solution?
                </h2>
                <p className="text-gray-400 text-sm font-mono tracking-wide mb-8 max-w-md mx-auto">
                  Our enterprise team will design a deployment that fits your security, compliance, and scale requirements.
                </p>
                <Link href="/contact">
                  <Button variant="primary" size="lg" iconRight={ArrowRight}>
                    Talk to Sales
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </PageTransition>
  );
}
