"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Pause, Play, Check, Compass } from "lucide-react";
import type { BreathingState } from "@/components/RecoveryEnvironment3D";
import type { TimerStatus } from "./useRecoveryTimer";

interface RecoveryBreathingIndicatorProps {
  phase: BreathingState;
  phaseRemaining: number;
  status: TimerStatus;
  isBreathingActivity?: boolean;
  activeStepTitle?: string;
  stepRemainingSeconds?: number;
  currentStepIndex?: number;
  totalSteps?: number;
  reduced?: boolean;
  onTogglePause?: () => void;
}

/**
 * RecoveryBreathingIndicator
 *
 * Primary bottom-center interactive breathing & guidance indicator matching
 * the cinematic reference design.
 *
 * CRITICAL INTERACTION REQUIREMENT:
 * Shows ONLY the CURRENT breathing phase:
 *   INHALE: INHALE · 4s · [live countdown]
 *   HOLD:   HOLD   · 4s · [live countdown]
 *   EXHALE: EXHALE · 4s · [live countdown]
 *
 * Cadence: 4s / 4s / 4s synchronized with useRecoveryTimer.
 *
 * Zero Stale Information Guarantee:
 * Paused, completed, and aborted states clearly display their respective states
 * without lingering or misleading countdowns or phase cues.
 */
