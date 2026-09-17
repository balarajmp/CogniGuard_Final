import type { LucideIcon } from "lucide-react";
import {
  Wind,
  Eye,
  Footprints,
  Droplets,
  Brain,
  Coffee,
  Sun,
  Leaf,
  Sparkles,
  Moon,
} from "lucide-react";
import type { BreathingState } from "@/components/RecoveryEnvironment3D";

/* ═══════════════════════════════════════════════════════════════════════
   G-R4/G-R6 — Recovery Activity & Guided Experience Architecture Types
   ═══════════════════════════════════════════════════════════════════════ */

export type RecoveryActivityType =
  | "breathing"
  | "eye-rest"
  | "stretch"
  | "hydration"
  | "focus-reset"
  | "break"
  | "guided-session";

export type RecoveryCategory = "quick-break" | "guided-session";

export interface RecoveryInstructionStep {
  id: string;
  stepNumber: number;
  title: string;
  guidance: string;
  subtext?: string;
  cue?: string;
  durationSeconds: number;
  durationLabel?: string;
  breathingPhase?: BreathingState;
}

export interface RecoveryActivityModel {
  id: string;
  type: RecoveryActivityType;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  category: RecoveryCategory;
  icon: LucideIcon;
  instructions: RecoveryInstructionStep[];
  breathingState?: BreathingState;
  color: string;
  accent: string;
  gradient?: string;
  metadata?: {
    tag?: string;
    targetBenefit?: string;
    cues?: string[];
    recommendedTimeOfDay?: "morning" | "afternoon" | "evening" | "any";
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   Activity Catalog Data
   All wording strictly reviewed for wellness neutrality and medical safety.
   ═══════════════════════════════════════════════════════════════════════ */

export const QUICK_BREAKS: RecoveryActivityModel[] = [
  {
    id: "breathe",
    type: "breathing",
    title: "Guided Breathing",
    description:
      "A short guided breathing exercise to help you pause and step away from screen work for a few minutes.",
    duration: "3 min",
    durationMinutes: 3,
    category: "quick-break",
    icon: Wind,
    breathingState: "idle",
    color: "#7BA47A",
    accent: "rgba(123,164,122,0.12)",
    metadata: {
      tag: "Respiration",
      targetBenefit: "Calm baseline reset",
      cues: ["Inhale 4s", "Hold 4s", "Exhale 4s"],
    },
    instructions: [
      {
        id: "breathe-1",
        stepNumber: 1,
        title: "Settle into your posture",
        guidance: "Sit comfortably upright with both feet flat on the floor.",
        subtext: "Soften your shoulders away from your ears and rest your hands gently in your lap.",
        cue: "Take a gentle posture check",
        durationSeconds: 30,
        durationLabel: "30s",
        breathingPhase: "idle",
      },
      {
        id: "breathe-2",
        stepNumber: 2,
        title: "Gentle inhale",
        guidance: "Take a slow, smooth breath in through your nose for 4 seconds.",
        subtext: "Feel your ribs expand gently without forcing or straining your breath.",
        cue: "Slow breath in",
        durationSeconds: 45,
        durationLabel: "45s",
        breathingPhase: "inhale",
      },
      {
        id: "breathe-3",
        stepNumber: 3,
        title: "Soft pause",
        guidance: "Pause here for a moment with a soft, quiet hold.",
        subtext: "Keep your throat, jaw, and neck relaxed as you rest in stillness.",
        cue: "Gentle still hold",
        durationSeconds: 45,
        durationLabel: "45s",
        breathingPhase: "hold",
      },
      {
        id: "breathe-4",
        stepNumber: 4,
        title: "Calm exhale",
        guidance: "Release your breath slowly and evenly through slightly parted lips.",
        subtext: "Allow your shoulders to settle as you empty your lungs completely and smoothly.",
        cue: "Slow relaxing release",
        durationSeconds: 60,
        durationLabel: "60s",
        breathingPhase: "exhale",
      },
    ],
  },
  {
    id: "eye-rest",
    type: "eye-rest",
    title: "Eye Rest",
    description:
      "A structured screen break using the 20-20-20 approach — look away, blink, and rest your eyes.",
    duration: "2 min",
    durationMinutes: 2,
    category: "quick-break",
    icon: Eye,
    color: "#A0886A",
    accent: "rgba(160,136,106,0.12)",
    metadata: {
      tag: "Ocular",
      targetBenefit: "Visual strain relief",
      cues: ["Distance gaze", "Soft blink", "Palming"],
    },
    instructions: [
      {
        id: "eye-1",
        stepNumber: 1,
        title: "Look away from the screen",
        guidance: "Direct your gaze toward an object at least 20 feet away or out a window.",
        subtext: "Allow your eyes to soften their focus on the distance rather than close-up pixels.",
        cue: "Soft distant gaze",
        durationSeconds: 30,
        durationLabel: "30s",
      },
      {
        id: "eye-2",
        stepNumber: 2,
        title: "Gentle conscious blinking",
        guidance: "Blink slowly and deliberately ten times in a gentle rhythm.",
        subtext: "Notice the sensation of resting your eyelids between each conscious blink.",
        cue: "Slow, easy blinks",
        durationSeconds: 30,
        durationLabel: "30s",
      },
      {
        id: "eye-3",
        stepNumber: 3,
        title: "Warm palming",
        guidance: "Rub your palms together until warm, then cup them lightly over your closed eyes.",
        subtext: "Rest in the warm dark space without applying any pressure to your eyelids.",
        cue: "Rest in warmth",
        durationSeconds: 40,
        durationLabel: "40s",
      },
      {
        id: "eye-4",
        stepNumber: 4,
        title: "Slow return",
        guidance: "Lower your hands and gently blink your eyes open to the room's ambient light.",
        subtext: "Take one calm breath before turning your attention back to your work.",
        cue: "Gentle re-entry",
        durationSeconds: 20,
        durationLabel: "20s",
      },
    ],
  },
  {
    id: "stretch",
    type: "stretch",
    title: "Desk Stretch",
    description:
      "Guided neck, shoulder, and wrist movements to help you move after extended sitting.",
    duration: "4 min",
    durationMinutes: 4,
    category: "quick-break",
    icon: Footprints,
    color: "#6B9E8A",
    accent: "rgba(107,158,138,0.12)",
    metadata: {
      tag: "Physical",
      targetBenefit: "Musculoskeletal release",
      cues: ["Neck ease", "Shoulder roll", "Spinal twist", "Wrist stretch"],
    },
    instructions: [
      {
        id: "stretch-1",
        stepNumber: 1,
        title: "Neck ease",
        guidance: "Tilt your right ear gently toward your right shoulder, holding for a few breaths.",
        subtext: "Keep your opposite shoulder resting low, then switch gently to the other side.",
        cue: "Gentle side stretch",
        durationSeconds: 60,
        durationLabel: "60s",
      },
      {
        id: "stretch-2",
        stepNumber: 2,
        title: "Shoulder rolls",
        guidance: "Roll your shoulders backward in broad, smooth circular motions.",
        subtext: "Coordinate with your breathing — lift as you breathe in, lower as you breathe out.",
        cue: "Smooth circular arcs",
        durationSeconds: 60,
        durationLabel: "60s",
      },
      {
        id: "stretch-3",
        stepNumber: 3,
        title: "Seated torso twist",
        guidance: "Place your right hand on your left knee and gently rotate your upper body.",
        subtext: "Lengthen through the crown of your head with each breath, then ease to the right side.",
        cue: "Gentle upper twist",
        durationSeconds: 60,
        durationLabel: "60s",
      },
      {
        id: "stretch-4",
        stepNumber: 4,
        title: "Wrist and finger release",
        guidance: "Extend one arm forward and gently draw your fingers back with the opposite hand.",
        subtext: "Shake out both hands gently to release typing tension from your forearms.",
        cue: "Ease forearm tension",
        durationSeconds: 60,
        durationLabel: "60s",
      },
    ],
  },
  {
    id: "hydrate",
    type: "hydration",
    title: "Hydration Reminder",
    description:
      "A prompt to drink water and take a moment to reset your posture before returning to work.",
    duration: "1 min",
    durationMinutes: 1,
    category: "quick-break",
    icon: Droplets,
    color: "#5B8DB8",
    accent: "rgba(91,141,184,0.12)",
    metadata: {
      tag: "Vitality",
      targetBenefit: "Fluid balance & circulation",
      cues: ["Stand up", "Hydrate", "Clear breath"],
    },
    instructions: [
      {
        id: "hydrate-1",
        stepNumber: 1,
        title: "Stand up from your desk",
        guidance: "Push your chair back and stand upright with your feet shoulder-width apart.",
        subtext: "Reach your arms overhead for a gentle full-body stretch.",
        cue: "Stand tall",
        durationSeconds: 15,
        durationLabel: "15s",
      },
      {
        id: "hydrate-2",
        stepNumber: 2,
        title: "Pour fresh water",
        guidance: "Fill a clean glass or bottle with fresh, cool water.",
        subtext: "Take a moment to notice the sound and cool temperature of the water.",
        cue: "Fresh hydration",
        durationSeconds: 15,
        durationLabel: "15s",
      },
      {
        id: "hydrate-3",
        stepNumber: 3,
        title: "Mindful sip",
        guidance: "Drink slowly and intentionally, taking small, refreshing sips.",
        subtext: "Notice the sensation of cool water as you pause away from your tasks.",
        cue: "Drink slowly",
        durationSeconds: 15,
        durationLabel: "15s",
      },
      {
        id: "hydrate-4",
        stepNumber: 4,
        title: "Reset and return",
        guidance: "Roll your shoulders back and take one steady breath before sitting down.",
        subtext: "Return when you feel ready to engage with your next task.",
        cue: "Return ready",
        durationSeconds: 15,
        durationLabel: "15s",
      },
    ],
  },
  {
    id: "focus-reset",
    type: "focus-reset",
    title: "Attention Reset",
    description:
      "A short guided pause designed to help you clear your current task context and return with fresh attention.",
    duration: "5 min",
    durationMinutes: 5,
    category: "quick-break",
    icon: Brain,
    color: "#9B7EA0",
    accent: "rgba(155,126,160,0.12)",
    metadata: {
      tag: "Cognition",
      targetBenefit: "Attentional defragmentation",
      cues: ["Park loops", "Silence noise", "Grounding", "Single target"],
    },
    instructions: [
      {
        id: "focus-1",
        stepNumber: 1,
        title: "Park your open tasks",
        guidance: "Jot down a quick note on where you stopped so your mind can set it aside.",
        subtext: "Knowing your place is saved frees your attention for this break.",
        cue: "Park open items",
        durationSeconds: 60,
        durationLabel: "60s",
      },
      {
        id: "focus-2",
        stepNumber: 2,
        title: "Quiet your immediate space",
        guidance: "Take your hands off the keyboard and mouse, resting them in your lap.",
        subtext: "Minimize active windows and let your visual field settle into stillness.",
        cue: "Hands at rest",
        durationSeconds: 60,
        durationLabel: "60s",
      },
      {
        id: "focus-3",
        stepNumber: 3,
        title: "Sensory stillness",
        guidance: "Notice three neutral sounds in your surroundings without analyzing them.",
        subtext: "Let your attention widen gently as you sit in calm observation.",
        cue: "Quiet listening",
        durationSeconds: 90,
        durationLabel: "90s",
      },
      {
        id: "focus-4",
        stepNumber: 4,
        title: "Select your single next step",
        guidance: "Identify the one priority you will attend to when this pause concludes.",
        subtext: "Keep it simple and direct. Commit to one clear intention.",
        cue: "One clear target",
        durationSeconds: 90,
        durationLabel: "90s",
      },
    ],
  },
  {
    id: "walk",
    type: "break",
    title: "Restorative Break",
    description:
      "Step away from the screen for a few minutes. Walk, stretch, or simply rest somewhere quiet.",
    duration: "10 min",
    durationMinutes: 10,
    category: "quick-break",
    icon: Coffee,
    color: "#B8896A",
    accent: "rgba(184,137,106,0.12)",
    metadata: {
      tag: "Restoration",
      targetBenefit: "Full systemic pause",
      cues: ["Disconnect", "Movement", "Natural light", "Stillness"],
    },
    instructions: [
      {
        id: "walk-1",
        stepNumber: 1,
        title: "Step away from screens",
        guidance: "Leave your computer, phone, and tablet resting at your desk.",
        subtext: "Give yourself permission to be fully away from digital inputs for ten minutes.",
        cue: "Complete disconnect",
        durationSeconds: 120,
        durationLabel: "2 min",
      },
      {
        id: "walk-2",
        stepNumber: 2,
        title: "Take a short movement break",
        guidance: "Walk at an unhurried, comfortable pace through your room or hallway.",
        subtext: "Notice the rhythm of your steps and allow your arms to swing naturally.",
        cue: "Unhurried pace",
        durationSeconds: 180,
        durationLabel: "3 min",
      },
      {
        id: "walk-3",
        stepNumber: 3,
        title: "Take in natural daylight",
        guidance: "Stand near a window or step outside to experience natural ambient light.",
        subtext: "Look toward distant trees, sky, or buildings without checking any devices.",
        cue: "Natural light contrast",
        durationSeconds: 180,
        durationLabel: "3 min",
      },
      {
        id: "walk-4",
        stepNumber: 4,
        title: "Quiet return",
        guidance: "Pause for three calm breaths before returning to your workstation.",
        subtext: "Return when you feel ready to resume your work with refreshed clarity.",
        cue: "Calm re-entry",
        durationSeconds: 120,
        durationLabel: "2 min",
      },
    ],
  },
];

export const GUIDED_SESSIONS: RecoveryActivityModel[] = [
  {
    id: "morning",
    type: "guided-session",
    title: "Morning Clarity",
    description: "A gentle warm-up to help you ease into your work session.",
    duration: "8 min",
    durationMinutes: 8,
    category: "guided-session",
    icon: Sun,
    color: "#4A6741",
    accent: "rgba(123,164,122,0.18)",
    gradient: "linear-gradient(135deg, #F5E6C8 0%, #E8D4A0 100%)",
    metadata: {
      tag: "Morning",
      recommendedTimeOfDay: "morning",
      targetBenefit: "Intentional work activation",
    },
    instructions: [
      {
        id: "morning-1",
        stepNumber: 1,
        title: "Ground your morning",
        guidance: "Sit comfortably with an upright spine and feet resting flat on the floor.",
        subtext: "Acknowledge the beginning of your workday with quiet presence.",
        cue: "Steady posture",
        durationSeconds: 120,
        durationLabel: "2 min",
      },
      {
        id: "morning-2",
        stepNumber: 2,
        title: "Clarify your key priority",
        guidance: "Identify the one project or task that matters most for today.",
        subtext: "Focus on meaningful progress rather than a long list of minor items.",
        cue: "Singular priority",
        durationSeconds: 120,
        durationLabel: "2 min",
      },
      {
        id: "morning-3",
        stepNumber: 3,
        title: "Gentle breath pacing",
        guidance: "Follow three slow breaths, letting each exhale bring ease to your posture.",
        subtext: "Release any morning rush as you establish a steady, calm tempo.",
        cue: "Paced breathing",
        durationSeconds: 120,
        durationLabel: "2 min",
      },
      {
        id: "morning-4",
        stepNumber: 4,
        title: "Composed start",
        guidance: "Open your first task with quiet poise and patient momentum.",
        subtext: "Pace yourself steadily as you ease into your workday.",
        cue: "Ease into work",
        durationSeconds: 120,
        durationLabel: "2 min",
      },
    ],
  },
  {
    id: "midday",
    type: "guided-session",
    title: "Midday Reset",
    description:
      "A mid-session pause to help you return to work feeling ready.",
    duration: "5 min",
    durationMinutes: 5,
    category: "guided-session",
    icon: Leaf,
    color: "#4A6741",
    accent: "rgba(123,164,122,0.18)",
    gradient: "linear-gradient(135deg, #D4EBCC 0%, #A8C5A0 100%)",
    metadata: {
      tag: "Afternoon",
      recommendedTimeOfDay: "afternoon",
      targetBenefit: "Midday mental refresh",
    },
    instructions: [
      {
        id: "midday-1",
        stepNumber: 1,
        title: "Pause the morning momentum",
        guidance: "Acknowledge the work completed this morning and step away from your screen.",
        subtext: "Let go of whatever remains in progress for the duration of this pause.",
        cue: "Midday pause",
        durationSeconds: 60,
        durationLabel: "1 min",
      },
      {
        id: "midday-2",
        stepNumber: 2,
        title: "Loosen neck and shoulders",
        guidance: "Roll your shoulders back and gently tilt your head side to side.",
        subtext: "Notice any physical tightness from morning desk work and let it soften.",
        cue: "Physical softening",
        durationSeconds: 90,
        durationLabel: "1.5 min",
      },
      {
        id: "midday-3",
        stepNumber: 3,
        title: "Centered slow breathing",
        guidance: "Take five slow, even breaths through your nose.",
        subtext: "Allow your breathing rhythm to find a quiet, unhurried cadence.",
        cue: "Quiet cadence",
        durationSeconds: 90,
        durationLabel: "1.5 min",
      },
      {
        id: "midday-4",
        stepNumber: 4,
        title: "Afternoon clarity",
        guidance: "Return to your workspace with clear eyes and a focused intention.",
        subtext: "Select your first afternoon block with calm confidence.",
        cue: "Clear re-entry",
        durationSeconds: 60,
        durationLabel: "1 min",
      },
    ],
  },
  {
    id: "deep-work",
    type: "guided-session",
    title: "Deep Work Prep",
    description:
      "A guided session to help you pause and prepare before a focused work block.",
    duration: "6 min",
    durationMinutes: 6,
    category: "guided-session",
    icon: Sparkles,
    color: "#4A6741",
    accent: "rgba(107,158,138,0.18)",
    gradient: "linear-gradient(135deg, #D0DCEE 0%, #A0B8D8 100%)",
    metadata: {
      tag: "Any time",
      recommendedTimeOfDay: "any",
      targetBenefit: "Deep immersion readiness",
    },
    instructions: [
      {
        id: "deep-1",
        stepNumber: 1,
        title: "Define your single objective",
        guidance: "Decide on the exact outcome you want to produce during this focused block.",
        subtext: "Choose one clear deliverable rather than spreading your attention thin.",
        cue: "Sharpen your focus",
        durationSeconds: 90,
        durationLabel: "1.5 min",
      },
      {
        id: "deep-2",
        stepNumber: 2,
        title: "Clear distractions",
        guidance: "Close unneeded browser tabs and silence notifications.",
        subtext: "Make sure water or tea is close by so you won't need to break flow prematurely.",
        cue: "Protect your space",
        durationSeconds: 90,
        durationLabel: "1.5 min",
      },
      {
        id: "deep-3",
        stepNumber: 3,
        title: "Center your attention",
        guidance: "Close your eyes and take four slow, counted breaths.",
        subtext: "Picture bringing all your mental energy into a single calm beam of attention.",
        cue: "Inward stillness",
        durationSeconds: 90,
        durationLabel: "1.5 min",
      },
      {
        id: "deep-4",
        stepNumber: 4,
        title: "Enter flow",
        guidance: "Open your workspace and begin your first task with patient determination.",
        subtext: "Work smoothly without rushing, staying with one problem at a time.",
        cue: "Begin immersion",
        durationSeconds: 90,
        durationLabel: "1.5 min",
      },
    ],
  },
  {
    id: "wind-down",
    type: "guided-session",
    title: "Wind-Down",
    description:
      "A short session to help you transition out of work mode at the end of the day.",
    duration: "10 min",
    durationMinutes: 10,
    category: "guided-session",
    icon: Moon,
    color: "#4A6741",
    accent: "rgba(155,126,160,0.18)",
    gradient: "linear-gradient(135deg, #E0D4EC 0%, #C4ACDA 100%)",
    metadata: {
      tag: "Evening",
      recommendedTimeOfDay: "evening",
      targetBenefit: "Workday boundary & evening recovery",
    },
    instructions: [
      {
        id: "wind-1",
        stepNumber: 1,
        title: "Review and acknowledge",
        guidance: "Take a quiet moment to recognize the effort you put into today.",
        subtext: "Acknowledge what was accomplished and let go of unfinished items.",
        cue: "Acknowledge progress",
        durationSeconds: 150,
        durationLabel: "2.5 min",
      },
      {
        id: "wind-2",
        stepNumber: 2,
        title: "Prepare tomorrow's runway",
        guidance: "Write down your top one or two starting points for tomorrow morning.",
        subtext: "Leaving a clear note lets your subconscious mind rest tonight without planning.",
        cue: "Set aside tomorrow",
        durationSeconds: 150,
        durationLabel: "2.5 min",
      },
      {
        id: "wind-3",
        stepNumber: 3,
        title: "Physical workday closure",
        guidance: "Close open applications, tidy your desk, and put work devices on sleep mode.",
        subtext: "A clean physical boundary helps separate your work from personal time.",
        cue: "Close work tools",
        durationSeconds: 150,
        durationLabel: "2.5 min",
      },
      {
        id: "wind-4",
        stepNumber: 4,
        title: "Step into your evening",
        guidance: "Take three deep releasing breaths and step away from your workspace.",
        subtext: "Welcome your evening rest with presence, calm, and peace.",
        cue: "Evening rest",
        durationSeconds: 150,
        durationLabel: "2.5 min",
      },
    ],
  },
];

export const ALL_RECOVERY_ACTIVITIES: RecoveryActivityModel[] = [
  ...QUICK_BREAKS,
  ...GUIDED_SESSIONS,
];

export function getRecoveryActivityById(
  id: string
): RecoveryActivityModel | undefined {
  return ALL_RECOVERY_ACTIVITIES.find((a) => a.id === id);
}

/* ═══════════════════════════════════════════════════════════════════════
   G-R7.1 — Guided Content Model & Curated Catalog
   ═══════════════════════════════════════════════════════════════════════ */

export type GuidedContentProvider = "youtube" | string;

export interface GuidedContent {
  id: string;
  title: string;
  description: string;
  category: RecoveryCategory;
  activityType: RecoveryActivityType;
  durationMinutes: number;
  provider: GuidedContentProvider;
  videoId: string;
  thumbnailUrl?: string;
  tags: string[];
}

/**
 * Curated static catalog of guided content sessions.
 * Clearly mapped to existing recovery activity types.
 * Placeholder video IDs prepared for G-R7.2 YouTube embedding.
 */
export const GUIDED_CONTENT_CATALOG: GuidedContent[] = [
  // ── Respiration (Guided Breathing) ──
  {
    id: "gc-breathe-1",
    title: "Box breathing",
    description: "A structured 4-second box pattern to guide balanced, calm respiration.",
    category: "quick-break",
    activityType: "breathing",
    durationMinutes: 3,
    provider: "youtube",
    videoId: "G25IR0c-Hj8",
    tags: ["Breathing", "Paced", "Calm"],
  },
  {
    id: "gc-breathe-2",
    title: "Belly breathing",
    description: "Guided diaphragmatic breathing to encourage relaxed abdominal expansion and steady pacing.",
    category: "quick-break",
    activityType: "breathing",
    durationMinutes: 3,
    provider: "youtube",
    videoId: "OXjlR4mXxSk",
    tags: ["Respiration", "Diaphragm", "Slow Pace"],
  },

  // ── Ocular (Eye Rest) ──
  {
    id: "gc-eye-1",
    title: "20-20-20 Distance Focus & Palming",
    description: "Structured screen rest routine guiding distance gazing, rhythmic blinks, and warm hand palming.",
    category: "quick-break",
    activityType: "eye-rest",
    durationMinutes: 2,
    provider: "youtube",
    videoId: "eye_202020_rest",
    tags: ["Ocular", "Screen Break", "Palming"],
  },
  {
    id: "gc-eye-2",
    title: "Gentle Eye Mobility & Horizon Scan",
    description: "Slow horizon tracking and ocular relaxation cues for mid-work visual ease.",
    category: "quick-break",
    activityType: "eye-rest",
    durationMinutes: 2,
    provider: "youtube",
    videoId: "eye_horizon_scan",
    tags: ["Vision", "Soft Focus", "Horizon"],
  },

  // ── Physical (Movement / Desk Stretch) ──
  {
    id: "gc-stretch-1",
    title: "Seated Desk Stretch: Neck & Shoulders",
    description: "Simple seated stretches designed to relieve neck, trap, and upper-back stiffness from typing.",
    category: "quick-break",
    activityType: "stretch",
    durationMinutes: 4,
    provider: "youtube",
    videoId: "stretch_neck_shoulders",
    tags: ["Movement", "Postural", "Shoulders"],
  },
  {
    id: "gc-stretch-2",
    title: "Wrist & Forearm Mobility for Desk Workers",
    description: "Gentle wrist flexor releases and finger extensions to ease repetitive typing strain.",
    category: "quick-break",
    activityType: "stretch",
    durationMinutes: 4,
    provider: "youtube",
    videoId: "stretch_wrist_mobility",
    tags: ["Ergonomic", "Forearms", "Mobility"],
  },

  // ── Vitality (Hydration) ──
  {
    id: "gc-hydrate-1",
    title: "Mindful Hydration & Posture Reset",
    description: "A 60-second guided standing cue to step away, drink cool water, and reset your spinal posture.",
    category: "quick-break",
    activityType: "hydration",
    durationMinutes: 1,
    provider: "youtube",
    videoId: "hydrate_mindful_sip",
    tags: ["Vitality", "Stand & Sip", "Posture"],
  },

  // ── Cognition (Attention & Mind Reset) ──
  {
    id: "gc-focus-1",
    title: "5 Minute Mindfulness Meditation",
    description: "A calm 5-minute mindfulness session to gently settle your thoughts and restore a quiet baseline.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "ssss7V1_eyA",
    tags: ["Mindfulness", "Meditation", "Calm"],
  },
  {
    id: "gc-focus-2",
    title: "5 minute meditation for focus",
    description: "A 5-minute guided meditation designed to clear mental distractions and regain steady task clarity.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "zSkFFW--Ma0",
    tags: ["Focus", "Meditation", "Clarity"],
  },
  {
    id: "gc-focus-3",
    title: "5-Minute Guided Meditation: Morning Energy — SELF",
    description: "A 5-minute guided morning meditation designed to gently awaken alertness and calm focus for your day.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "DaHH--jJBtg",
    tags: ["Morning", "Meditation", "Energy"],
  },
  {
    id: "gc-focus-4",
    title: "5 Minute Focus Guided Meditation — Great Meditation",
    description: "A 5-minute session focused on anchoring your awareness and clearing mental distractions.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "2XMLEYyS4cU",
    tags: ["Focus", "Meditation", "Clarity"],
  },
  {
    id: "gc-focus-5",
    title: "5 Minute Meditation You Can Do Anywhere",
    description: "A portable 5-minute meditation practice to center your awareness during short breaks.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "inpok4MKVLM",
    tags: ["Mindfulness", "Quick Pause", "Calm"],
  },
  {
    id: "gc-focus-6",
    title: "10 Minute Guided Meditation for Beginners",
    description: "An unhurried 10-minute mindfulness practice introducing gentle breath awareness and thought observation.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 10,
    provider: "youtube",
    videoId: "TWbiDzi-rQc",
    tags: ["Mindfulness", "Beginner", "Stillness"],
  },
  {
    id: "gc-focus-7",
    title: "10 Minute Meditation to Relax the Mind — Great Meditation",
    description: "A restorative 10-minute session to quiet cognitive noise and release tension accumulated during work.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 10,
    provider: "youtube",
    videoId: "C8FetUZN5RQ",
    tags: ["Relaxation", "Quiet Mind", "Restoration"],
  },
  {
    id: "gc-focus-8",
    title: "5-minute Guided Meditation",
    description: "A concise 5-minute meditation to pause, ground yourself, and return with a refreshed perspective.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "eYm9FkWQc0Q",
    tags: ["Meditation", "Centering", "Clarity"],
  },
  {
    id: "gc-focus-9",
    title: "10 minute Mindfulness",
    description: "A 10-minute mindfulness session fostering open awareness and patient attention.",
    category: "quick-break",
    activityType: "focus-reset",
    durationMinutes: 10,
    provider: "youtube",
    videoId: "w_bmCKMrLYs",
    tags: ["Mindfulness", "Awareness", "Patience"],
  },

  // ── Restoration (Restorative Break) ──
  {
    id: "gc-walk-1",
    title: "10-Minute Screen-Free Ambient Walk",
    description: "Ambient audio companion for an unhurried physical stroll away from computers and phones.",
    category: "quick-break",
    activityType: "break",
    durationMinutes: 10,
    provider: "youtube",
    videoId: "walk_ambient_stroll",
    tags: ["Movement", "Screen Free", "Ambient"],
  },

  // ── Multi-Step Guided Sessions ──
  {
    id: "gc-morning-1",
    title: "Morning Workday Activation Routine",
    description: "Gentle multi-step morning routine establishing single-priority focus and calm momentum.",
    category: "guided-session",
    activityType: "guided-session",
    durationMinutes: 8,
    provider: "youtube",
    videoId: "session_morning_activate",
    tags: ["Morning", "Intentional", "Start Day"],
  },
  {
    id: "gc-midday-1",
    title: "Midday Mental Reset & Transition",
    description: "Guided midday pause acknowledging morning effort and centering for the afternoon.",
    category: "guided-session",
    activityType: "guided-session",
    durationMinutes: 5,
    provider: "youtube",
    videoId: "session_midday_transition",
    tags: ["Afternoon", "Re-center", "Midday"],
  },
  {
    id: "gc-deepwork-1",
    title: "Deep Work Preparation & Focus Funnel",
    description: "Focused pre-immersion guide to eliminate distractions and step cleanly into flow.",
    category: "guided-session",
    activityType: "guided-session",
    durationMinutes: 6,
    provider: "youtube",
    videoId: "session_deepwork_prep",
    tags: ["Immersion", "Deep Work", "Clarity"],
  },
  {
    id: "gc-winddown-1",
    title: "End-of-Day Workday Boundary & Closure",
    description: "Evening transition session to close work loops, tidy your space, and embrace rest.",
    category: "guided-session",
    activityType: "guided-session",
    durationMinutes: 10,
    provider: "youtube",
    videoId: "session_winddown_closure",
    tags: ["Evening", "Transition", "Rest"],
  },
];

export function getGuidedContentForActivity(
  activityType: RecoveryActivityType
): GuidedContent[] {
  return GUIDED_CONTENT_CATALOG.filter((c) => c.activityType === activityType);
}

export function getGuidedContentById(
  id: string
): GuidedContent | undefined {
  return GUIDED_CONTENT_CATALOG.find((c) => c.id === id);
}

/* ═══════════════════════════════════════════════════════════════════════
   G-R9 — Persistent Recovery Session Tracking Types
   ═══════════════════════════════════════════════════════════════════════ */

export interface RecoverySessionRecordDTO {
  id: number;
  user_id: number;
  activity_id: string;
  activity_type: string;
  activity_title: string;
  guided_content_id?: string | null;
  video_id?: string | null;
  session_start: string;
  session_end?: string | null;
  planned_duration_seconds: number;
  elapsed_duration_seconds: number;
  status: "active" | "completed" | "aborted";
  completion_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartRecoverySessionPayload {
  activity_id: string;
  activity_type: string;
  activity_title: string;
  guided_content_id?: string | null;
  video_id?: string | null;
  planned_duration_seconds: number;
}

export interface CompleteRecoverySessionPayload {
  elapsed_duration_seconds: number;
  completion_reason?: string;
}

export interface AbortRecoverySessionPayload {
  elapsed_duration_seconds: number;
  completion_reason?: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   G-R10 — Recovery History & Personalization Foundation Types
   ═══════════════════════════════════════════════════════════════════════ */

/** Per-activity usage breakdown from real session data. */
export interface ActivityUsageDTO {
  activity_id: string;
  activity_title: string;
  activity_type: string;
  session_count: number;
  completed_count: number;
  total_elapsed_seconds: number;
  average_elapsed_seconds: number;
}

/** Observed usage frequency bucketed by time of day. */
export interface RecoveryPatternDTO {
  hour_bucket: "morning" | "afternoon" | "evening" | "night";
  session_count: number;
}

/**
 * Aggregate recovery usage summary for the authenticated user.
 * All values are computed from real recovery_sessions records.
 */
export interface RecoverySummaryDTO {
  total_sessions: number;
  completed_sessions: number;
  aborted_sessions: number;
  active_sessions: number;
  /** Completion rate 0–100 rounded to 1 dp */
  completion_rate_pct: number;
  total_elapsed_seconds: number;
  total_completed_elapsed_seconds: number;
  /** Average completed-session duration in seconds */
  average_completed_duration_seconds: number;
  most_used_activity_id?: string | null;
  most_used_activity_title?: string | null;
  activity_breakdown: ActivityUsageDTO[];
  time_of_day_patterns: RecoveryPatternDTO[];
  /** Consecutive calendar days (UTC) with ≥1 completed session */
  streak_days: number;
  /** Completed + aborted sessions in the current ISO week */
  sessions_this_week: number;
}
