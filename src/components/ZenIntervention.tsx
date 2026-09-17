"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wind,
  Coffee,
  Activity,
  Clock,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Sparkles,
  Zap,
  Bell,
  BellOff,
  Play,
} from "lucide-react";
import TiltCard from "./TiltCard";
import GuidedInterventionModal from "./GuidedInterventionModal";
import {
  interventionsApi,
  InterventionDecision,
  InterventionEffectiveness,
} from "@/lib/api";
import {
  sendInterventionNotification,
  getNotificationPermission,
  requestNotificationPermission,
  resetNotificationDeduplication,
  NotificationPermissionState,
} from "@/lib/notifications";

const POLL_INTERVAL_MS = 30000; // 30 seconds (matches telemetry snapshot window)

interface ZenInterventionProps {
  onNavigateToRecovery?: () => void;
}

export default function ZenIntervention({ onNavigateToRecovery }: ZenInterventionProps = {}) {
  const router = useRouter();
  const [decision, setDecision] = useState<InterventionDecision | null>(null);
  const [effectiveness, setEffectiveness] = useState<InterventionEffectiveness | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissedId, setDismissedId] = useState<number | string | null>(null);
  const [acknowledgedId, setAcknowledgedId] = useState<number | string | null>(null);
  const [abortedId, setAbortedId] = useState<number | string | null>(null);
  const [isSimulatingStrain, setIsSimulatingStrain] = useState(false);
  const [lastEvaluated, setLastEvaluated] = useState<Date | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>("default");
  const [isRequestingNotif, setIsRequestingNotif] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync notification permission state safely on client mount
  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  // ── Poll Intervention Agent ────────────────────────────────────────────────
  const evaluateState = useCallback(async (options?: { testStrain?: boolean; bypassCooldown?: boolean }) => {
    // Only poll if window is visible and user has a token
    if (typeof window !== "undefined") {
      if (document.visibilityState === "hidden" && !options?.testStrain) return;
      const token = localStorage.getItem("token");
      if (!token) return;
    }

    try {
      setIsEvaluating(true);
      if (options?.testStrain) {
        setIsSimulatingStrain(true);
        // Clear local dismissal/suppression when testing
        setDismissedId(null);
        setAcknowledgedId(null);
        setAbortedId(null);
        resetNotificationDeduplication();
      }

      const res = await interventionsApi.evaluate(
        options?.testStrain
          ? { test_strain: true, bypass_cooldown: true }
          : undefined
      );
      const newDecision = res.data;
      setDecision(newDecision);
      setLastEvaluated(new Date());

      // Secondary Channel: Native Browser Notification
      // Triggered when an intervention is needed, active, and not dismissed/acknowledged/aborted.
      // Gracefully checks permission andSSR support inside sendInterventionNotification with deduplication.
      const currentActiveId = newDecision.active_intervention_id ?? "active-decision";
      if (
        newDecision.intervention_needed &&
        currentActiveId !== dismissedId &&
        currentActiveId !== acknowledgedId &&
        currentActiveId !== abortedId
      ) {
        sendInterventionNotification(newDecision);
      }

      // Closed-Loop Recovery Effectiveness (Phase F)
      // Fetch latest post-recovery impact observation if user has completed interventions
      try {
        const effRes = await interventionsApi.getLatestEffectiveness();
        if (effRes.data) {
          setEffectiveness(effRes.data);
        }
      } catch {
        // Safe graceful degradation
      }
    } catch (err: unknown) {
      // Gracefully handle unauthenticated or backend-unavailable states
      // Do not throw or spam errors to UI
    } finally {
      setIsEvaluating(false);
      setIsSimulatingStrain(false);
    }
  }, [dismissedId, acknowledgedId, abortedId]);

  useEffect(() => {
    evaluateState();

    pollTimerRef.current = setInterval(evaluateState, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        evaluateState();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [evaluateState]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleAcknowledge = async () => {
    if (!decision) return;
    const interventionId = decision.active_intervention_id;
    const activeKey = interventionId ?? "active-decision";

    setIsAcknowledging(true);
    try {
      if (interventionId && typeof interventionId === "number" && interventionId > 0) {
        await interventionsApi.acknowledge(interventionId);
      }
      setAcknowledgedId(activeKey);
      resetNotificationDeduplication();
    } catch (err) {
      console.error("Failed to acknowledge intervention:", err);
      // Still close popup on failure to avoid trapping user
      setAcknowledgedId(activeKey);
      resetNotificationDeduplication();
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleDismiss = async () => {
    if (!decision) return;
    const interventionId = decision.active_intervention_id;
    const activeKey = interventionId ?? "active-decision";

    setIsDismissing(true);
    try {
      if (interventionId && typeof interventionId === "number" && interventionId > 0) {
        await interventionsApi.dismiss(interventionId, "User dismissed from in-app popup");
      }
      setDismissedId(activeKey);
      resetNotificationDeduplication();
    } catch (err) {
      console.error("Failed to dismiss intervention:", err);
      // Still close popup on failure
      setDismissedId(activeKey);
      resetNotificationDeduplication();
    } finally {
      setIsDismissing(false);
    }
  };

  const handleRequestNotification = async () => {
    setIsRequestingNotif(true);
    try {
      const res = await requestNotificationPermission();
      setNotifPermission(res);
    } finally {
      setIsRequestingNotif(false);
    }
  };

  const handleStartBreak = async () => {
    // Acknowledge intervention to prevent duplicate prompts and register user action
    if (decision?.active_intervention_id && typeof decision.active_intervention_id === "number" && decision.active_intervention_id > 0) {
      try {
        await interventionsApi.acknowledge(decision.active_intervention_id);
      } catch (err) {
        console.warn("Failed to acknowledge on start recovery:", err);
      }
    }
    const activeKey = decision?.active_intervention_id ?? "active-decision";
    setAcknowledgedId(activeKey);
    resetNotificationDeduplication();

    if (onNavigateToRecovery) {
      onNavigateToRecovery();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("navigate-tab", { detail: { tab: "recovery" } })
      );
      router.push("/dashboard?tab=recovery");
    } else {
      setIsRecoveryModalOpen(true);
    }
  };

  const handleRecoveryComplete = async () => {
    await handleAcknowledge();
    setIsRecoveryModalOpen(false);
    await evaluateState();
  };

  const handleRecoveryAbort = async () => {
    setIsRecoveryModalOpen(false);
    if (!decision) return;
    const interventionId = decision.active_intervention_id;
    const activeKey = interventionId ?? "active-decision";
    setAbortedId(activeKey);
    resetNotificationDeduplication();
    if (interventionId && typeof interventionId === "number" && interventionId > 0) {
      try {
        await interventionsApi.abort(interventionId, "User exited recovery early");
      } catch (err) {
        console.error("Failed to abort intervention:", err);
      }
    }
    await evaluateState();
  };

  // ── State Computations ─────────────────────────────────────────────────────
  const activeId = decision?.active_intervention_id ?? "active-decision";
  const isInterventionActive = Boolean(
    decision &&
      decision.intervention_needed &&
      activeId !== dismissedId &&
      activeId !== acknowledgedId &&
      activeId !== abortedId &&
      !isRecoveryModalOpen
  );

  const severity = decision?.severity?.toUpperCase() || "NONE";

  // Severity-tailored styling tokens
  const getSeverityTheme = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return {
          border: "border-rose-500/40",
          glow: "shadow-[0_0_30px_rgba(244,63,94,0.35)]",
          badge: "bg-rose-500/15 border-rose-500/40 text-rose-300",
          accentText: "text-rose-400",
          buttonBg: "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]",
          iconBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        };
      case "HIGH":
        return {
          border: "border-orange-500/40",
          glow: "shadow-[0_0_25px_rgba(249,115,22,0.25)]",
          badge: "bg-orange-500/15 border-orange-500/40 text-orange-300",
          accentText: "text-orange-400",
          buttonBg: "bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]",
          iconBg: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        };
      case "MODERATE":
        return {
          border: "border-amber-500/40",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
          badge: "bg-amber-500/15 border-amber-500/40 text-amber-300",
          accentText: "text-amber-400",
          buttonBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]",
          iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        };
      case "LOW":
      default:
        return {
          border: "border-cyan-500/40",
          glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)]",
          badge: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
          accentText: "text-cyan-400",
          buttonBg: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]",
          iconBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        };
    }
  };

  const theme = getSeverityTheme(severity);

  // Intervention type icon helper
  const getInterventionIcon = (type: string, className = "w-5 h-5") => {
    switch (type.toLowerCase()) {
      case "walk":
      case "deep_rest":
        return <Activity className={className} />;
      case "micro_break":
        return <Coffee className={className} />;
      case "breathing":
        return <Wind className={className} />;
      case "hydration":
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <>
      {/* ── 1. In-Place Dashboard Proactive Recovery Card ────────────────────── */}
      <TiltCard>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-cyan-500/40"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Card Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">AI Intervention Sentinel</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Autonomous Care Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Subtle Browser Notification Control */}
              {notifPermission !== "unsupported" && (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  disabled={notifPermission === "denied" || notifPermission === "granted" || isRequestingNotif}
                  className={`relative p-1.5 rounded-lg border transition-colors ${
                    notifPermission === "granted"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                      : notifPermission === "denied"
                      ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                      : "bg-white/5 border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 cursor-pointer"
                  }`}
                  title={
                    notifPermission === "granted"
                      ? "Desktop alerts active"
                      : notifPermission === "denied"
                      ? "Desktop alerts blocked in browser settings"
                      : "Click to enable desktop alerts"
                  }
                >
                  {isRequestingNotif ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : notifPermission === "denied" ? (
                    <BellOff className="w-3.5 h-3.5" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  {notifPermission === "granted" && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              )}

              {/* Safe Dev Test Verification Button */}
              <button
                type="button"
                onClick={() => evaluateState({ testStrain: true, bypassCooldown: true })}
                disabled={isEvaluating || isSimulatingStrain}
                className="px-2 py-0.5 rounded text-[9px] font-mono border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Safe development verification: test intervention popup and browser notification"
              >
                {isSimulatingStrain ? "Testing..." : "Simulate Strain"}
              </button>

              {isEvaluating ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE
                </div>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="space-y-3 relative z-10">
            {isInterventionActive ? (
              <div className={`p-3 rounded-xl border ${theme.border} bg-white/[0.03] space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${theme.badge}`}>
                    {decision?.severity} SEVERITY
                  </span>
                  {decision?.recommended_duration_mins ? (
                    <span className="text-xs font-mono text-gray-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {decision.recommended_duration_mins}m rest
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-medium text-white line-clamp-2">
                  {decision?.title}
                </p>
                <p className="text-[11px] text-gray-400 line-clamp-1 italic">
                  {decision?.reason}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartBreak}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${theme.buttonBg}`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Recovery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecoveryModalOpen(true)}
                    className="py-1.5 px-3 rounded-lg text-xs font-mono text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Open Quick In-Modal Guided Session"
                  >
                    Quick Guide
                  </button>
                </div>
              </div>
            ) : decision?.cooldown_active ? (
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Recovery Window Active</span>
                  <span className="text-[10px] font-mono text-cyan-400">COOLDOWN</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Intervention suppressed to prevent fatigue. Systems are resting.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-300 leading-relaxed">
                Cognitive telemetry is being analyzed in real-time. Smart micro-breaks and guided recovery triggers will surface when strain thresholds are detected.
              </p>
            )}

            {/* Recovery Impact (Phase F Closed Loop) */}
            {effectiveness && (decision?.cooldown_active || effectiveness.has_sufficient_data) && (
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    Recovery Impact
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      effectiveness.result === "IMPROVED"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : effectiveness.result === "DECLINED"
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : effectiveness.result === "STABLE"
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {effectiveness.result === "INSUFFICIENT_DATA"
                      ? "OBSERVING"
                      : effectiveness.result}
                  </span>
                </div>

                {effectiveness.has_sufficient_data ? (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      {effectiveness.metrics.stress_level && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-1.5">
                          <span className="text-gray-400 block text-[9px] uppercase">Stress</span>
                          <span
                            className={`font-bold ${
                              effectiveness.metrics.stress_level.improved
                                ? "text-emerald-400"
                                : "text-gray-300"
                            }`}
                          >
                            {effectiveness.metrics.stress_level.delta_pct !== null &&
                            effectiveness.metrics.stress_level.delta_pct !== undefined
                              ? `${effectiveness.metrics.stress_level.delta_pct <= 0 ? "↓" : "↑"} ${Math.abs(
                                  effectiveness.metrics.stress_level.delta_pct
                                )}%`
                              : `${effectiveness.metrics.stress_level.after}%`}
                          </span>
                        </div>
                      )}

                      {effectiveness.metrics.typing_speed && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-1.5">
                          <span className="text-gray-400 block text-[9px] uppercase">Typing</span>
                          <span
                            className={`font-bold ${
                              effectiveness.metrics.typing_speed.improved
                                ? "text-emerald-400"
                                : "text-gray-300"
                            }`}
                          >
                            {effectiveness.metrics.typing_speed.delta_pct !== null &&
                            effectiveness.metrics.typing_speed.delta_pct !== undefined
                              ? `${effectiveness.metrics.typing_speed.delta_pct >= 0 ? "↑" : "↓"} ${Math.abs(
                                  effectiveness.metrics.typing_speed.delta_pct
                                )}%`
                              : `${effectiveness.metrics.typing_speed.after} WPM`}
                          </span>
                        </div>
                      )}

                      {effectiveness.metrics.focus_reserves && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-1.5">
                          <span className="text-gray-400 block text-[9px] uppercase">Focus</span>
                          <span
                            className={`font-bold ${
                              effectiveness.metrics.focus_reserves.improved
                                ? "text-emerald-400"
                                : "text-gray-300"
                            }`}
                          >
                            {effectiveness.metrics.focus_reserves.delta_pct !== null &&
                            effectiveness.metrics.focus_reserves.delta_pct !== undefined
                              ? `${effectiveness.metrics.focus_reserves.delta_pct >= 0 ? "↑" : "↓"} ${Math.abs(
                                  effectiveness.metrics.focus_reserves.delta_pct
                                )}%`
                              : `${effectiveness.metrics.focus_reserves.after}%`}
                          </span>
                        </div>
                      )}

                      {effectiveness.metrics.error_bursts && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-1.5">
                          <span className="text-gray-400 block text-[9px] uppercase">Errors</span>
                          <span
                            className={`font-bold ${
                              effectiveness.metrics.error_bursts.improved
                                ? "text-emerald-400"
                                : "text-gray-300"
                            }`}
                          >
                            {effectiveness.metrics.error_bursts.delta_pct !== null &&
                            effectiveness.metrics.error_bursts.delta_pct !== undefined
                              ? `${effectiveness.metrics.error_bursts.delta_pct <= 0 ? "↓" : "↑"} ${Math.abs(
                                  effectiveness.metrics.error_bursts.delta_pct
                                )}%`
                              : `${effectiveness.metrics.error_bursts.after}/m`}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight italic pt-0.5">
                      {effectiveness.summary}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-0.5 text-[11px] text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Observing post-recovery telemetry...</span>
                  </div>
                )}
              </div>
            )}

            {/* Status Footer */}
            <div className="flex justify-between items-center border-t border-white/10 pt-3 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isInterventionActive
                      ? "bg-amber-400 animate-ping"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="text-gray-400">
                  {isInterventionActive
                    ? "INTERVENTION REQUIRED"
                    : "OPTIMAL STATE"}
                </span>
              </div>
              <span className="text-gray-400">
                {lastEvaluated
                  ? `Sync: ${lastEvaluated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Syncing..."}
              </span>
            </div>
          </div>
        </motion.div>
      </TiltCard>

      {/* ── 2. Floating Premium In-App Intervention Popup ───────────────────── */}
      <AnimatePresence>
        {isInterventionActive && decision && (
          <motion.aside
            aria-label="Cognitive Intervention Alert"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] sm:w-[420px]"
          >
            <div
              className={`bg-[#0B0F17]/95 backdrop-blur-2xl border ${theme.border} ${theme.glow} rounded-2xl p-5 relative overflow-hidden shadow-2xl`}
            >
              {/* Radial ambient glow */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 relative z-10 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.iconBg} shadow-inner`}
                  >
                    {getInterventionIcon(decision.intervention_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${theme.badge}`}
                      >
                        {decision.severity} INTERVENTION
                      </span>
                      {decision.recommended_duration_mins ? (
                        <span className="text-[11px] font-mono text-gray-300 flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {decision.recommended_duration_mins} mins
                        </span>
                      ) : null}
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">
                      {decision.title}
                    </h4>
                  </div>
                </div>

                {/* Dismiss X button */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isDismissing}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Dismiss Intervention"
                >
                  {isDismissing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Message & Explainable Reason */}
              <div className="relative z-10 space-y-2 mb-4">
                <p className="text-xs text-gray-200 leading-relaxed font-normal">
                  {decision.message}
                </p>

                {decision.reason && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-400 leading-tight">
                      <span className="text-gray-300 font-semibold font-mono">Agent Reasoning: </span>
                      {decision.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                  <ShieldAlert className="w-3 h-3 text-cyan-400" />
                  <span>CognitoShield Care</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    disabled={isDismissing || isAcknowledging}
                    className="px-3.5 py-1.5 text-xs font-mono text-gray-300 hover:text-white hover:bg-white/10 border border-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    {isDismissing ? "Dismissing..." : "Dismiss"}
                  </button>

                  <button
                    type="button"
                    onClick={handleStartBreak}
                    disabled={isDismissing || isAcknowledging}
                    className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${theme.buttonBg}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Start Recovery</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── 3. Full-Screen Guided Recovery Modal Overlay ─────────────────────── */}
      {decision && (
        <GuidedInterventionModal
          isOpen={isRecoveryModalOpen}
          decision={decision}
          onComplete={handleRecoveryComplete}
          onExit={handleRecoveryAbort}
        />
      )}
    </>
  );
}
