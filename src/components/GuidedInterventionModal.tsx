"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wind,
  Coffee,
  Clock,
  CheckCircle2,
  X,
  Play,
  Pause,
  Sparkles,
  Zap,
  ShieldCheck,
  Droplets,
  Footprints,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { InterventionDecision } from "@/lib/api";

interface GuidedInterventionModalProps {
  isOpen: boolean;
  decision: InterventionDecision;
  onComplete: () => Promise<void> | void;
  onExit: () => void;
}

// ── Modality Configuration ───────────────────────────────────────────────────

interface StepInstruction {
  title: string;
  description: string;
}

interface ModalityConfig {
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeClass: string;
  glowClass: string;
  borderClass: string;
  steps: StepInstruction[];
  scientificBenefit: string;
}

const MODALITY_CONFIGS: Record<string, ModalityConfig> = {
  breathing: {
    name: "Guided Respiration",
    subtitle: "Autonomic Down-Regulation",
    icon: Wind,
    accentColor: "cyan",
    badgeClass: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
    glowClass: "shadow-[0_0_50px_rgba(6,182,212,0.25)]",
    borderClass: "border-cyan-500/30",
    steps: [
      {
        title: "Inhale Slowly (4s)",
        description: "Breathe in deeply through your nose, expanding your lower diaphragm.",
      },
      {
        title: "Hold Gently (4s)",
        description: "Hold with relaxed shoulders, letting oxygen saturate prefrontal tissues.",
      },
      {
        title: "Exhale Fully (6s)",
        description: "Release breath slowly through pursed lips, lowering sympathetic arousal.",
      },
    ],
    scientificBenefit:
      "Rhythmic diaphragmatic breathing stimulates vagal nerve activity, measurably reducing heart rate and circulating cortisol.",
  },
  micro_break: {
    name: "Micro-Break & Posture",
    subtitle: "20-20-20 Eye Rest & Spinal Relief",
    icon: Coffee,
    accentColor: "amber",
    badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    glowClass: "shadow-[0_0_50px_rgba(245,158,11,0.25)]",
    borderClass: "border-amber-500/30",
    steps: [
      {
        title: "20-20-20 Eye Rest",
        description: "Gaze at an object at least 20 feet away to relax contracted ciliary eye muscles.",
      },
      {
        title: "Cervical Neck Stretch",
        description: "Tilt your head gently towards your left shoulder for 15s, then alternate to the right.",
      },
      {
        title: "Shoulder Retraction",
        description: "Roll shoulders in wide backward arcs and open your chest to decompress upper thoracic spine.",
      },
    ],
    scientificBenefit:
      "Visual focal resets relieve ocular accommodation fatigue, preventing digital eye strain and postural headaches.",
  },
  focus_reset: {
    name: "Focus Recalibration",
    subtitle: "Attentional Deficit Recovery",
    icon: Clock,
    accentColor: "indigo",
    badgeClass: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
    glowClass: "shadow-[0_0_50px_rgba(99,102,241,0.25)]",
    borderClass: "border-indigo-500/30",
    steps: [
      {
        title: "Sensory Grounding",
        description: "Close your eyes for 30 seconds. Identify 3 distinct ambient sounds in your environment.",
      },
      {
        title: "Mental Buffer Clear",
        description: "Consciously release open browser tabs and background alerts from working memory.",
      },
      {
        title: "Singular Priority Frame",
        description: "Identify exactly ONE primary task to resume when this break concludes.",
      },
    ],
    scientificBenefit:
      "Brief mental pauses clear cognitive bottlenecking caused by rapid task switching and restore executive focus reserves.",
  },
  cognitive_recovery: {
    name: "Cognitive Friction Reset",
    subtitle: "Cadence Breakdown Recovery",
    icon: Zap,
    accentColor: "rose",
    badgeClass: "bg-rose-500/15 border-rose-500/30 text-rose-300",
    glowClass: "shadow-[0_0_50px_rgba(244,63,94,0.25)]",
    borderClass: "border-rose-500/30",
    steps: [
      {
        title: "Wrist & Finger Decompression",
        description: "Interlock your fingers and gently stretch your palms outward, flexing wrists.",
      },
      {
        title: "Frustration Neutralization",
        description: "Step your hands completely away from input devices and take 3 deep grounding breaths.",
      },
      {
        title: "Cadence Realignment",
        description: "Commit to a measured, error-free typing rhythm upon resumption rather than rushed bursts.",
      },
    ],
    scientificBenefit:
      "Physical input pauses interrupt neuromuscular tension loops and prevent cognitive fatigue compounding into error cascades.",
  },
  hydration: {
    name: "Hydration & Alignment",
    subtitle: "Cerebral Replenishment",
    icon: Droplets,
    accentColor: "emerald",
    badgeClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    glowClass: "shadow-[0_0_50px_rgba(16,185,129,0.25)]",
    borderClass: "border-emerald-500/30",
    steps: [
      {
        title: "Drink Cold Water",
        description: "Drink a full 250ml glass of fresh water to replenish fluid lost during prolonged focus.",
      },
      {
        title: "Full Body Extension",
        description: "Stand upright, reach both hands toward the ceiling, and inhale deeply while arching back.",
      },
      {
        title: "Ergonomic Check",
        description: "Ensure your elbows rest at 90 degrees and your screen is positioned at eye level.",
      },
    ],
    scientificBenefit:
      "Even mild dehydration drops executive working memory by 15%; immediate water intake restores cellular perfusion.",
  },
  walk: {
    name: "Restorative Movement",
    subtitle: "Locomotion & Screen Detachment",
    icon: Footprints,
    accentColor: "violet",
    badgeClass: "bg-violet-500/15 border-violet-500/30 text-violet-300",
    glowClass: "shadow-[0_0_50px_rgba(139,92,246,0.25)]",
    borderClass: "border-violet-500/30",
    steps: [
      {
        title: "Complete Digital Detachment",
        description: "Step away from your workstation. Leave your phone face down on your desk.",
      },
      {
        title: "Outdoor or Hallway Walk",
        description: "Walk at a natural, steady pace to circulate blood flow and mobilize joint fluid.",
      },
      {
        title: "Natural Light Exposure",
        description: "If possible, view outdoor daylight to reset circadian dopamine and serotonin levels.",
      },
    ],
    scientificBenefit:
      "Bipedal locomotion oxygenates the prefrontal cortex, releases mental tunnel vision, and resets elevated baseline stress.",
  },
};

