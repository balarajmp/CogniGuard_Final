"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Compass, ArrowRight, Clock } from "lucide-react";
import type { RecoveryInstructionStep } from "@/types/recovery";

interface RecoveryGuidanceProps {
  instructions: RecoveryInstructionStep[];
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  reduced?: boolean;
  stepRemainingSeconds?: number;
  nextStep?: RecoveryInstructionStep | null;
  isTimerRunning?: boolean;
}

export default function RecoveryGuidance({
  instructions,
  currentStepIndex,
  onStepChange,
  reduced = false,
  stepRemainingSeconds,
  nextStep,
  isTimerRunning = false,
}: RecoveryGuidanceProps) {
  if (!instructions || instructions.length === 0) return null;

  const currentStep = instructions[currentStepIndex] || instructions[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === instructions.length - 1;

  const handlePrev = () => {
    if (!isFirst && onStepChange) onStepChange(currentStepIndex - 1);
  };

  const handleNext = () => {
    if (!isLast && onStepChange) onStepChange(currentStepIndex + 1);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Steps Indicator Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4" style={{ color: "var(--rc-sage)" }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--rc-text-muted)" }}
          >
            Step {currentStepIndex + 1} of {instructions.length}
          </span>
          {isTimerRunning && stepRemainingSeconds !== undefined && stepRemainingSeconds > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: "var(--rc-sage-dim)",
                color: "var(--rc-moss)",
              }}
            >
              <Clock className="w-3 h-3" />
              {stepRemainingSeconds}s
            </span>
          )}
        </div>

        {/* Step dots / pills */}
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Recovery activity guidance steps"
        >
          {instructions.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;

            return (
              <button
                key={step.id}
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Step ${idx + 1}: ${step.title}`}
                onClick={() => onStepChange && onStepChange(idx)}
                className="h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
                style={{
                  width: isCurrent ? "28px" : "12px",
                  background: isCurrent
                    ? "var(--rc-sage)"
                    : isCompleted
                    ? "var(--rc-moss)"
                    : "rgba(255, 255, 255, 0.14)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Main Guidance Card with animated step transition */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl"
        style={{
          background: "var(--rc-bg-card)",
          border: "1px solid var(--rc-border-card)",
          boxShadow: "var(--rc-shadow-card)",
        }}
      >
        <div aria-live="polite" className="sr-only">
          {`Step ${currentStep.stepNumber}: ${currentStep.title}. ${currentStep.guidance}`}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: "var(--rc-sage-dim)",
                    color: "var(--rc-sage-light)",
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Step {currentStep.stepNumber}
                </span>

                {isTimerRunning && stepRemainingSeconds !== undefined && stepRemainingSeconds > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(132, 189, 144, 0.16)",
                      color: "var(--rc-sage-light)",
                      border: "1px solid rgba(132, 189, 144, 0.3)",
                    }}
                  >
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>{stepRemainingSeconds}s remaining</span>
                  </span>
                )}
              </div>

              {currentStep.durationLabel && (
                <span
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--rc-bg-alt)",
                    color: "var(--rc-text-muted)",
                  }}
                >
                  Step duration: {currentStep.durationLabel}
                </span>
              )}
            </div>

            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ color: "var(--rc-text-primary)" }}
            >
              {currentStep.title}
            </h2>

            <p
              className="text-base sm:text-lg leading-relaxed"
              style={{ color: "var(--rc-text-primary)" }}
            >
              {currentStep.guidance}
            </p>

            {currentStep.subtext && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--rc-text-secondary)" }}
              >
                {currentStep.subtext}
              </p>
            )}

            {currentStep.cue && (
              <div
                className="rounded-2xl p-4 flex items-center gap-3 mt-4"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px dashed var(--rc-border-soft)",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: "var(--rc-sage)" }}
                />
                <p
                  className="text-xs sm:text-sm font-medium italic"
                  style={{ color: "var(--rc-text-primary)" }}
                >
                  Focus cue: &ldquo;{currentStep.cue}&rdquo;
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next-Step Preview Card */}
        {nextStep && (
          <div
            className="mt-6 pt-4 border-t flex items-center justify-between gap-3 text-xs"
            style={{ borderColor: "var(--rc-border-soft)" }}
          >
            <span style={{ color: "var(--rc-text-muted)" }}>Up next:</span>
            <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--rc-text-secondary)" }}>
              <span>Step {nextStep.stepNumber} — {nextStep.title}</span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--rc-sage)" }} />
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div
          className="flex items-center justify-between gap-3 pt-5 mt-4 border-t"
          style={{ borderColor: "var(--rc-border-soft)" }}
        >
          <button
            onClick={handlePrev}
            disabled={isFirst || !onStepChange}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
            style={{
              background: "var(--rc-bg-alt)",
              color: "var(--rc-text-secondary)",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>

          <button
            onClick={handleNext}
            disabled={isLast || !onStepChange}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
            style={{
              background: isLast ? "var(--rc-bg-alt)" : "var(--rc-moss)",
              color: isLast ? "var(--rc-text-muted)" : "var(--rc-text-inverse)",
            }}
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
