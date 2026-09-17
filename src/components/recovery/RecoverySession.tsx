"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getApiUrl } from "@/lib/api";
import {
  startRecoverySession,
  completeRecoverySession,
  abortRecoverySession,
} from "@/lib/recoveryApi";
import type { RecoverySessionRecordDTO } from "@/types/recovery";
import {
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Video,
  RotateCcw,
  Play,
  Pause,
  Check,
  Wind,
  Eye,
  Leaf,
  Target,
  Heart,
  Brain,
  Sun,
  Clock,
} from "lucide-react";
import type { RecoveryActivityModel, GuidedContent } from "@/types/recovery";
import type { BreathingState } from "@/components/RecoveryEnvironment3D";
import RecoverySessionHeader from "./RecoverySessionHeader";
import RecoveryGuidance from "./RecoveryGuidance";
import RecoveryProgress from "./RecoveryProgress";
import RecoverySessionActions from "./RecoverySessionActions";
import RecoveryAbortModal from "./RecoveryAbortModal";
import RecoveryBreathingIndicator from "./RecoveryBreathingIndicator";
import GuidedYouTubePlayer from "./GuidedYouTubePlayer";
import { useRecoveryTimer } from "./useRecoveryTimer";
import { computeActiveGuidance } from "./guidanceEngine";

// Dynamic import of 3D scene (WebGL client-only)
const RecoveryEnvironment3D = dynamic(
  () => import("../RecoveryEnvironment3D"),
  { ssr: false, loading: () => null }
);

export type RecoverySessionMode = "sanctuary" | "guided-content";

interface RecoverySessionProps {
  activity: RecoveryActivityModel;
  onExit: () => void;
  onComplete?: () => void;
  guidedContent?: GuidedContent | null;
  initialMode?: RecoverySessionMode;
  onSessionRecordSaved?: () => void;
}

/**
 * RecoverySession
 *
 * Cinematic natural sanctuary session matching the primary visual reference:
 * - Top: Clean brand header & subtitle + "Take a break · Reset · Be present" pill
 * - Left Glass Panel:
 *     BREATHING SESSION
 *     Pause. Breathe. Be Present.
 *     Description & 3 compact benefit cards
 *     Script accent: "Small pauses create big progress."
 * - Center Hero:
 *     Reflective dark/green orb on stone platform with glowing amber ring
 *     Bottom-center breathing indicator showing ONLY the current breathing phase
 *     with 4s cadence & live countdown
 * - Right Glass Panel:
 *     Quote card ("A small pause can make a big difference.")
 *     PAUSE, RESET, CONTINUE interactive action cards
 * - Bottom Bar:
 *     COGNITOSHIELD + BREATHE · FOCUS · THRIVE
 * - Seamless integration with existing timer authority, guidance engine, and YouTube companion.
 */