// ── Main Modal Component ─────────────────────────────────────────────────────

export default function GuidedInterventionModal({
  isOpen,
  decision,
  onComplete,
  onExit,
}: GuidedInterventionModalProps) {
  // Authoritative duration from backend decision
  const initialDurationMins = useMemo(() => {
    return decision.recommended_duration_mins && decision.recommended_duration_mins > 0
      ? decision.recommended_duration_mins
      : 3;
  }, [decision.recommended_duration_mins]);

  const totalSeconds = initialDurationMins * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Breathing Visualizer State
  // Cycle: Inhale (4s), Hold (4s), Exhale (6s) = 14s total
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

  // Modality configuration lookup
  const modalityKey = (decision.intervention_type || "breathing").toLowerCase();
  const config = MODALITY_CONFIGS[modalityKey] || MODALITY_CONFIGS.breathing;
  const Icon = config.icon;

  // Reset state whenever a new decision opens
  useEffect(() => {
    if (isOpen) {
      setRemainingSeconds(totalSeconds);
      setIsActive(true);
      setIsCompleted(false);
      setCurrentStepIndex(0);
      setConfirmExit(false);
      setIsSubmitting(false);
    }
  }, [isOpen, totalSeconds]);

  // Main Countdown Timer
  useEffect(() => {
    if (!isOpen || !isActive || isCompleted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, isCompleted]);

  // Guided Steps Rotation (cycles through instructions based on elapsed time)
  useEffect(() => {
    if (!isOpen || !isActive || isCompleted || config.steps.length === 0) return;

    const stepInterval = Math.max(10, Math.floor(totalSeconds / config.steps.length));
    const elapsed = totalSeconds - remainingSeconds;
    const stepIdx = Math.min(config.steps.length - 1, Math.floor(elapsed / stepInterval));
    setCurrentStepIndex(stepIdx);
  }, [isOpen, isActive, isCompleted, totalSeconds, remainingSeconds, config.steps.length]);

  // Breathing Engine: 4s Inhale, 4s Hold, 6s Exhale
  useEffect(() => {
    if (!isOpen || !isActive || isCompleted || modalityKey !== "breathing") return;

    const cycleDuration = 14; // 4 + 4 + 6
    const interval = setInterval(() => {
      const elapsed = (totalSeconds - remainingSeconds) % cycleDuration;
      if (elapsed < 4) {
        setBreathPhase("inhale");
      } else if (elapsed < 8) {
        setBreathPhase("hold");
      } else {
        setBreathPhase("exhale");
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, isActive, isCompleted, modalityKey, totalSeconds, remainingSeconds]);

  // Format time as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct = totalSeconds > 0 ? Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)) : 100;

  // Handle Complete Action
  const handleFinishSession = async () => {
    setIsSubmitting(true);
    try {
      await onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto selection:bg-cyan-500/30">
        {/* Holographic Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px]" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
        </div>

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative z-10 w-full max-w-2xl bg-[#090D14]/95 backdrop-blur-3xl border ${config.borderClass} ${config.glowClass} rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden`}
        >
          {/* Sub-pixel inner highlight border */}
          <div className="absolute inset-[1px] border border-white/[0.06] rounded-[23px] pointer-events-none" />

          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
              style={{ width: `${progressPct}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${config.badgeClass} shadow-inner`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${config.badgeClass}`}>
                    {config.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    {decision.severity} SEVERITY
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    <Clock className="w-3 h-3" />
                    {initialDurationMins}m Goal
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {decision.title || config.name}
                </h2>
              </div>
            </div>

            {/* Exit Button */}
            <button
              type="button"
              onClick={() => {
                if (!isCompleted && remainingSeconds > 10) {
                  setConfirmExit(true);
                } else {
                  onExit();
                }
              }}
              className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              title="Exit Session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Agent Explainability Callout ─────────────────────────────────── */}
          {decision.reason && (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 mb-6 flex items-start gap-2.5 relative z-10">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 leading-relaxed">
                <span className="text-cyan-300 font-mono font-semibold">AI Reasoning: </span>
                {decision.reason}
              </div>
            </div>
          )}

          {/* ── Main Interactive Content Area ──────────────────────────────── */}
          <div className="relative z-10 my-6">
            {!isCompleted ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-6">
                {/* Visualizer Body */}
                {modalityKey === "breathing" ? (
                  /* ── Breathing Orb Visualizer ── */
                  <div className="relative flex flex-col items-center justify-center my-2">
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      {/* Ambient Pulse Ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-cyan-500/20 bg-cyan-500/5 blur-md"
                        animate={{
                          scale: breathPhase === "inhale" ? [1, 1.35] : breathPhase === "hold" ? 1.35 : [1.35, 1],
                        }}
                        transition={{
                          duration: breathPhase === "inhale" ? 4 : breathPhase === "hold" ? 4 : 6,
                          ease: "easeInOut",
                        }}
                      />

                      {/* Concentric Breathing Circle */}
                      <motion.div
                        className="w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-indigo-500/30 border border-cyan-400/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.35)]"
                        animate={{
                          scale: breathPhase === "inhale" ? [1, 1.25] : breathPhase === "hold" ? 1.25 : [1.25, 1],
                        }}
                        transition={{
                          duration: breathPhase === "inhale" ? 4 : breathPhase === "hold" ? 4 : 6,
                          ease: "easeInOut",
                        }}
                      >
                        <Wind className="w-6 h-6 text-cyan-300 mb-1 animate-pulse" />
                        <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                          {breathPhase}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-200/80">
                          {breathPhase === "inhale" ? "Inhale (4s)" : breathPhase === "hold" ? "Hold (4s)" : "Exhale (6s)"}
                        </span>
                      </motion.div>
                    </div>

                    {/* Rhythmic Phase Instruction */}
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium text-cyan-300">
                        {breathPhase === "inhale" && "Inhale deeply through your nose, expanding diaphragm..."}
                        {breathPhase === "hold" && "Hold breath gently with shoulders relaxed..."}
                        {breathPhase === "exhale" && "Exhale slowly through your mouth, letting tension release..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── Non-Breathing Modality Visualizer ── */
                  <div className="w-full max-w-lg space-y-4">
                    {/* Visual Pulse Orb */}
                    <div className="flex justify-center my-2">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 rounded-full border border-white/10 bg-white/5"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <div
                          className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${config.badgeClass} shadow-xl`}
                        >
                          <Icon className="w-9 h-9 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Interactive Cards */}
                    <div className="space-y-2">
                      {config.steps.map((step, idx) => {
                        const isCurrent = idx === currentStepIndex;
                        const isPast = idx < currentStepIndex;
                        return (
                          <div
                            key={step.title}
                            className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                              isCurrent
                                ? `${config.badgeClass} bg-white/[0.04]`
                                : isPast
                                ? "border-emerald-500/20 bg-emerald-500/5 text-gray-400"
                                : "border-white/5 bg-white/[0.01] text-gray-500"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                                isCurrent
                                  ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                                  : isPast
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-white/5 text-gray-500"
                              }`}
                            >
                              {isPast ? "✓" : idx + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className={`text-xs font-bold ${isCurrent ? "text-white" : isPast ? "text-gray-300" : "text-gray-400"}`}>
                                {step.title}
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Timer & Controls Bar ── */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest tabular-nums">
                      {formatTime(remainingSeconds)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
                      title={isActive ? "Pause Timer" : "Resume Timer"}
                    >
                      {isActive ? <Pause className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5 text-emerald-400" />}
                    </button>
                  </div>

                  <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                    <span>{progressPct}% Completed</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setIsCompleted(true)}
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      I&apos;m finished early
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Completion Screen ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-5"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                    Recovery Session Completed
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Cognitive Baselines Restored
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                    Great work stepping back. Your executive reserves have stabilized. Backend recovery cooldown has been initiated to protect your uninterrupted focus.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 max-w-md mx-auto text-left flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="text-gray-200 font-semibold font-mono">Physiological Impact: </span>
                    {config.scientificBenefit}
                  </p>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleFinishSession}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-mono font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? "Updating Telemetry..." : "Return to Dashboard"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          {!isCompleted && (
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-[11px] font-mono text-gray-400 relative z-10">
              <span className="italic truncate max-w-[320px]">
                {config.scientificBenefit}
              </span>

              <button
                type="button"
                onClick={() => setConfirmExit(true)}
                className="hover:text-gray-200 transition-colors cursor-pointer"
              >
                Exit Session
              </button>
            </div>
          )}

          {/* ── Early Exit Confirmation Overlay ─────────────────────────────── */}
          <AnimatePresence>
            {confirmExit && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#090D14]/95 backdrop-blur-md z-20 flex items-center justify-center p-6"
              >
                <div className="max-w-sm text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Exit Early?</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Exiting before completing the break will not record the session as completed or activate the recovery cooldown window.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmExit(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors cursor-pointer"
                    >
                      Continue Session
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmExit(false);
                        onExit();
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-mono transition-colors cursor-pointer"
                    >
                      Exit Without Saving
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
