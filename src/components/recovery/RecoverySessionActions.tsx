"use client";

import { Play, Pause, Check, LogOut, Wind } from "lucide-react";
import type { BreathingState } from "@/components/RecoveryEnvironment3D";
import type { TimerStatus } from "./useRecoveryTimer";

interface RecoverySessionActionsProps {
  timerStatus: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onExit: () => void;
  isBreathingActivity?: boolean;
  currentBreathingState?: BreathingState;
  breathingPhaseRemaining?: number;
  onBreathingStateChange?: (state: BreathingState) => void;
}

export default function RecoverySessionActions({
  timerStatus,
  onStart,
  onPause,
  onResume,
  onComplete,
  onExit,
  isBreathingActivity = false,
  currentBreathingState = "idle",
  breathingPhaseRemaining = 0,
  onBreathingStateChange,
}: RecoverySessionActionsProps) {
  const isRunning = timerStatus === "running";
  const isPaused = timerStatus === "paused";
  const isFinished = timerStatus === "completed" || timerStatus === "aborted";

  return (
    <div className="space-y-4 w-full">
      {/* Breathing State Controls — for breathing activities to drive 3D orb */}
      {isBreathingActivity && (
        <div
          className="rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-xl"
          style={{
            background: "var(--rc-bg-card)",
            border: "1px solid var(--rc-border-card)",
            boxShadow: "var(--rc-shadow-card)",
          }}
        >
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4" style={{ color: "var(--rc-moss)" }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--rc-text-primary)" }}
            >
              Respiration Rhythm:
            </span>
            {isRunning && breathingPhaseRemaining > 0 && (
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: "var(--rc-sage-dim)",
                  color: "var(--rc-moss)",
                }}
              >
                {breathingPhaseRemaining}s
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-1.5 flex-wrap justify-center"
            role="group"
            aria-label="Breathing orb phase control"
          >
            {(
              [
                { state: "inhale", label: "Inhale (4s)" },
                { state: "hold", label: "Hold (4s)" },
                { state: "exhale", label: "Exhale (4s)" },
                { state: "idle", label: "Rest" },
              ] as const
            ).map((item) => {
              const isActive = currentBreathingState === item.state;
              return (
                <button
                  key={item.state}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`Select breathing phase ${item.label}`}
                  onClick={() => onBreathingStateChange && onBreathingStateChange(item.state)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
                  style={{
                    background: isActive ? "var(--rc-moss)" : "var(--rc-bg-alt)",
                    color: isActive ? "var(--rc-text-inverse)" : "var(--rc-text-secondary)",
                    boxShadow: isActive ? "0 2px 8px rgba(74,103,65,0.25)" : "none",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Action Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit session"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
          style={{
            background: "var(--rc-bg-alt)",
            color: "var(--rc-text-secondary)",
            border: "1px solid var(--rc-border-soft)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--rc-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--rc-text-secondary)";
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Start / Pause / Resume Button */}
          {!isFinished && (
            <button
              type="button"
              onClick={isRunning ? onPause : isPaused ? onResume : onStart}
              aria-label={isRunning ? "Pause timer" : isPaused ? "Resume timer" : "Begin session"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] shadow-sm"
              style={{
                background: isRunning ? "var(--rc-bg-card)" : "var(--rc-moss)",
                color: isRunning ? "var(--rc-text-primary)" : "var(--rc-text-inverse)",
                border: isRunning ? "1px solid var(--rc-border)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isRunning) e.currentTarget.style.background = "var(--rc-moss-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isRunning) e.currentTarget.style.background = "var(--rc-moss)";
              }}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Begin Session</span>
                </>
              )}
            </button>
          )}

          {/* Complete Button */}
          {!isFinished && (
            <button
              type="button"
              onClick={onComplete}
              aria-label="Complete session now"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] text-white shadow-sm"
              style={{
                background: "#4A6741",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#3B5433";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#4A6741";
              }}
            >
              <Check className="w-4 h-4" />
              <span>Complete Now</span>
            </button>
          )}

          {/* If finished, return button */}
          {isFinished && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Return to sanctuary"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] text-white shadow-sm"
              style={{
                background: "#4A6741",
              }}
            >
              <Check className="w-4 h-4" />
              <span>Return to Sanctuary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