export default function RecoverySession({
  activity,
  onExit,
  onComplete,
  guidedContent,
  initialMode,
  onSessionRecordSaved,
}: RecoverySessionProps) {
  const shouldReduce = useReducedMotion() ?? false;
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [manualBreathingState, setManualBreathingState] = useState<BreathingState | null>(null);
  const [manualStepOverride, setManualStepOverride] = useState<number | null>(null);
  const [showDetailedGuidance, setShowDetailedGuidance] = useState(false);

  // Session presentation mode ("sanctuary" by default; user can enter "guided-content" when guidedContent exists)
  const [sessionMode, setSessionMode] = useState<RecoverySessionMode>(
    initialMode ?? "sanctuary"
  );
  const [confirmingReset, setConfirmingReset] = useState(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const durationSeconds = (activity.durationMinutes || 3) * 60;
  const isBreathingActivity = activity.type === "breathing";

  // Persistent Tracking State Refs
  const activeSessionIdRef = useRef<number | null>(null);
  const startPromiseRef = useRef<Promise<RecoverySessionRecordDTO | null> | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const elapsedSecondsRef = useRef<number>(0);
  const prevActivityIdRef = useRef<string>(activity.id);

  // Handlers for completing / aborting the active tracking record
  const handleSessionComplete = useCallback(
    async (finalElapsed: number) => {
      let sessId = activeSessionIdRef.current;
      if (!sessId && startPromiseRef.current) {
        const rec = await startPromiseRef.current;
        sessId = rec?.id ?? null;
      }
      if (sessId) {
        activeSessionIdRef.current = null;
        try {
          await completeRecoverySession(sessId, {
            elapsed_duration_seconds: Math.round(finalElapsed),
            completion_reason: "natural_completion",
          });
          onSessionRecordSaved?.();
        } catch (e) {
          console.warn("[RecoverySession] Failed to persist completion:", e);
        }
      }
      if (onComplete) onComplete();
    },
    [onComplete, onSessionRecordSaved]
  );

  const handleSessionAbort = useCallback(
    async (finalElapsed: number, reason: string = "user_aborted") => {
      let sessId = activeSessionIdRef.current;
      if (!sessId && startPromiseRef.current) {
        const rec = await startPromiseRef.current;
        sessId = rec?.id ?? null;
      }
      if (sessId) {
        activeSessionIdRef.current = null;
        try {
          await abortRecoverySession(sessId, {
            elapsed_duration_seconds: Math.round(finalElapsed),
            completion_reason: reason,
          });
          onSessionRecordSaved?.();
        } catch (e) {
          console.warn("[RecoverySession] Failed to persist abort:", e);
        }
      }
    },
    [onSessionRecordSaved]
  );

  // Reusable Universal Timer (source of truth for session time)
  const timer = useRecoveryTimer({
    durationSeconds,
    onComplete: (actualElapsed) => {
      handleSessionComplete(actualElapsed);
    },
    onAbort: (actualElapsed) => {
      handleSessionAbort(actualElapsed, "user_aborted");
    },
  });

  elapsedSecondsRef.current = timer.elapsedSeconds;

  // Session start tracking: create record only when timer actually transitions to running
  useEffect(() => {
    if (timer.status === "running" && !activeSessionIdRef.current && !isStartingRef.current) {
      isStartingRef.current = true;
      const promise = startRecoverySession({
        activity_id: activity.id,
        activity_type: activity.type,
        activity_title: activity.title,
        guided_content_id: guidedContent?.id ?? null,
        video_id: guidedContent?.videoId ?? null,
        planned_duration_seconds: durationSeconds,
      });
      startPromiseRef.current = promise;
      promise
        .then((rec) => {
          if (rec) {
            activeSessionIdRef.current = rec.id;
          }
        })
        .catch((err) => {
          console.warn("[RecoverySession] Failed to start tracking record:", err);
        })
        .finally(() => {
          isStartingRef.current = false;
        });
    }
  }, [timer.status, activity, guidedContent, durationSeconds]);

  // Handle activity changes gracefully if a session was running
  useEffect(() => {
    if (prevActivityIdRef.current !== activity.id) {
      if (activeSessionIdRef.current) {
        const prevId = activeSessionIdRef.current;
        activeSessionIdRef.current = null;
        abortRecoverySession(prevId, {
          elapsed_duration_seconds: Math.round(elapsedSecondsRef.current),
          completion_reason: "activity_switched",
        }).then(() => onSessionRecordSaved?.());
      }
      prevActivityIdRef.current = activity.id;
    }
  }, [activity.id, onSessionRecordSaved]);

  // Safe cleanup on unmount / navigation away / refresh
  useEffect(() => {
    return () => {
      const sessId = activeSessionIdRef.current;
      if (sessId) {
        activeSessionIdRef.current = null;
        const elapsed = Math.round(elapsedSecondsRef.current);
        const apiURL = getApiUrl();
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        try {
          fetch(`${apiURL}/recovery/sessions/${sessId}/abort`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              elapsed_duration_seconds: elapsed,
              completion_reason: "navigation_away",
            }),
            keepalive: true,
          }).catch(() => {});
        } catch (_) {}
      }
    };
  }, []);

  // Handle Reset without creating duplicate records
  const handleReset = useCallback(async () => {
    if (timer.status === "running" || timer.status === "paused") {
      await handleSessionAbort(timer.elapsedSeconds, "reset");
    }
    timer.reset();
  }, [timer, handleSessionAbort]);

  // Two-step safe reset to prevent accidental misclicks on running sessions
  const handleResetClick = useCallback(() => {
    if ((timer.status === "running" || timer.status === "paused") && timer.elapsedSeconds > 10) {
      if (!confirmingReset) {
        setConfirmingReset(true);
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => setConfirmingReset(false), 4000);
        return;
      }
    }
    setConfirmingReset(false);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    handleReset();
  }, [timer.status, timer.elapsedSeconds, confirmingReset, handleReset]);

  // Deterministic guidance calculation driven by the universal timer's elapsed seconds
  const guidanceState = computeActiveGuidance(
    activity.instructions,
    timer.elapsedSeconds,
    durationSeconds
  );

  // When timer runs, clear manual step override so guidance advances automatically
  useEffect(() => {
    if (timer.status === "running") {
      setManualStepOverride(null);
    }
  }, [timer.status, guidanceState.currentStepIndex]);

  const activeStepIndex = manualStepOverride ?? guidanceState.currentStepIndex;

  // Determine active breathing state for the 3D orb
  const effectiveBreathingState: BreathingState =
    manualBreathingState ??
    (timer.status === "running" && isBreathingActivity
      ? timer.breathingPhase
      : timer.status === "paused" && isBreathingActivity
      ? "hold"
      : activity.breathingState || "idle");

  // Handle Exit request (checking whether to prompt for early exit abort)
  const handleRequestExit = useCallback(() => {
    if (timer.status === "running" || timer.status === "paused") {
      timer.pause();
      setShowAbortModal(true);
    } else {
      onExit();
    }
  }, [timer, onExit]);

  // Confirm early abort
  const handleConfirmAbort = () => {
    setShowAbortModal(false);
    timer.abort();
    onExit();
  };

  // Cancel abort dialog and resume timer
  const handleCancelAbort = () => {
    setShowAbortModal(false);
    timer.resume();
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showAbortModal) {
          handleCancelAbort();
        } else {
          handleRequestExit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAbortModal, handleRequestExit]);

  // Manual completion trigger
  const handleManualComplete = () => {
    timer.complete();
  };

  const totalSteps = activity.instructions?.length || 1;

  return (
    <motion.section
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
      animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full py-2 space-y-5 select-none"
      aria-label={`Active Recovery Session: ${activity.title}`}
    >
      {/* ── Top Header Bar ── */}
      <RecoverySessionHeader
        activity={activity}
        onExit={handleRequestExit}
        statusLabel={
          timer.status === "completed"
            ? "Session Completed"
            : timer.status === "running"
            ? "Timer Running"
            : timer.status === "paused"
            ? "Timer Paused"
            : timer.status === "aborted"
            ? "Session Aborted"
            : "Ready"
        }
      />

      {/* Completion Banner (shown when session completes) */}
      {timer.status === "completed" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-8 text-center space-y-4 backdrop-blur-xl"
          style={{
            background: "rgba(18, 28, 22, 0.85)",
            border: "1px solid var(--rc-sage)",
            boxShadow: "var(--rc-shadow-card)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
            style={{
              background: "rgba(94, 150, 106, 0.2)",
              color: "var(--rc-sage-light)",
            }}
          >
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--rc-text-primary)" }}
            >
              Session Complete
            </h2>
            <p
              className="text-sm max-w-md mx-auto leading-relaxed"
              style={{ color: "var(--rc-text-secondary)" }}
            >
              You completed your <strong className="font-semibold text-[#EFF5EC]">{activity.title}</strong> session ({activity.duration}). Take a calm moment before returning to focused work.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A]"
              style={{
                background: "var(--rc-moss)",
                color: "var(--rc-text-inverse)",
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Recovery Center</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Main 3-Column Cinematic Sanctuary Composition ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        {/* ── Left Column: Large Glass Panel with Typography & Benefits ── */}
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-3 space-y-4 flex flex-col order-2 lg:order-1 min-w-0"
        >
          <div
            className="rounded-3xl p-6 sm:p-7 backdrop-blur-2xl space-y-5 transition-all duration-300"
            style={{
              background: "rgba(15, 25, 19, 0.72)",
              border: "1px solid rgba(132, 189, 144, 0.18)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Eyebrow */}
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.24em] block"
              style={{ color: "#84BD90" }}
            >
              {isBreathingActivity ? "BREATHING SESSION" : activity.title.toUpperCase()}
            </span>

            {/* Hero Headline from Reference */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] text-[#EFF5EC]">
              Pause.<br />
              <span className="text-[#84BD90]">Breathe.</span><br />
              Be Present.
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-[13px] leading-relaxed text-[#A8BAA5]">
              {activity.description || "A few mindful breaths can help you feel more focused, calm, and refreshed."}
            </p>

            {/* 3 Compact Benefit Cards */}
            <div className="space-y-2.5 pt-1">
              {/* Card 1: Reduce Stress */}
              <div
                className="rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(132, 189, 144, 0.12)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(94, 150, 106, 0.2)",
                    color: "#84BD90",
                  }}
                >
                  <Leaf className="w-4 h-4 text-[#84BD90]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#EFF5EC]">Reduce stress</h4>
                  <p className="text-[11px] text-[#A8BAA5]">Calm your mind</p>
                </div>
              </div>

              {/* Card 2: Improve Focus */}
              <div
                className="rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(132, 189, 144, 0.12)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(62, 114, 68, 0.2)",
                    color: "#84BD90",
                  }}
                >
                  <Target className="w-4 h-4 text-[#84BD90]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#EFF5EC]">Improve focus</h4>
                  <p className="text-[11px] text-[#A8BAA5]">Be more productive</p>
                </div>
              </div>

              {/* Card 3: Build Clarity */}
              <div
                className="rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(132, 189, 144, 0.12)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(230, 167, 86, 0.2)",
                    color: "#E6A756",
                  }}
                >
                  <Brain className="w-4 h-4 text-[#E6A756]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#EFF5EC]">Build clarity</h4>
                  <p className="text-[11px] text-[#A8BAA5]">Return with a fresh mind</p>
                </div>
              </div>
            </div>

            {/* Elegant Script Flourish from Reference */}
            <p className="font-serif italic text-sm text-[#84BD90]/80 pt-1 select-none">
              Small pauses create big progress.
            </p>
          </div>
        </motion.div>

        {/* ── Center Column: 3D Orb Hero Scene + Bottom-Center Breathing Indicator ── */}
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 space-y-3 flex flex-col items-center order-1 lg:order-2 min-w-0"
        >
          {/* Mode Switcher when Guided YouTube Content is available */}
          {guidedContent ? (
            <div
              role="tablist"
              aria-label="Recovery presentation mode"
              className="w-full flex items-center justify-between gap-2 p-1.5 rounded-2xl backdrop-blur-md"
              style={{
                background: "rgba(15, 25, 19, 0.72)",
                border: "1px solid rgba(132, 189, 144, 0.18)",
              }}
            >
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  role="tab"
                  id="tab-sanctuary"
                  aria-selected={sessionMode === "sanctuary"}
                  aria-controls="panel-sanctuary"
                  onClick={() => setSessionMode("sanctuary")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A] ${
                    sessionMode === "sanctuary" ? "shadow-sm" : "hover:bg-white/5"
                  }`}
                  style={{
                    background: sessionMode === "sanctuary" ? "var(--rc-moss)" : "transparent",
                    color: sessionMode === "sanctuary" ? "var(--rc-text-inverse)" : "var(--rc-text-secondary)",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3D Sanctuary</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-guided-content"
                  aria-selected={sessionMode === "guided-content"}
                  aria-controls="panel-guided-content"
                  onClick={() => setSessionMode("guided-content")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A] ${
                    sessionMode === "guided-content" ? "shadow-sm" : "hover:bg-white/5"
                  }`}
                  style={{
                    background: sessionMode === "guided-content" ? "var(--rc-moss)" : "transparent",
                    color: sessionMode === "guided-content" ? "var(--rc-text-inverse)" : "var(--rc-text-secondary)",
                  }}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Companion</span>
                </button>
              </div>

              <span className="text-[11px] italic pr-2 hidden sm:inline text-[#7D927E]">
                {sessionMode === "guided-content" ? "Follow along" : "Immersed"}
              </span>
            </div>
          ) : null}

          {/* Center Visual Presentation: 3D Orb or YouTube Video */}
          <div className="w-full flex flex-col items-center">
            <AnimatePresence mode="wait">
              {sessionMode === "guided-content" && guidedContent ? (
                <motion.div
                  key="panel-guided-content"
                  id="panel-guided-content"
                  role="tabpanel"
                  aria-labelledby="tab-guided-content"
                  initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="w-full space-y-4"
                >
                  <GuidedYouTubePlayer
                    content={guidedContent}
                    onSwitchToSanctuary={() => setSessionMode("sanctuary")}
                    className="w-full"
                  />
                  <div className="relative rounded-3xl overflow-hidden h-[240px]">
                    <RecoveryEnvironment3D
                      breathingState={effectiveBreathingState}
                      height="100%"
                      className="w-full h-full"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="panel-sanctuary"
                  id="panel-sanctuary"
                  role="tabpanel"
                  aria-labelledby="tab-sanctuary"
                  initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex flex-col items-center space-y-3"
                >
                  {/* Hero 3D Orb Container */}
                  <div className="w-full relative rounded-3xl overflow-hidden">
                    <RecoveryEnvironment3D
                      breathingState={effectiveBreathingState}
                      height="360px"
                      className="w-full"
                    />
                  </div>

                  {/* Critical Bottom-Center Breathing Indicator showing ONLY Current Phase with 4s Cadence */}
                  <div className="w-full flex justify-center pt-1">
                    <RecoveryBreathingIndicator
                      phase={effectiveBreathingState}
                      phaseRemaining={timer.breathingPhaseRemaining}
                      status={timer.status}
                      isBreathingActivity={isBreathingActivity}
                      activeStepTitle={guidanceState.currentStep?.title}
                      stepRemainingSeconds={guidanceState.stepRemainingSeconds}
                      currentStepIndex={activeStepIndex}
                      totalSteps={totalSteps}
                      reduced={shouldReduce}
                      onTogglePause={() => {
                        if (timer.status === "running") timer.pause();
                        else if (timer.status === "paused") timer.resume();
                        else timer.start();
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Right Column: Quote Card & PAUSE / RESET / CONTINUE Action Cards ── */}
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-3 space-y-4 flex flex-col order-3 min-w-0"
        >
          {/* Top Quote Card matching reference */}
          <div
            className="rounded-3xl p-5 sm:p-6 backdrop-blur-2xl space-y-2 transition-all duration-300"
            style={{
              background: "rgba(15, 25, 19, 0.72)",
              border: "1px solid rgba(132, 189, 144, 0.18)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            <span className="text-4xl leading-none text-[#84BD90] font-serif select-none block">“</span>
            <p className="text-xs sm:text-[13px] italic text-[#EFF5EC] leading-relaxed">
              A small pause can make a big difference.”
            </p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7D927E] block pt-2">
              — CognitoShield
            </span>
          </div>

          {/* 3 Interactive Context / Action Cards matching reference */}
          <div className="space-y-2.5">
            {/* Action Card 1: PAUSE */}
            <button
              type="button"
              onClick={timer.status === "running" ? timer.pause : timer.resume}
              aria-label={timer.status === "running" ? "Pause recovery session timer" : "Resume recovery session timer"}
              aria-pressed={timer.status === "paused"}
              className="w-full rounded-2xl p-3.5 flex items-center gap-3.5 backdrop-blur-xl transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1913]"
              style={{
                background: timer.status === "paused"
                  ? "rgba(230, 167, 86, 0.14)"
                  : "rgba(15, 25, 19, 0.72)",
                border: timer.status === "paused"
                  ? "1px solid rgba(230, 167, 86, 0.4)"
                  : "1px solid rgba(132, 189, 144, 0.18)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: timer.status === "paused" ? "rgba(230, 167, 86, 0.25)" : "rgba(94, 150, 106, 0.2)",
                  color: timer.status === "paused" ? "#E6A756" : "#84BD90",
                }}
              >
                {timer.status === "running" ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Leaf className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#EFF5EC]">
                    {timer.status === "paused" ? "PAUSED" : "PAUSE"}
                  </h4>
                  {timer.status === "paused" && (
                    <span className="text-[10px] font-mono text-[#E6A756] font-bold">ACTIVE</span>
                  )}
                </div>
                <p className="text-[11px] text-[#A8BAA5] mt-0.5">
                  {timer.status === "paused" ? "Click to resume session" : "Give your mind a break"}
                </p>
              </div>
            </button>

            {/* Action Card 2: RESET (Protected against accidental destruction) */}
            <button
              type="button"
              onClick={handleResetClick}
              aria-label={confirmingReset ? "Confirm reset and restart session" : "Reset session"}
              className="w-full rounded-2xl p-3.5 flex items-center gap-3.5 backdrop-blur-xl transition-all duration-200 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1913]"
              style={{
                background: confirmingReset ? "rgba(230, 167, 86, 0.15)" : "rgba(15, 25, 19, 0.72)",
                border: confirmingReset ? "1px solid rgba(230, 167, 86, 0.45)" : "1px solid rgba(132, 189, 144, 0.18)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: confirmingReset ? "rgba(230, 167, 86, 0.25)" : "rgba(62, 114, 68, 0.2)",
                  color: confirmingReset ? "#E6A756" : "#84BD90",
                }}
              >
                <Target className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#EFF5EC]">
                    {confirmingReset ? "CONFIRM RESET?" : "RESET"}
                  </h4>
                  {confirmingReset && (
                    <span className="text-[10px] font-mono text-[#E6A756] font-bold">CLICK AGAIN</span>
                  )}
                </div>
                <p className="text-[11px] text-[#A8BAA5] mt-0.5">
                  {confirmingReset ? "Click to confirm session restart" : "Return with fresh focus"}
                </p>
              </div>
            </button>

            {/* Action Card 3: CONTINUE / BEGIN */}
            <button
              type="button"
              onClick={() => {
                if (timer.status === "running") {
                  handleManualComplete();
                } else if (timer.status === "paused") {
                  timer.resume();
                } else {
                  timer.start();
                }
              }}
              aria-label={
                timer.status === "running"
                  ? "Complete recovery session now"
                  : timer.status === "paused"
                  ? "Resume recovery session"
                  : "Start recovery session"
              }
              className="w-full rounded-2xl p-3.5 flex items-center gap-3.5 backdrop-blur-xl transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1913]"
              style={{
                background: timer.status === "running"
                  ? "rgba(94, 150, 106, 0.22)"
                  : "rgba(15, 25, 19, 0.72)",
                border: timer.status === "running"
                  ? "1px solid rgba(132, 189, 144, 0.4)"
                  : "1px solid rgba(132, 189, 144, 0.18)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: timer.status === "running" ? "rgba(94, 150, 106, 0.35)" : "rgba(230, 167, 86, 0.2)",
                  color: timer.status === "running" ? "#84BD90" : "#E6A756",
                }}
              >
                {timer.status === "running" ? (
                  <Play className="w-4 h-4 fill-current" />
                ) : (
                  <Heart className="w-4 h-4 fill-current text-[#E6A756]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#EFF5EC]">
                    {timer.status === "running" ? "IN FLOW" : timer.status === "paused" ? "CONTINUE" : "CONTINUE"}
                  </h4>
                  {timer.status === "running" && (
                    <span className="text-[10px] font-mono text-[#84BD90] font-bold animate-pulse">4s CADENCE</span>
                  )}
                </div>
                <p className="text-[11px] text-[#A8BAA5] mt-0.5">A calmer, clearer you</p>
              </div>
            </button>
          </div>

          {/* Toggle for Step Guidance / Overview */}
          <button
            type="button"
            onClick={() => setShowDetailedGuidance(!showDetailedGuidance)}
            className="w-full py-2 px-3 rounded-xl text-[11px] font-semibold text-[#A8BAA5] hover:text-[#EFF5EC] transition-colors duration-200 text-center"
          >
            {showDetailedGuidance ? "Hide step instructions ↑" : "View step instructions ↓"}
          </button>
        </motion.div>
      </div>

      {/* ── Bottom Bar matching Reference: COGNITOSHIELD + BREATHE · FOCUS · THRIVE ── */}
      <div className="flex items-center justify-between pt-2 pb-1 text-xs select-none">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#84BD90]" />
          <div>
            <span className="font-extrabold uppercase tracking-[0.2em] text-[#EFF5EC] text-[11px]">
              CognitoShield
            </span>
            <span className="hidden sm:inline text-[#7D927E] text-[11px] ml-2">
              Your well-being. Our priority.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7D927E]">
          <span className="text-[#A8BAA5]">Breathe</span>
          <span>•</span>
          <span className="text-[#A8BAA5]">Focus</span>
          <span>•</span>
          <span className="text-[#A8BAA5]">Thrive</span>
        </div>
      </div>

      {/* ── Optional Collapsible Step Guidance & Actions (when user toggles) ── */}
      <AnimatePresence>
        {showDetailedGuidance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pt-4 border-t border-[rgba(132,189,144,0.15)] overflow-hidden"
          >
            <RecoveryProgress
              timerStatus={timer.status}
              formattedRemaining={timer.formattedRemaining}
              formattedElapsed={timer.formattedElapsed}
              progress={timer.progress}
              durationLabel={activity.duration}
              totalSteps={totalSteps}
              currentStepIndex={activeStepIndex}
            />

            <RecoveryGuidance
              instructions={activity.instructions}
              currentStepIndex={activeStepIndex}
              onStepChange={(idx) => setManualStepOverride(idx)}
              stepRemainingSeconds={guidanceState.stepRemainingSeconds}
              nextStep={guidanceState.nextStep}
              isTimerRunning={timer.status === "running"}
              reduced={shouldReduce}
            />

            <RecoverySessionActions
              timerStatus={timer.status}
              onStart={timer.start}
              onPause={timer.pause}
              onResume={timer.resume}
              onComplete={handleManualComplete}
              onExit={handleRequestExit}
              isBreathingActivity={isBreathingActivity}
              currentBreathingState={effectiveBreathingState}
              breathingPhaseRemaining={timer.breathingPhaseRemaining}
              onBreathingStateChange={(state) => setManualBreathingState(state)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Early Exit Confirmation Dialog */}
      <RecoveryAbortModal
        isOpen={showAbortModal}
        onConfirmAbort={handleConfirmAbort}
        onCancel={handleCancelAbort}
        elapsedTimeLabel={timer.formattedElapsed}
      />
    </motion.section>
  );
}
