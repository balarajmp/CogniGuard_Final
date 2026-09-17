"use client";

import { Clock, Hourglass, CheckCircle2, PauseCircle, PlayCircle, AlertCircle } from "lucide-react";
import type { TimerStatus } from "./useRecoveryTimer";

interface RecoveryProgressProps {
  timerStatus: TimerStatus;
  formattedRemaining: string;
  formattedElapsed: string;
  progress: number;
  durationLabel: string;
  totalSteps: number;
  currentStepIndex: number;
}

export default function RecoveryProgress({
  timerStatus,
  formattedRemaining,
  formattedElapsed,
  progress,
  durationLabel,
  totalSteps,
  currentStepIndex,
}: RecoveryProgressProps) {
  const getStatusBadge = () => {
    switch (timerStatus) {
      case "running":
        return {
          label: "In Progress",
          icon: PlayCircle,
          bg: "rgba(123,164,122,0.18)",
          color: "var(--rc-moss)",
        };
      case "paused":
        return {
          label: "Paused",
          icon: PauseCircle,
          bg: "rgba(160,136,106,0.18)",
          color: "var(--rc-earth)",
        };
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle2,
          bg: "rgba(94,150,106,0.22)",
          color: "var(--rc-sage-light)",
        };
      case "aborted":
        return {
          label: "Aborted",
          icon: AlertCircle,
          bg: "rgba(239,68,68,0.18)",
          color: "#FCA5A5",
        };
      case "idle":
      default:
        return {
          label: "Ready to Start",
          icon: Hourglass,
          bg: "var(--rc-bg-alt)",
          color: "var(--rc-text-muted)",
        };
    }
  };

  const badge = getStatusBadge();
  const StatusIcon = badge.icon;

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"
      style={{
        background: "var(--rc-bg-card)",
        border: "1px solid var(--rc-border-card)",
        boxShadow: "var(--rc-shadow-card)",
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        {/* Main Countdown Time */}
        <div className="flex items-baseline gap-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" style={{ color: "var(--rc-sage)" }} />
            <span
              className="text-2xl sm:text-3xl font-bold tracking-tight font-mono"
              style={{ color: "var(--rc-text-primary)" }}
              aria-label={`Time remaining: ${formattedRemaining}`}
            >
              {formattedRemaining}
            </span>
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--rc-text-muted)" }}>
            remaining of {durationLabel}
          </span>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all duration-300"
            style={{
              background: badge.bg,
              color: badge.color,
            }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </span>
        </div>
      </div>

      {/* Real Animated Progress Bar */}
      <div
        className="w-full h-2.5 rounded-full overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.08)" }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Recovery session timer progress"
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background:
              timerStatus === "completed"
                ? "linear-gradient(90deg, #5E966A 0%, #3E7244 100%)"
                : timerStatus === "aborted"
                ? "#D4A373"
                : "linear-gradient(90deg, #84BD90 0%, #5E966A 100%)",
          }}
        />
      </div>

      {/* Sub-label showing step and elapsed metrics */}
      <div className="flex items-center justify-between mt-2.5 text-xs">
        <span style={{ color: "var(--rc-text-muted)" }}>
          Step {currentStepIndex + 1} of {totalSteps} • {Math.round(progress)}% done
        </span>
        <span
          className="inline-flex items-center gap-1 font-mono text-[11px]"
          style={{ color: "var(--rc-text-secondary)" }}
        >
          Elapsed: {formattedElapsed}
        </span>
      </div>
    </div>
  );
}