export default function RecoveryBreathingIndicator({
  phase,
  phaseRemaining,
  status,
  isBreathingActivity = true,
  activeStepTitle,
  stepRemainingSeconds,
  currentStepIndex = 0,
  totalSteps = 1,
  reduced = false,
  onTogglePause,
}: RecoveryBreathingIndicatorProps) {
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isCompleted = status === "completed";
  const isAborted = status === "aborted";

  // Breathing phase resolution: only active during running/paused
  const activePhase: BreathingState =
    !isBreathingActivity
      ? "idle"
      : isCompleted || isAborted
      ? "idle"
      : !isRunning && !isPaused
      ? "idle"
      : phase === "idle"
      ? "inhale"
      : phase;

  const currentSeconds = isBreathingActivity
    ? Math.max(1, phaseRemaining || 4)
    : Math.max(1, stepRemainingSeconds ?? 4);

  // SVG Circular progress computation for 4s cadence
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  // Progress fraction: 1 at start of phase, 0 at end of phase
  const fraction = isCompleted ? 1 : isRunning ? currentSeconds / 4 : 1;
  const strokeDashoffset = circumference * (1 - fraction);

  // Colors based on current active phase or status
  const phaseColors = {
    inhale: {
      primary: "#84BD90",
      secondary: "rgba(132, 189, 144, 0.16)",
      border: "rgba(132, 189, 144, 0.45)",
      glow: "0 0 24px rgba(132, 189, 144, 0.35)",
      subtext: "Expand chest & belly",
    },
    hold: {
      primary: "#E6A756",
      secondary: "rgba(230, 167, 86, 0.16)",
      border: "rgba(230, 167, 86, 0.45)",
      glow: "0 0 24px rgba(230, 167, 86, 0.35)",
      subtext: "Hold gently & be still",
    },
    exhale: {
      primary: "#5E966A",
      secondary: "rgba(94, 150, 106, 0.16)",
      border: "rgba(94, 150, 106, 0.4)",
      glow: "0 0 24px rgba(94, 150, 106, 0.3)",
      subtext: "Release slowly & let go",
    },
    idle: {
      primary: "#84BD90",
      secondary: "rgba(132, 189, 144, 0.1)",
      border: "rgba(132, 189, 144, 0.25)",
      glow: "none",
      subtext: isCompleted
        ? "Recovery complete"
        : isPaused
        ? "Tap to resume"
        : isAborted
        ? "Session ended"
        : "Tap to begin",
    },
  };

  const activeColor =
    isCompleted
      ? {
          primary: "#84BD90",
          secondary: "rgba(132, 189, 144, 0.2)",
          border: "rgba(132, 189, 144, 0.5)",
          glow: "0 0 24px rgba(132, 189, 144, 0.3)",
          subtext: "Recovery complete",
        }
      : isPaused
      ? {
          primary: "#E6A756",
          secondary: "rgba(230, 167, 86, 0.2)",
          border: "rgba(230, 167, 86, 0.5)",
          glow: "0 0 20px rgba(230, 167, 86, 0.3)",
          subtext: "Tap to resume",
        }
      : isAborted
      ? {
          primary: "#A8BAA5",
          secondary: "rgba(168, 186, 165, 0.1)",
          border: "rgba(168, 186, 165, 0.25)",
          glow: "none",
          subtext: "Session ended",
        }
      : phaseColors[activePhase] || phaseColors.inhale;

  // Formatted countdown label inside the progress circle
  const centerDisplay = isCompleted ? (
    <Check className="w-5 h-5 text-[#84BD90]" aria-hidden="true" />
  ) : isPaused ? (
    <span className="text-xs font-mono font-bold tracking-widest text-[#E6A756]">
      PAUSE
    </span>
  ) : isAborted ? (
    <span className="text-base font-mono font-bold text-[#A8BAA5]">—</span>
  ) : !isRunning ? (
    <span className="text-xl font-mono font-bold text-[#EFF5EC]">4</span>
  ) : (
    <span className="text-2xl font-mono font-bold text-[#EFF5EC]">
      {currentSeconds}
    </span>
  );

  // Phase Title text: Never stale
  const phaseLabel = isCompleted
    ? "COMPLETE"
    : isPaused
    ? "PAUSED"
    : isAborted
    ? "STOPPED"
    : !isRunning
    ? "READY"
    : isBreathingActivity
    ? activePhase.toUpperCase()
    : `STEP ${currentStepIndex + 1}`;

  // Timing/Cadence sub-label
  const timingLabel = isCompleted
    ? "Finished"
    : isPaused
    ? "4s cadence"
    : isAborted
    ? "Exited"
    : isBreathingActivity
    ? "4s"
    : activeStepTitle || `${totalSteps} Steps`;

  // Focus cue text
  const focusCueText = isCompleted
    ? "Session finished"
    : isPaused
    ? "Tap to resume"
    : isAborted
    ? "Exited early"
    : !isRunning
    ? "Tap to begin"
    : isBreathingActivity
    ? activeColor.subtext
    : activeStepTitle || "Follow rhythm";

  // Screen reader announcement: Announces phase transitions without second-by-second spam
  const srAnnouncement = useMemo(() => {
    if (isCompleted) return "Recovery session completed.";
    if (isPaused) return "Recovery session paused.";
    if (isAborted) return "Recovery session stopped.";
    if (!isRunning) return "Recovery session ready to begin.";
    if (isBreathingActivity) {
      if (activePhase === "inhale") return "Breathing phase: Inhale for four seconds. Expand chest and belly.";
      if (activePhase === "hold") return "Breathing phase: Hold for four seconds. Be still.";
      if (activePhase === "exhale") return "Breathing phase: Exhale for four seconds. Release slowly.";
    }
    return `Step ${currentStepIndex + 1}: ${activeStepTitle || "Follow rhythm"}`;
  }, [isCompleted, isPaused, isAborted, isRunning, isBreathingActivity, activePhase, currentStepIndex, activeStepTitle]);

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-4 sm:gap-6 px-5 sm:px-7 py-3 rounded-full backdrop-blur-2xl transition-all duration-500 select-none ${
        onTogglePause ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B130E]" : ""
      }`}
      style={{
        background: "rgba(11, 19, 14, 0.88)",
        border: `1px solid ${activeColor.border}`,
        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      }}
      onClick={onTogglePause}
      onKeyDown={(e) => {
        if (onTogglePause && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onTogglePause();
        }
      }}
      role={onTogglePause ? "button" : "region"}
      tabIndex={onTogglePause ? 0 : undefined}
      aria-label={
        isCompleted
          ? "Recovery session completed."
          : isPaused
          ? "Recovery session paused. Click or press Enter to resume."
          : isRunning && isBreathingActivity
          ? `Current breathing phase: ${activePhase.toUpperCase()}, ${currentSeconds} seconds remaining.`
          : isRunning
          ? `Current step: ${activeStepTitle || `Step ${currentStepIndex + 1}`}, ${currentSeconds} seconds remaining.`
          : "Recovery session ready. Click or press Enter to start."
      }
    >
      {/* Screen Reader Live Region: Polished and silent between phase changes */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </span>

      {/* ── Left: Current Active Phase / Step Title ONLY ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: activeColor.secondary,
            color: activeColor.primary,
          }}
          aria-hidden="true"
        >
          {isCompleted ? (
            <Check className="w-5 h-5 text-[#84BD90]" />
          ) : isPaused ? (
            <Pause className="w-5 h-5 text-[#E6A756]" />
          ) : isBreathingActivity ? (
            <Wind className={`w-5 h-5 ${isRunning ? "animate-pulse" : ""}`} />
          ) : (
            <Compass className="w-5 h-5" />
          )}
        </div>

        <div className="flex flex-col text-left min-w-[70px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={phaseLabel}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] transition-colors duration-300"
              style={{
                color: activeColor.primary,
                textShadow: isRunning ? activeColor.glow : "none",
              }}
            >
              {phaseLabel}
            </motion.span>
          </AnimatePresence>

          <span className="text-[11px] font-mono text-[#A8BAA5] mt-0.5">
            {timingLabel}
          </span>
        </div>
      </div>

      {/* ── Center: Circular Progress Ring & Live Countdown ── */}
      <div
        className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 shrink-0"
        aria-hidden="true"
      >
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
          {/* Background Track */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3.5"
          />
          {/* Animated Glowing Progress Ring */}
          <motion.circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke={activeColor.primary}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transition={reduced ? { duration: 0 } : { duration: 0.25, ease: "linear" }}
            style={{
              filter: isRunning ? `drop-shadow(${activeColor.glow})` : "none",
            }}
          />
        </svg>

        {/* Live Countdown in Ring Center */}
        <div className="absolute inset-0 flex items-center justify-center select-none">
          {centerDisplay}
        </div>
      </div>

      {/* ── Right: Active Guidance Subtext / Cue ONLY ── */}
      <div className="hidden sm:flex flex-col text-left pl-1 pr-2 max-w-[130px]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#A8BAA5]">
          {isBreathingActivity ? "Rhythm" : "Focus Cue"}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={focusCueText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-[#EFF5EC] font-medium truncate"
          >
            {focusCueText}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
