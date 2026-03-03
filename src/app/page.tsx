import BrainCanvas from "@/components/BrainCanvas";
import HeroPulse from "@/components/HeroPulse";
import ParallaxDataStream from "@/components/ParallaxDataStream";
import PrivacyShield from "@/components/PrivacyShield";
import SmartDashboard from "@/components/SmartDashboard";
import Interventions from "@/components/Interventions";
import EnterpriseInsights from "@/components/EnterpriseInsights";
import ArchitectCard from "@/components/ArchitectCard";
import StickyHeader from "@/components/StickyHeader";
import RealTimeAnalytics from "@/components/RealTimeAnalytics";
import NeuralVisionCard from "@/components/NeuralVisionCard";
import BioSyncWidget from "@/components/BioSyncWidget";
import CognitivePrecision from "@/components/CognitivePrecision";
import ZenIntervention from "@/components/ZenIntervention";
import WorkspaceContext from "@/components/WorkspaceContext";
import BurnoutForecast from "@/components/BurnoutForecast";
import ProcessTimeline from "@/components/ProcessTimeline";
import CognitiveHistory from "@/components/CognitiveHistory";
import ProblemNarrative from "@/components/ProblemNarrative";
import CTASection from "@/components/CTASection";
import HowItWorksPipeline from "@/components/HowItWorksPipeline";
import BuiltFor from "@/components/BuiltFor";
import PrivacyBreakdown from "@/components/PrivacyBreakdown";
import PricingAccess from "@/components/PricingAccess";

export default function Home() {
  return (
    <main className="bg-black text-white relative min-h-[600vh] overflow-x-hidden selection:bg-cyan-500/30 font-sans">

      {/* HUD Sticky Navigation */}
      <StickyHeader />

      {/* Background Fixed Canvas */}
      <BrainCanvas />

      {/* Hero Pulse - Active Monitoring Ring */}
      <HeroPulse />

      {/* Floating Parallax Data Stream */}
      <ParallaxDataStream />

      {/* Real-time side panel (Visible on Desktop) */}
      <RealTimeAnalytics />

      {/* Scrollable Overlay Content */}
      <div className="relative z-10 w-full h-full pointer-events-none">

        {/* ═══════════════════════════════════════════════════════════════════
            HERO SECTION — scroll-snap target
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          data-snap-section
          className="h-screen flex flex-col items-center justify-center pointer-events-auto px-4 relative z-20"
        >
          <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-800 mb-6 drop-shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center leading-none">
            CogniGuard
          </h1>
          <p className="mt-4 text-xl sm:text-2xl md:text-3xl text-cyan-400 font-mono tracking-[0.1em] text-center uppercase font-light drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] max-w-4xl mx-auto">
            A Privacy-First Platform for Cognitive Load &amp; Burnout Detection
          </p>
          <div className="mt-16 animate-bounce">
            <p className="text-gray-500 text-xs font-mono tracking-widest uppercase mb-4 text-center">System Online &bull; Scroll to Initialize</p>
            <div className="w-px h-16 bg-gradient-to-b from-cyan-500/80 to-transparent mx-auto" />
          </div>
        </section>

        {/* Process Timeline Sidebar */}
        <ProcessTimeline />

        {/* ═══════════════════════════════════════════════════════════════════
            CONTROL CENTER — Responsive 3-column grid
            sm: stacked vertically, lg: 3-col (widgets | brain | widgets)
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          data-snap-section
          className="min-h-screen relative pointer-events-auto max-w-7xl mx-auto w-full px-4 sm:px-8 py-[10vh]"
        >
          {/* Mobile: stack cards first, then brain spacer, then right cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full items-center">

            {/* Left column — depth: near */}
            <div className="col-span-1 lg:col-span-3 space-y-6 flex flex-col justify-center lg:[transform:translateZ(60px)] lg:z-[22]">
              <NeuralVisionCard />
              <BioSyncWidget />
              <WorkspaceContext />
            </div>

            {/* Center column — brain canvas viewport (empty on mobile, spacer on desktop) */}
            <div className="hidden lg:flex lg:col-span-6 h-[50vh] items-center justify-center pointer-events-none" />

            {/* Right column — depth: mid */}
            <div className="col-span-1 lg:col-span-3 space-y-6 flex flex-col justify-center lg:[transform:translateZ(30px)] lg:z-[21]">
              <CognitivePrecision />
              <BurnoutForecast />
              <ZenIntervention />
            </div>
          </div>
        </section>

        {/* Problem Narrative + CTA */}
        <div className="pointer-events-auto mt-[20vh]">
          <ProblemNarrative />
          <CTASection />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FEATURE DASHBOARD — scroll-snap target
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-[20vh] py-[10vh] px-4 sm:px-8 max-w-7xl mx-auto w-full pointer-events-auto">

          {/* How It Works Pipeline */}
          <section data-snap-section>
            <HowItWorksPipeline />
          </section>

          {/* Burnout Dashboard */}
          <section data-snap-section className="w-full max-w-4xl mx-auto space-y-8">
            <SmartDashboard />
            <CognitiveHistory />
          </section>

          {/* Enterprise Insights */}
          <section data-snap-section className="w-full">
            <EnterpriseInsights />
          </section>

          {/* Built For */}
          <section data-snap-section>
            <BuiltFor />
          </section>

          {/* Privacy & Interventions */}
          <section data-snap-section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="col-span-1 lg:col-span-7">
              <PrivacyShield />
            </div>
            <div className="col-span-1 lg:col-span-5">
              <Interventions />
            </div>
          </section>

          {/* Security Breakdown */}
          <section data-snap-section>
            <PrivacyBreakdown />
          </section>

          {/* Pricing */}
          <section data-snap-section>
            <PricingAccess />
          </section>

        </div>

        {/* Footer Architect Signature */}
        <div className="min-h-[60vh] flex items-end justify-center pointer-events-auto pb-20 relative z-20 px-4">
          <ArchitectCard />
        </div>

      </div>
    </main>
  );
}
