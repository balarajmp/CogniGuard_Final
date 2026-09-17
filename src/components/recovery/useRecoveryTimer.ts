"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { BreathingState } from "@/components/RecoveryEnvironment3D";

export type TimerStatus = "idle" | "running" | "paused" | "completed" | "aborted";

export interface BreathingCycleConfig {
  inhale: number; // seconds (default 4)
  hold: number;   // seconds (default 4)
  exhale: number; // seconds (default 4)
}

export interface UseRecoveryTimerOptions {
  durationSeconds: number;
  breathingConfig?: BreathingCycleConfig;
  onComplete?: (actualElapsedSeconds: number) => void;
  onAbort?: (actualElapsedSeconds: number) => void;
}

export interface RecoveryTimerResult {
  status: TimerStatus;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalDurationSeconds: number;
  progress: number; // 0 to 100
  formattedRemaining: string; // "mm:ss"
  formattedElapsed: string;   // "mm:ss"
  breathingPhase: BreathingState;
  breathingPhaseRemaining: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  abort: () => void;
  reset: (newDuration?: number) => void;
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useRecoveryTimer({
  durationSeconds,
  breathingConfig = { inhale: 4, hold: 4, exhale: 4 },
  onComplete,
  onAbort,
}: UseRecoveryTimerOptions): RecoveryTimerResult {
  const totalDuration = Math.max(1, durationSeconds);

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // High-precision timing refs to prevent interval drift & re-render churn
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onAbortRef = useRef(onAbort);
  onAbortRef.current = onAbort;

  // Clear all running intervals & animation frames safely
  const clearTimers = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  // Tick function computing elapsed wall-clock time
  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;
    const now = performance.now();
    const currentRunElapsed = (now - startTimeRef.current) / 1000;
    const totalElapsed = accumulatedTimeRef.current + currentRunElapsed;

    if (totalElapsed >= totalDuration) {
      clearTimers();
      setElapsedSeconds(totalDuration);
      setStatus("completed");
      if (onCompleteRef.current) {
        onCompleteRef.current(totalDuration);
      }
    } else {
      setElapsedSeconds(Math.min(totalDuration, totalElapsed));
    }
  }, [totalDuration, clearTimers]);

  // Start countdown
  const start = useCallback(() => {
    clearTimers();
    startTimeRef.current = performance.now();
    setStatus("running");

    // Interval tick at 250ms for smooth UI updates without choking React
    intervalIdRef.current = setInterval(tick, 250);
  }, [clearTimers, tick]);

  // Pause countdown
  const pause = useCallback(() => {
    if (status !== "running") return;
    clearTimers();
    if (startTimeRef.current !== null) {
      const currentRunElapsed = (performance.now() - startTimeRef.current) / 1000;
      accumulatedTimeRef.current += currentRunElapsed;
      startTimeRef.current = null;
    }
    setStatus("paused");
  }, [status, clearTimers]);

  // Resume countdown
  const resume = useCallback(() => {
    if (status !== "paused") return;
    clearTimers();
    startTimeRef.current = performance.now();
    setStatus("running");
    intervalIdRef.current = setInterval(tick, 250);
  }, [status, clearTimers, tick]);

  // Complete session (either manually or called by timer)
  const complete = useCallback(() => {
    clearTimers();
    if (startTimeRef.current !== null) {
      const currentRunElapsed = (performance.now() - startTimeRef.current) / 1000;
      accumulatedTimeRef.current += currentRunElapsed;
      startTimeRef.current = null;
    }
    setStatus("completed");
    const finalElapsed = Math.min(totalDuration, accumulatedTimeRef.current);
    setElapsedSeconds(finalElapsed);
    if (onCompleteRef.current) {
      onCompleteRef.current(finalElapsed);
    }
  }, [totalDuration, clearTimers]);

  // Abort session early
  const abort = useCallback(() => {
    clearTimers();
    if (startTimeRef.current !== null) {
      const currentRunElapsed = (performance.now() - startTimeRef.current) / 1000;
      accumulatedTimeRef.current += currentRunElapsed;
      startTimeRef.current = null;
    }
    setStatus("aborted");
    const finalElapsed = Math.min(totalDuration, accumulatedTimeRef.current);
    setElapsedSeconds(finalElapsed);
    if (onAbortRef.current) {
      onAbortRef.current(finalElapsed);
    }
  }, [totalDuration, clearTimers]);

  // Reset timer cleanly for a new session
  const reset = useCallback(
    (newDuration?: number) => {
      clearTimers();
      startTimeRef.current = null;
      accumulatedTimeRef.current = 0;
      setElapsedSeconds(0);
      setStatus("idle");
    },
    [clearTimers]
  );

  // Tab visibility change handler to prevent background throttling drift
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden
      } else {
        // Tab restored: immediately recalculate time
        if (status === "running") {
          tick();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, tick]);

  // Cleanup on unmount or duration change
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Calculate breathing phase for respiration activities
  const cycleTotal = breathingConfig.inhale + breathingConfig.hold + breathingConfig.exhale;
  let breathingPhase: BreathingState = "idle";
  let breathingPhaseRemaining = 0;

  if (status === "running" && cycleTotal > 0) {
    const cycleTime = elapsedSeconds % cycleTotal;
    if (cycleTime < breathingConfig.inhale) {
      breathingPhase = "inhale";
      breathingPhaseRemaining = Math.ceil(breathingConfig.inhale - cycleTime);
    } else if (cycleTime < breathingConfig.inhale + breathingConfig.hold) {
      breathingPhase = "hold";
      breathingPhaseRemaining = Math.ceil(breathingConfig.inhale + breathingConfig.hold - cycleTime);
    } else {
      breathingPhase = "exhale";
      breathingPhaseRemaining = Math.ceil(cycleTotal - cycleTime);
    }
  } else if (status === "paused") {
    breathingPhase = "hold";
    breathingPhaseRemaining = 0;
  }

  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const progress = Math.min(100, (elapsedSeconds / totalDuration) * 100);

  return {
    status,
    elapsedSeconds: Math.round(elapsedSeconds),
    remainingSeconds: Math.round(remainingSeconds),
    totalDurationSeconds: totalDuration,
    progress: Math.round(progress * 10) / 10,
    formattedRemaining: formatTime(remainingSeconds),
    formattedElapsed: formatTime(elapsedSeconds),
    breathingPhase,
    breathingPhaseRemaining,
    start,
    pause,
    resume,
    complete,
    abort,
    reset,
  };
}
