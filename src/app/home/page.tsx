import type { Metadata } from "next";
import NeuralBackground from "@/components/NeuralBackground";
import PrivacyShield from "@/components/PrivacyShield";
import SmartDashboard from "@/components/SmartDashboard";
import Interventions from "@/components/Interventions";
import EnterpriseInsights from "@/components/EnterpriseInsights";
import ArchitectCard from "@/components/ArchitectCard";
import CognitivePrecision from "@/components/CognitivePrecision";
import ZenIntervention from "@/components/ZenIntervention";
import BurnoutForecast from "@/components/BurnoutForecast";
import CTASection from "@/components/CTASection";
import HowItWorksPipeline from "@/components/HowItWorksPipeline";
import BuiltFor from "@/components/BuiltFor";
import PrivacyBreakdown from "@/components/PrivacyBreakdown";
import PricingAccess from "@/components/PricingAccess";
import ProblemNarrative from "@/components/ProblemNarrative";
import HeroSection from "@/components/HeroSection";

export const metadata: Metadata = {
  title: "CognitoShield AI — Privacy-First Cognitive Analytics",
  description:
    "CognitoShield AI is a privacy-first behavioral intelligence platform for real-time cognitive load, focus, fatigue, and burnout analytics.",
  openGraph: {
    title: "CognitoShield AI — Privacy-First Cognitive Analytics",
    description:
      "Privacy-first behavioral intelligence platform for real-time cognitive load, focus, fatigue, and burnout analytics.",
    url: "https://cogniguard.ai/home",
    siteName: "CognitoShield AI",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden selection:bg-[--accent-surf] font-sans" style={{ background: "var(--bg-primary)" }}>

      {/* Global neural network background */}
      <div className="fixed inset-0 z-0">
        <NeuralBackground variant="landing" />
        {/* Subtle radial gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,217,255,0.04) 0%, transparent 65%), radial-gradient(ellipse 60% 80% at 80% 80%, rgba(0,100,180,0.05) 0%, transparent 60%)"
          }}
        />
      </div>

      {/* ── HERO ────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── CONTENT SCROLL LAYER ────────────────────────────── */}
      <div className="relative z-10 w-full">

        {/* How It Works */}
        <section className="py-28 px-4 sm:px-8 max-w-7xl mx-auto w-full section-glow relative">
          <HowItWorksPipeline />
        </section>

        {/* Analytics Preview */}
        <section className="py-24 px-4 sm:px-8 max-w-5xl mx-auto w-full">
          <div className="space-y-6">
            <SmartDashboard />
          </div>
        </section>

        {/* Problem Narrative */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
          <ProblemNarrative />
        </section>

        {/* CTA Banner */}
        <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
          <CTASection />
        </section>

        {/* Feature Cards Row */}
        <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CognitivePrecision />
            <BurnoutForecast />
            <ZenIntervention />
          </div>
        </section>

        {/* Enterprise Insights */}
        <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full section-glow relative">
          <EnterpriseInsights />
        </section>

        {/* Built For */}
        <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <BuiltFor />
        </section>

        {/* Privacy + Interventions */}
        <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="col-span-1 lg:col-span-7">
              <PrivacyShield />
            </div>
            <div className="col-span-1 lg:col-span-5">
              <Interventions />
            </div>
          </div>
        </section>

        {/* Security Breakdown */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
          <PrivacyBreakdown />
        </section>

        {/* Pricing */}
        <section className="py-24 px-4 sm:px-8 max-w-6xl mx-auto w-full">
          <PricingAccess />
        </section>

        {/* Footer */}
        <ArchitectCard />
      </div>

    </main>
  );
}
