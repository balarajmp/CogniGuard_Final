import type { RecoveryActivityModel } from "@/types/recovery";
import { QUICK_BREAKS, GUIDED_SESSIONS } from "@/types/recovery";
import type { InterventionDecision } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════════
   G-R8 — Intervention Modality to Recovery Activity Mapping
   
   Maps InterventionAgent modalities to EXISTING recovery activity catalog
   entries in QUICK_BREAKS / GUIDED_SESSIONS without introducing new
   activity types or duplicate activities.
   ═══════════════════════════════════════════════════════════════════════ */

export interface MappedRecoveryRecommendation {
  activity: RecoveryActivityModel;
  recommendationTitle: string;
  neutralReason: string;
  badgeText: string;
  isRealRecommendation: boolean;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  severity?: "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

/**
 * Maps an InterventionAgent decision to an existing Recovery Activity in the catalog.
 * 
 * Strict verification rules applied:
 * 1. Zero new RecoveryActivityType introduced.
 * 2. Every mapped activity is a direct reference to an existing catalog entry in QUICK_BREAKS or GUIDED_SESSIONS.
 * 3. ZERO raw telemetry exposed (no percentages, WPM, error counts, or durations).
 * 4. ZERO medical or physiological claims (no autonomic claims, clinical jargon, or nervous system claims).
 * 5. Short, neutral wellness reasons only.
 */
export function mapInterventionToRecovery(
  decision?: InterventionDecision | null
): MappedRecoveryRecommendation {
  // Existing catalog activities from src/types/recovery.ts
  const defaultBreathe = QUICK_BREAKS.find((a) => a.id === "breathe") || QUICK_BREAKS[0];
  const defaultFocus = QUICK_BREAKS.find((a) => a.id === "focus-reset") || QUICK_BREAKS[4];
  const defaultHydrate = QUICK_BREAKS.find((a) => a.id === "hydrate") || QUICK_BREAKS[3];
  const defaultWalk = QUICK_BREAKS.find((a) => a.id === "walk") || QUICK_BREAKS[5];
  const defaultEyeRest = QUICK_BREAKS.find((a) => a.id === "eye-rest") || QUICK_BREAKS[1];
  const defaultMidday = GUIDED_SESSIONS.find((a) => a.id === "midday") || defaultFocus;

  // Fallback state when no recommendation exists or API is offline
  if (!decision) {
    return {
      activity: defaultBreathe,
      recommendationTitle: "Guided Breathing",
      neutralReason: "A short guided breathing pause to reset pace and restore calm focus.",
      badgeText: "Standard recommendation",
      isRealRecommendation: false,
    };
  }

  // Work state is balanced with no intervention needed
  if (!decision.intervention_needed || decision.intervention_type === "none") {
    return {
      activity: defaultBreathe,
      recommendationTitle: "Guided Breathing",
      neutralReason: "Work rhythm is steady. Take an optional pause whenever you want to refresh.",
      badgeText: "Steady pacing",
      isRealRecommendation: false,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  const modality = (decision.intervention_type || "").toLowerCase().trim();

  // 1. breathing -> existing Breathing Reset (Guided Breathing, id: "breathe", type: "breathing")
  if (modality === "breathing") {
    return {
      activity: defaultBreathe,
      recommendationTitle: "Breathing Reset",
      neutralReason: "A short guided breathing pause to reset pace and restore calm focus.",
      badgeText: decision.severity ? `${decision.severity.toLowerCase()} priority` : "Adaptive recommendation",
      isRealRecommendation: true,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  // 2. focus_reset -> existing Focus Reset (Attention Reset, id: "focus-reset", type: "focus-reset")
  if (modality === "focus_reset") {
    return {
      activity: defaultFocus,
      recommendationTitle: "Focus Reset",
      neutralReason: "A brief pause to clear task clutter and reground single-task attention.",
      badgeText: decision.severity ? `${decision.severity.toLowerCase()} priority` : "Adaptive recommendation",
      isRealRecommendation: true,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  // 3. cognitive_recovery -> existing Mind Meditation (Attention & Mind Reset, id: "focus-reset", type: "focus-reset")
  if (modality === "cognitive_recovery") {
    return {
      activity: defaultFocus,
      recommendationTitle: "Mind Meditation",
      neutralReason: "A quiet mental pause to step back from complex tasks and refresh mental clarity.",
      badgeText: decision.severity ? `${decision.severity.toLowerCase()} priority` : "Adaptive recommendation",
      isRealRecommendation: true,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  // 4. walk -> existing Walk / Movement activity (Restorative Break, id: "walk", type: "break")
  if (modality === "walk") {
    return {
      activity: defaultWalk,
      recommendationTitle: "Restorative Break",
      neutralReason: "A break away from your workstation to stretch, walk, and rest your eyes.",
      badgeText: decision.severity ? `${decision.severity.toLowerCase()} priority` : "Adaptive recommendation",
      isRealRecommendation: true,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  // 4b. micro_break -> existing Eye & Screen Break (Eye Rest, id: "eye-rest", type: "eye-rest")
  if (modality === "micro_break" || modality === "screen_break") {
    return {
      activity: defaultEyeRest,
      recommendationTitle: "Eye & Screen Break",
      neutralReason: "A quick screen intermission using the 20-20-20 approach to rest your eyes and ease posture.",
      badgeText: decision.severity ? `${decision.severity.toLowerCase()} priority` : "Adaptive recommendation",
      isRealRecommendation: true,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  // 5. hydration -> existing Hydration Reset (Hydration Reminder, id: "hydrate", type: "hydration")
  if (modality === "hydration") {
    return {
      activity: defaultHydrate,
      recommendationTitle: "Hydration Reset",
      neutralReason: "A brief reminder to stand up, hydrate, and reset your posture.",
      badgeText: decision.severity ? `${decision.severity.toLowerCase()} priority` : "Adaptive recommendation",
      isRealRecommendation: true,
      priority: decision.priority,
      severity: decision.severity,
    };
  }

  // Default fallback for any other modality -> existing Guided Breathing
  return {
    activity: defaultBreathe,
    recommendationTitle: decision.title || "Guided Breathing",
    neutralReason: "A short pause to help you step away from screen work and refresh.",
    badgeText: "Adaptive recommendation",
    isRealRecommendation: true,
    priority: decision.priority,
    severity: decision.severity,
  };
}
