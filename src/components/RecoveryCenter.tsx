"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Leaf,
  Wind,
  Eye,
  Coffee,
  Footprints,
  Brain,
  Sparkles,
  Clock,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Moon,
  Sun,
  Droplets,
  BarChart2,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   G-R4/G-R7.1/G-R8 — Recovery System & Intervention Mapping Imports
════════════════════════════════════════════════════════════════════════ */
import {
  QUICK_BREAKS,
  GUIDED_SESSIONS,
  ALL_RECOVERY_ACTIVITIES,
  type RecoveryActivityModel,
  type GuidedContent,
} from "@/types/recovery";
import { RecoverySession, GuidedContentSection } from "@/components/recovery";
import { interventionsApi } from "@/lib/api";
import { getRecentRecoverySessions, getRecoverySummary } from "@/lib/recoveryApi";
import type { RecoverySessionRecordDTO, RecoverySummaryDTO } from "@/types/recovery";
import {
  mapInterventionToRecovery,
  type MappedRecoveryRecommendation,
} from "@/lib/recoveryMapping";




/* ═══════════════════════════════════════════════════════════════════════
   Organic background layer — 2D layered sanctuary atmosphere
════════════════════════════════════════════════════════════════════════ */
function SanctuaryBackground({ reduced }: { reduced: boolean }) {
  // Deep atmospheric organic depth layers
  const blobs = [
    { top: "4%",  left: "65%", w: 620, h: 520, color: "rgba(35, 65, 42, 0.22)",  delay: 0 },
    { top: "40%", left: "-8%", w: 580, h: 580, color: "rgba(22, 45, 28, 0.18)",  delay: 2 },
    { top: "68%", left: "55%", w: 540, h: 460, color: "rgba(28, 55, 36, 0.16)",  delay: 4 },
    { top: "20%", left: "25%", w: 460, h: 380, color: "rgba(230, 167, 86, 0.06)", delay: 6 }, // subtle warm amber ambient glow
  ];

  // Fine ambient dust motes (substantially restrained)
  const particles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: `${(i * 10.3 + 7) % 96}%`,
    y: `${(i * 12.7 + 10) % 90}%`,
    size: 2 + (i % 2),
    delay: i * 0.9,
    duration: 8 + (i % 3) * 2,
    color: i % 2 === 0 ? "rgba(132, 189, 144, 0.14)" : "rgba(230, 167, 86, 0.10)",
  }));

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* Base dark charcoal / deep forest */}
      <div className="absolute inset-0" style={{ background: "var(--rc-bg)" }} />

      {/* Subtle warm amber ambient lighting from top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 50% -10%, rgba(230, 167, 86, 0.07) 0%, transparent 65%)",
        }}
      />

      {/* Soft atmospheric depth — blurred natural foliage ambient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 90% 25%, rgba(45, 82, 52, 0.18) 0%, transparent 68%), radial-gradient(ellipse 60% 60% at 8% 75%, rgba(26, 52, 32, 0.16) 0%, transparent 68%)",
        }}
      />

      {/* Blurred natural foliage backdrop silhouettes */}
      <div
        className="absolute -top-24 -left-20 w-[600px] h-[600px] rounded-full opacity-40 blur-[90px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(30, 60, 38, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -right-24 w-[650px] h-[650px] rounded-full opacity-35 blur-[100px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(24, 52, 32, 0.45) 0%, transparent 70%)",
        }}
      />

      {/* Floating deep organic depth forms */}
      {!reduced &&
        blobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: b.top,
              left: b.left,
              width: b.w,
              height: b.h,
              background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
              filter: "blur(60px)",
            }}
            animate={{
              y: [0, -18, 0],
              x: [0, 8, 0],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 16 + b.delay,
              delay: b.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #5E966A 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Fine ambient dust motes */}
      {!reduced &&
        particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
            }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Hero
════════════════════════════════════════════════════════════════════════ */
function RcHero({
  reduced,
  summary,
}: {
  reduced: boolean;
  summary: RecoverySummaryDTO | null;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const timeLabel =
    hour < 12 ? "Morning session" : hour < 17 ? "Afternoon reset" : "Wind-down";

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, reduced ? 0 : -30]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl p-8 sm:p-12 backdrop-blur-xl"
      style={{
        y: heroY,
        background: "var(--rc-grad-hero)",
        border: "1px solid var(--rc-border)",
        boxShadow: "var(--rc-shadow-lift)",
      }}
    >
      {/* Inner ambient glows */}
      <div
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(94, 150, 106, 0.16) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(230, 167, 86, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Faint botanical silhouette SVG — purely decorative */}
      <svg
        aria-hidden="true"
        className="absolute right-0 bottom-0 opacity-[0.06] pointer-events-none"
        width="260"
        height="220"
        viewBox="0 0 260 220"
        fill="none"
      >
        <ellipse cx="180" cy="180" rx="90" ry="70" fill="#3E7244" />
        <ellipse cx="130" cy="120" rx="60" ry="50" fill="#5E966A" />
        <ellipse cx="200" cy="100" rx="50" ry="40" fill="#3E7244" />
        <rect x="155" y="140" width="8" height="80" rx="4" fill="#3E7244" />
        <ellipse cx="100" cy="170" rx="45" ry="35" fill="#84BD90" />
        <rect x="97" y="170" width="6" height="50" rx="3" fill="#5E966A" />
      </svg>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div className="space-y-3 flex-1">
          <p
            className="text-xs font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--rc-text-muted)" }}
          >
            {timeLabel}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold leading-snug"
            style={{ color: "var(--rc-text-primary)" }}
          >
            {greeting}.{" "}
            <span style={{ color: "var(--rc-sage-light)" }}>
              Your recovery space is ready.
            </span>
          </h1>
          <p
            className="text-sm sm:text-base max-w-md leading-relaxed"
            style={{ color: "var(--rc-text-secondary)" }}
          >
            Take a moment away from the screen. Choose a short break that fits
            where you are right now.
          </p>
        </div>

        {/* Stat pills — live summary data (G-R10) */}
        <div className="flex flex-row sm:flex-col gap-3 shrink-0 w-full sm:w-auto">
          {(summary
            ? [
                {
                  icon: BarChart2,
                  label: "This week",
                  value: summary.sessions_this_week > 0
                    ? `${summary.sessions_this_week} session${summary.sessions_this_week !== 1 ? "s" : ""}`
                    : "None yet",
                },
                {
                  icon: TrendingUp,
                  label: "Completion",
                  value: summary.total_sessions > 0
                    ? `${summary.completion_rate_pct}%`
                    : "—",
                },
                {
                  icon: CalendarDays,
                  label: "Streak",
                  value: summary.streak_days > 0
                    ? `${summary.streak_days}d`
                    : "—",
                },
              ]
            : [
                { icon: BarChart2,    label: "This week",  value: "—" },
                { icon: TrendingUp,   label: "Completion", value: "—" },
                { icon: CalendarDays, label: "Streak",     value: "—" },
              ]
          ).map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl flex-1 sm:flex-initial backdrop-blur-md"
              style={{
                background: "var(--rc-bg-card)",
                border: "1px solid var(--rc-border-card)",
                boxShadow: "var(--rc-shadow-card)",
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: "var(--rc-sage)" }}
              />
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider font-medium"
                  style={{ color: "var(--rc-text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-bold leading-tight"
                  style={{ color: "var(--rc-text-primary)" }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Recommendation banner
════════════════════════════════════════════════════════════════════════ */
function RcRecommendation({
  reduced,
  recommendation,
  isLoading,
  onBegin,
}: {
  reduced: boolean;
  recommendation: MappedRecoveryRecommendation;
  isLoading: boolean;
  onBegin: (act: RecoveryActivityModel) => void;
}) {
  const rec = recommendation.activity;
  const Icon = rec.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-6 relative overflow-hidden h-full"
      style={{
        background: "var(--rc-bg-card)",
        border: "1px solid var(--rc-border-card)",
        boxShadow: "var(--rc-shadow-card)",
      }}
    >
      {/* Eyebrow */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--rc-sage)" }} />
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--rc-text-muted)" }}
        >
          {recommendation.isRealRecommendation
            ? "Recommended For You"
            : "Suggested next break"}
        </span>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-medium ml-auto uppercase tracking-wider"
          style={{
            background: "var(--rc-sage-dim)",
            color: "var(--rc-moss)",
          }}
        >
          {isLoading ? "Evaluating..." : recommendation.badgeText}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-4 py-3">
          <div
            className="w-12 h-12 rounded-2xl animate-pulse shrink-0"
            style={{ background: "var(--rc-sage-dim)" }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-4 w-1/3 rounded animate-pulse"
              style={{ background: "var(--rc-sage-dim)" }}
            />
            <div
              className="h-3 w-4/5 rounded animate-pulse"
              style={{ background: "var(--rc-sage-dim)" }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: rec.accent,
              border: `1px solid ${rec.color}30`,
            }}
            animate={reduced ? {} : { scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="w-5 h-5" style={{ color: rec.color }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-bold mb-1"
              style={{ color: "var(--rc-text-primary)" }}
            >
              {recommendation.recommendationTitle}
            </h2>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: "var(--rc-text-secondary)" }}
            >
              {recommendation.neutralReason}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--rc-sage-dim)",
                  color: "var(--rc-moss)",
                }}
              >
                <Clock className="w-3 h-3" /> {rec.duration}
              </span>
              <button
                type="button"
                onClick={() => onBegin(rec)}
                aria-label={`Start recovery: ${recommendation.recommendationTitle}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741] cursor-pointer"
                style={{
                  background: "var(--rc-moss)",
                  color: "var(--rc-text-inverse)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "var(--rc-moss-hover)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "var(--rc-moss)")
                }
              >
                Start Recovery <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative ambient glow */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${rec.accent} 0%, transparent 70%)`,
          filter: "blur(24px)",
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Recovery History
════════════════════════════════════════════════════════════════════════ */
function formatTimeAgo(dateStr: string): string {
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffSecs = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffSecs < 60) return "Just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch (_) {
    return "Recently";
  }
}

function RcHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [realSessions, setRealSessions] = useState<RecoverySessionRecordDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchHistory = () => {
    setIsLoading(true);
    setHasError(false);
    getRecentRecoverySessions(8)
      .then((sessions) => {
        setRealSessions(sessions || []);
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const hasRealData = realSessions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-6 h-full"
      style={{
        background: "var(--rc-bg-card)",
        border: "1px solid var(--rc-border-card)",
        boxShadow: "var(--rc-shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-base font-bold"
            style={{ color: "var(--rc-text-primary)" }}
          >
            Recent Activity
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--rc-text-muted)" }}>
            {isLoading
              ? "Loading recent sessions..."
              : hasError
              ? "Unable to sync history"
              : hasRealData
              ? `Live recovery history · ${realSessions.length} recorded`
              : "Live history begins with your first session"}
          </p>
        </div>
        <TrendingUp className="w-4 h-4" style={{ color: "var(--rc-sage)" }} />
      </div>

      <div className="space-y-0">
        {isLoading ? (
          <div className="space-y-3 py-2" aria-label="Loading recent recovery history">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between py-2 border-b border-white/5 animate-pulse">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-white/10 rounded w-2/5" />
                  <div className="h-2.5 bg-white/5 rounded w-1/4" />
                </div>
                <div className="h-5 bg-white/10 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="py-6 px-4 text-center space-y-2.5 rounded-xl bg-white/[0.02] border border-white/10">
            <p className="text-xs text-[#A8BAA5]">Unable to load recent recovery history.</p>
            <button
              type="button"
              onClick={fetchHistory}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full text-[#84BD90] bg-[#84BD90]/10 hover:bg-[#84BD90]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
            >
              Retry
            </button>
          </div>
        ) : hasRealData ? (
          realSessions.map((item) => {
            const isCompleted = item.status === "completed";
            const outcomeLabel = isCompleted
              ? "Completed"
              : item.completion_reason === "reset"
              ? "Reset"
              : "Exited early";
            const minsPlanned = Math.max(1, Math.round(item.planned_duration_seconds / 60));

            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
                style={{ borderColor: "var(--rc-border-soft)" }}
              >
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--rc-text-primary)" }}
                  >
                    {item.activity_title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--rc-text-muted)" }}>
                    {formatTimeAgo(item.session_start)} · {item.elapsed_duration_seconds}s of {minsPlanned}m
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: isCompleted
                      ? "rgba(123,164,122,0.14)"
                      : "rgba(160,136,106,0.12)",
                    color: isCompleted ? "var(--rc-moss)" : "var(--rc-earth)",
                  }}
                >
                  {outcomeLabel}
                </span>
              </div>
            );
          })
        ) : (
          <div className="py-8 px-4 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
            <Clock className="w-6 h-6 mx-auto text-[#6D826B]" />
            <p className="text-xs font-semibold text-[#EFF5EC]">No recovery sessions yet</p>
            <p className="text-[11px] text-[#A8BAA5] max-w-xs mx-auto leading-relaxed">
              Complete your first mindful pause or breathing break to start tracking your recovery sessions.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   G-R10 Recovery Insights Panel
════════════════════════════════════════════════════════════════════════ */
function RcInsights({ summary }: { summary: RecoverySummaryDTO | null }) {
  if (!summary || summary.total_sessions === 0) return null;

  const BUCKET_LABELS: Record<string, string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
  };

  const topActivities = summary.activity_breakdown.slice(0, 4);
  const maxCount = topActivities[0]?.session_count || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-6"
      style={{
        background: "var(--rc-bg-card)",
        border: "1px solid var(--rc-border-card)",
        boxShadow: "var(--rc-shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--rc-text-primary)" }}>
            Usage Insights
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--rc-text-muted)" }}>
            Based on {summary.total_sessions} recorded session{summary.total_sessions !== 1 ? "s" : ""}
          </p>
        </div>
        <BarChart2 className="w-4 h-4" style={{ color: "var(--rc-sage)" }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Activity breakdown */}
        <div>
          <p
            className="text-[10px] uppercase tracking-wider font-bold mb-3"
            style={{ color: "var(--rc-text-muted)" }}
          >
            Activity Frequency
          </p>
          <div className="space-y-2.5">
            {topActivities.map((act) => {
              const pct = Math.round((act.session_count / maxCount) * 100);
              return (
                <div key={act.activity_id}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium truncate max-w-[140px]"
                      style={{ color: "var(--rc-text-secondary)" }}
                    >
                      {act.activity_title}
                    </span>
                    <span
                      className="text-xs font-bold ml-2 shrink-0"
                      style={{ color: "var(--rc-text-primary)" }}
                    >
                      {act.session_count}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--rc-bg-alt)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--rc-sage)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time-of-day patterns + summary stats */}
        <div className="space-y-5">
          {summary.time_of_day_patterns.length > 0 && (
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-bold mb-3"
                style={{ color: "var(--rc-text-muted)" }}
              >
                Peak Usage Time
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.time_of_day_patterns
                  .sort((a, b) => b.session_count - a.session_count)
                  .map((p) => (
                    <span
                      key={p.hour_bucket}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: "var(--rc-sage-dim)",
                        color: "var(--rc-moss)",
                      }}
                    >
                      {BUCKET_LABELS[p.hour_bucket] ?? p.hour_bucket}
                      {" "}
                      <span style={{ opacity: 0.7 }}>({p.session_count})</span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Compact key stats */}
          <div className="space-y-2">
            {[
              {
                label: "Avg. completed session",
                value:
                  summary.average_completed_duration_seconds > 0
                    ? `${Math.round(summary.average_completed_duration_seconds / 60)}m ${
                        Math.round(summary.average_completed_duration_seconds % 60)
                      }s`
                    : "—",
              },
              {
                label: "Total recovery time",
                value:
                  summary.total_completed_elapsed_seconds > 0
                    ? `${Math.round(summary.total_completed_elapsed_seconds / 60)}m`
                    : "—",
              },
              summary.most_used_activity_title
                ? {
                    label: "Favourite activity",
                    value: summary.most_used_activity_title,
                  }
                : null,
            ]
              .filter(Boolean)
              .map((item) => (
                <div
                  key={item!.label}
                  className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                  style={{ borderColor: "var(--rc-border-soft)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "var(--rc-text-muted)" }}
                  >
                    {item!.label}
                  </span>
                  <span
                    className="text-xs font-semibold ml-2 text-right max-w-[120px] truncate"
                    style={{ color: "var(--rc-text-primary)" }}
                  >
                    {item!.value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Guided Sessions
════════════════════════════════════════════════════════════════════════ */
function RcGuidedSessions({
  reduced,
  onBegin,
}: {
  reduced: boolean;
  onBegin: (session: RecoveryActivityModel) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--rc-text-primary)" }}
          >
            Guided Sessions
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--rc-text-muted)" }}>
            Multi-step breaks with gentle guidance
          </p>
        </div>
        <CalendarDays
          className="w-4 h-4"
          style={{ color: "var(--rc-text-muted)" }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GUIDED_SESSIONS.map((session, i) => {
          const Icon = session.icon;
          return (
            <motion.div
              key={session.id}
              role="button"
              tabIndex={0}
              aria-label={`Begin guided session: ${session.title}`}
              onClick={() => onBegin(session)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onBegin(session);
                }
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.06 * i + 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={reduced ? {} : { y: -3, transition: { duration: 0.25 } }}
              className="rounded-2xl p-6 relative overflow-hidden cursor-pointer backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B130E]"
              style={{
                background: "var(--rc-bg-card)",
                border: "1px solid var(--rc-border-card)",
                boxShadow: "var(--rc-shadow-card)",
              }}
            >
              {/* Subtle ambient accent glow */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${session.accent} 0%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />

              <div className="relative z-10 flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--rc-border-card)",
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: "var(--rc-sage-light)" }}
                  />
                </div>
                <div className="flex-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-block mb-1.5"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--rc-text-muted)",
                      border: "1px solid var(--rc-border-soft)",
                    }}
                  >
                    {session.metadata?.tag || "Session"}
                  </span>
                  <h3
                    className="text-sm font-bold mb-1"
                    style={{ color: "var(--rc-text-primary)" }}
                  >
                    {session.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--rc-text-secondary)" }}
                  >
                    {session.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--rc-text-secondary)" }}
                >
                  <Clock className="w-3 h-3" /> {session.duration}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBegin(session);
                  }}
                  aria-label={`Begin ${session.title}`}
                  className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
                  style={{
                    background: "rgba(74,103,65,0.85)",
                    color: "var(--rc-text-inverse)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(59,84,51,0.95)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(74,103,65,0.85)")
                  }
                >
                  Begin <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Activity Grid
════════════════════════════════════════════════════════════════════════ */
function RcActivityGrid({
  reduced,
  onBegin,
}: {
  reduced: boolean;
  onBegin: (act: RecoveryActivityModel) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--rc-text-primary)" }}
        >
          Quick Breaks
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--rc-text-muted)" }}>
          Short pauses — pick whatever feels right
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {QUICK_BREAKS.map((act, i) => {
          const Icon = act.icon;
          const isH = hovered === act.id;

          return (
            <motion.div
              key={act.id}
              role="button"
              tabIndex={0}
              aria-label={`Begin quick break: ${act.title}`}
              onClick={() => onBegin(act)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onBegin(act);
                }
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.06 * i + 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              onMouseEnter={() => !reduced && setHovered(act.id)}
              onMouseLeave={() => setHovered(null)}
              whileHover={reduced ? {} : { y: -3, transition: { duration: 0.25 } }}
              className="rounded-2xl p-5 cursor-pointer relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B130E]"
              style={{
                background: isH ? act.accent : "var(--rc-bg-card)",
                border: `1px solid ${
                  isH ? act.color + "40" : "var(--rc-border-card)"
                }`,
                boxShadow: isH
                  ? `0 8px 28px ${act.color}18`
                  : "var(--rc-shadow-card)",
                transition:
                  "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: act.accent,
                    border: `1px solid ${act.color}25`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: act.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-bold mb-1"
                    style={{ color: "var(--rc-text-primary)" }}
                  >
                    {act.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--rc-text-secondary)" }}
                  >
                    {act.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    background: "var(--rc-bg-alt)",
                    color: "var(--rc-text-muted)",
                  }}
                >
                  {act.duration}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBegin(act);
                  }}
                  aria-label={`Begin ${act.title}`}
                  className="text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90]"
                  style={{ background: act.color, color: "#fff" }}
                >
                  Begin
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   RecoveryEnvironment3D — dynamic import (SSR off, WebGL client only)
════════════════════════════════════════════════════════════════════════ */
const RecoveryEnvironment3D = dynamic(
  () => import("./RecoveryEnvironment3D"),
  { ssr: false, loading: () => null }
);

/* ═══════════════════════════════════════════════════════════════════════
   Shell — main export
════════════════════════════════════════════════════════════════════════ */
export default function RecoveryCenter() {
  const shouldReduce = useReducedMotion() ?? false;
  // Initialize default active session to Breathing Reset (ALL_RECOVERY_ACTIVITIES[0]) so the
  // Recovery Center immediately displays the reference image composition
  const [activeSession, setActiveSession] = useState<RecoveryActivityModel>(
    ALL_RECOVERY_ACTIVITIES[0]
  );
  const [selectedGuidedContent, setSelectedGuidedContent] = useState<GuidedContent | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // G-R10 — Recovery usage summary (real data, null = loading or empty)
  const [summary, setSummary] = useState<RecoverySummaryDTO | null>(null);

  useEffect(() => {
    let mounted = true;
    getRecoverySummary().then((data) => {
      if (mounted) setSummary(data);
    });
    return () => { mounted = false; };
  }, [historyRefreshKey]); // re-fetch after each session completes or exits

  // InterventionAgent live recommendation state (G-R8)
  const [recommendation, setRecommendation] = useState<MappedRecoveryRecommendation>(() =>
    mapInterventionToRecovery(null)
  );
  const [isLoadingRec, setIsLoadingRec] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendation = async () => {
      try {
        setIsLoadingRec(true);
        const res = await interventionsApi.evaluate();
        if (isMounted) {
          setRecommendation(mapInterventionToRecovery(res.data));
        }
      } catch {
        // Safe graceful degradation when offline, unauthenticated, or no decision
        if (isMounted) {
          setRecommendation(mapInterventionToRecovery(null));
        }
      } finally {
        if (isMounted) {
          setIsLoadingRec(false);
        }
      }
    };

    fetchRecommendation();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRecommendation();
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    return () => {
      isMounted = false;
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Launch standard pure CognitoShield session
  const handleBeginActivity = (activity: RecoveryActivityModel) => {
    setSelectedGuidedContent(null);
    setActiveSession(activity);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Launch a CognitoShield session paired with a selected guided content companion
  const handleLaunchFromGuidedContent = (content: GuidedContent) => {
    setSelectedGuidedContent(content);
    const matchingActivity =
      ALL_RECOVERY_ACTIVITIES.find((a) => a.type === content.activityType) ||
      ALL_RECOVERY_ACTIVITIES[0];
    setActiveSession(matchingActivity);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative w-full" style={{ color: "var(--rc-text-primary)" }}>
      {/* Layered background */}
      <SanctuaryBackground reduced={shouldReduce} />

      {/* Main Container: Render active cinematic sanctuary session */}
      <div className="relative z-10 w-full">
        <RcHero reduced={shouldReduce} summary={summary} />
        <RecoverySession
          activity={activeSession}
          guidedContent={selectedGuidedContent}
          initialMode={selectedGuidedContent ? "guided-content" : "sanctuary"}
          onSessionRecordSaved={() => setHistoryRefreshKey((k) => k + 1)}
          onExit={() => {
            setActiveSession(ALL_RECOVERY_ACTIVITIES[0]);
            setSelectedGuidedContent(null);
            setHistoryRefreshKey((k) => k + 1);
          }}
          onComplete={() => {
            setSelectedGuidedContent(null);
            setHistoryRefreshKey((k) => k + 1);
          }}
        />

        {/* ── Exploration & Curated Catalog Section below Sanctuary ── */}
        <div className="space-y-12 pt-8 border-t border-[rgba(132,189,144,0.15)]">
          {/* Section Heading */}
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#84BD90]" />
            <h2 className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#A8BAA5]">
              Curated Recovery Catalog &amp; Personalization
            </h2>
          </div>

          {/* Recommendation + History — 2/3 : 1/3 grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* G-R10 Insights Panel */}
              <RcInsights summary={summary} />
              <RcRecommendation
                reduced={shouldReduce}
                recommendation={recommendation}
                isLoading={isLoadingRec}
                onBegin={handleBeginActivity}
              />
            </div>
            <div className="lg:col-span-1">
              <RcHistory refreshKey={historyRefreshKey} />
            </div>
          </div>

          {/* Guided sessions */}
          <RcGuidedSessions reduced={shouldReduce} onBegin={handleBeginActivity} />

          {/* Activity grid */}
          <RcActivityGrid reduced={shouldReduce} onBegin={handleBeginActivity} />

          {/* G-R7.1 Curated Guided Content Section */}
          <GuidedContentSection
            selectedContent={selectedGuidedContent}
            onSelectContent={setSelectedGuidedContent}
            onLaunchSession={handleLaunchFromGuidedContent}
            reduced={shouldReduce}
          />

          {/* Footer note */}
          <p
            className="text-center text-xs pb-8 leading-relaxed text-[#6D826B]"
          >
            CognitoShield Recovery Sanctuary • Active Cadence 4s In • 4s Hold • 4s Out
          </p>
        </div>
      </div>
    </div>
  );
}


