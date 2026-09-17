import type { RecoveryInstructionStep } from "@/types/recovery";

export interface ActiveGuidanceState {
  currentStepIndex: number;
  currentStep: RecoveryInstructionStep;
  nextStep: RecoveryInstructionStep | null;
  stepElapsedSeconds: number;
  stepDurationSeconds: number;
  stepRemainingSeconds: number;
  stepProgress: number; // 0 to 100
}

/**
 * Computes active step guidance deterministically from elapsedSeconds.
 * Automatically synchronizes with the G-R5 Universal Recovery Timer
 * without creating any secondary interval or drift.
 */
export function computeActiveGuidance(
  instructions: RecoveryInstructionStep[],
  elapsedSeconds: number,
  totalDurationSeconds: number
): ActiveGuidanceState {
  if (!instructions || instructions.length === 0) {
    const fallback: RecoveryInstructionStep = {
      id: "fallback",
      stepNumber: 1,
      title: "Mindful Recovery",
      guidance: "Rest quietly and allow your attention to settle.",
      durationSeconds: totalDurationSeconds,
      durationLabel: `${Math.round(totalDurationSeconds / 60)} min`,
    };
    return {
      currentStepIndex: 0,
      currentStep: fallback,
      nextStep: null,
      stepElapsedSeconds: elapsedSeconds,
      stepDurationSeconds: totalDurationSeconds,
      stepRemainingSeconds: Math.max(0, totalDurationSeconds - elapsedSeconds),
      stepProgress: totalDurationSeconds > 0 ? (elapsedSeconds / totalDurationSeconds) * 100 : 0,
    };
  }

  // Calculate accumulated boundary times for each step
  let accumulated = 0;
  let activeIndex = 0;
  let stepStart = 0;
  let stepEnd = 0;

  for (let i = 0; i < instructions.length; i++) {
    const stepDuration = instructions[i].durationSeconds || (totalDurationSeconds / instructions.length);
    const nextAccumulated = accumulated + stepDuration;

    if (elapsedSeconds < nextAccumulated || i === instructions.length - 1) {
      activeIndex = i;
      stepStart = accumulated;
      stepEnd = nextAccumulated;
      break;
    }
    accumulated = nextAccumulated;
  }

  const currentStep = instructions[activeIndex];
  const nextStep = activeIndex < instructions.length - 1 ? instructions[activeIndex + 1] : null;
  const stepDurationSeconds = Math.max(1, stepEnd - stepStart);
  const stepElapsedSeconds = Math.max(0, Math.min(stepDurationSeconds, elapsedSeconds - stepStart));
  const stepRemainingSeconds = Math.max(0, stepDurationSeconds - stepElapsedSeconds);
  const stepProgress = Math.min(100, (stepElapsedSeconds / stepDurationSeconds) * 100);

  return {
    currentStepIndex: activeIndex,
    currentStep,
    nextStep,
    stepElapsedSeconds: Math.round(stepElapsedSeconds),
    stepDurationSeconds: Math.round(stepDurationSeconds),
    stepRemainingSeconds: Math.round(stepRemainingSeconds),
    stepProgress: Math.round(stepProgress * 10) / 10,
  };
}
