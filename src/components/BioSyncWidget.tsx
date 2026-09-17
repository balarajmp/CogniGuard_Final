"use client";
/**
 * BioSyncWidget – Phase 6.5
 *
 * Collects REAL browser interaction telemetry and transmits 30-second
 * aggregated payloads via the existing WebSocket pipeline.
 *
 * Privacy guarantees:
 *   ✓ Keyboard timing only – zero characters are stored or transmitted
 *   ✓ Password fields are skipped automatically
 *   ✓ No clipboard, selection, or paste content
 *   ✓ All values are numerical behavioral metadata
 */

import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import TiltCard from "./TiltCard";
import { getBiometricWS } from "@/lib/ws";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveStats {
  wpm: number;
  mouseVel: number;
  idleRatio: number;
  clicks: number;
  scrollPx: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Aggregation window in milliseconds (30 seconds per spec) */
const WINDOW_MS = 30_000;

/** Idle threshold: no interaction for this many ms → user is idle */
const IDLE_THRESHOLD_MS = 5_000;

/** How often the idle accumulator polls (ms) */
const IDLE_POLL_MS = 200;

/** Sub-window size for WPM variance calculation (ms) */
const SUB_WINDOW_MS = 5_000;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BioSyncWidget() {
  // Live display stats (updated every 5 s for UI responsiveness)
  const [liveStats, setLiveStats] = useState<LiveStats>({
    wpm: 0,
    mouseVel: 0,
    idleRatio: 0,
    clicks: 0,
    scrollPx: 0,
  });
  const [wsConnected, setWsConnected] = useState(false);

  // Slider value – only transmitted when user explicitly moves it
  const [userStress, setUserStress] = useState<number>(3);
  const [stressSubmitted, setStressSubmitted] = useState(false);
  const pendingStressRef = useRef<number | null>(null); // set on slider change, cleared after send

  // ── Mouse accumulators ──
  const mouseDistRef = useRef(0);
  const mouseVelocitiesRef = useRef<number[]>([]);
  const mouseClicksRef = useRef(0);
  const doubleClicksRef = useRef(0);
  const rightClicksRef = useRef(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMouseTimeRef = useRef<number | null>(null);
  const prevMouseVelRef = useRef<number | null>(null); // for acceleration
  const mouseAccelerationsRef = useRef<number[]>([]);

  // ── Keyboard accumulators (timing only) ──
  const keystrokeCountRef = useRef(0);
  const backspaceCountRef = useRef(0);
  const keyDownTimesRef = useRef<Map<string, number>>(new Map()); // key → keydown timestamp
  const keyHoldDurationsRef = useRef<number[]>([]);
  const interKeyDelaysRef = useRef<number[]>([]);
  const lastKeyDownTimeRef = useRef<number | null>(null);
  // Sub-window WPM tracking for variance
  const subWindowKeyCountsRef = useRef<number[]>([]); // keystroke count per sub-window
  const subWindowStartRef = useRef<number>(Date.now());
  const subWindowCurrentRef = useRef(0);

  // ── Scroll accumulators ──
  const scrollDistRef = useRef(0);
  const scrollSpeedsRef = useRef<number[]>([]);
  const scrollAccelerationsRef = useRef<number[]>([]);
  const lastScrollYRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number | null>(null);
  const prevScrollSpeedRef = useRef<number | null>(null);

  // ── Session / idle ──
  const lastInteractionTimeRef = useRef(Date.now());
  const idleMsRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const focusBlurEventsRef = useRef(0);
  const pageVisibilityChangesRef = useRef(0);

  // ── Helpers ──
  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const variance = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const m = avg(arr);
    return arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
  };

  const resetAccumulators = useCallback(() => {
    mouseDistRef.current = 0;
    mouseVelocitiesRef.current = [];
    mouseClicksRef.current = 0;
    doubleClicksRef.current = 0;
    rightClicksRef.current = 0;
    mouseAccelerationsRef.current = [];
    prevMouseVelRef.current = null;

    keystrokeCountRef.current = 0;
    backspaceCountRef.current = 0;
    keyHoldDurationsRef.current = [];
    interKeyDelaysRef.current = [];
    subWindowKeyCountsRef.current = [];
    subWindowCurrentRef.current = 0;
    subWindowStartRef.current = Date.now();

    scrollDistRef.current = 0;
    scrollSpeedsRef.current = [];
    scrollAccelerationsRef.current = [];
    prevScrollSpeedRef.current = null;

    focusBlurEventsRef.current = 0;
    pageVisibilityChangesRef.current = 0;
    idleMsRef.current = 0;
  }, []);

  useEffect(() => {
    const ws = getBiometricWS();
    ws.connect();

    // Track WS connection state
    const unsubWS = ws.on("connection_status", (msg) => {
      setWsConnected(!!(msg.payload as { connected: boolean }).connected);
    });

    // ── Mouse ──────────────────────────────────────────────────────────────

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      lastInteractionTimeRef.current = now;

      if (lastMousePosRef.current && lastMouseTimeRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        mouseDistRef.current += dist;

        const dt = now - lastMouseTimeRef.current;
        if (dt > 0) {
          const vel = dist / dt; // pixels per ms
          mouseVelocitiesRef.current.push(vel);

          if (prevMouseVelRef.current !== null && dt > 0) {
            mouseAccelerationsRef.current.push(
              Math.abs(vel - prevMouseVelRef.current) / dt
            );
          }
          prevMouseVelRef.current = vel;
        }
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      lastMouseTimeRef.current = now;
    };

    const handleClick = () => {
      lastInteractionTimeRef.current = Date.now();
      mouseClicksRef.current += 1;
    };

    const handleDblClick = () => {
      doubleClicksRef.current += 1;
    };

    const handleContextMenu = () => {
      rightClicksRef.current += 1;
    };

    // ── Keyboard (timing only – NO characters stored) ───────────────────

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip password fields for privacy
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type === "password") return;

      const now = Date.now();
      lastInteractionTimeRef.current = now;
      keystrokeCountRef.current += 1;
      subWindowCurrentRef.current += 1;

      if (e.key === "Backspace" || e.key === "Delete") {
        backspaceCountRef.current += 1;
      }

      // Inter-key delay
      if (lastKeyDownTimeRef.current !== null) {
        const delay = now - lastKeyDownTimeRef.current;
        if (delay < 2000) { // ignore gaps >2s (user paused)
          interKeyDelaysRef.current.push(delay);
        }
      }
      lastKeyDownTimeRef.current = now;

      // Store key down time for hold duration (use key+code to handle repeated keys)
      const keyId = `${e.code}_${now}`;
      keyDownTimesRef.current.set(keyId, now);
      // Clean old entries (>3 s) to avoid memory bloat
      const cutoff = now - 3000;
      for (const [k, t] of keyDownTimesRef.current) {
        if (t < cutoff) keyDownTimesRef.current.delete(k);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type === "password") return;

      const now = Date.now();
      // Match earliest unmatched keydown for this code
      for (const [keyId, downTime] of keyDownTimesRef.current) {
        if (keyId.startsWith(e.code + "_")) {
          const hold = now - downTime;
          if (hold > 0 && hold < 2000) {
            keyHoldDurationsRef.current.push(hold);
          }
          keyDownTimesRef.current.delete(keyId);
          break;
        }
      }
    };

    // ── Scroll ─────────────────────────────────────────────────────────────

    const handleScroll = () => {
      const now = Date.now();
      lastInteractionTimeRef.current = now;
      const curY = window.scrollY;

      if (lastScrollYRef.current !== null && lastScrollTimeRef.current !== null) {
        const dist = Math.abs(curY - lastScrollYRef.current);
        scrollDistRef.current += dist;

        const dt = now - lastScrollTimeRef.current;
        if (dt > 0) {
          const speed = dist / dt;
          scrollSpeedsRef.current.push(speed);

          if (prevScrollSpeedRef.current !== null) {
            scrollAccelerationsRef.current.push(
              Math.abs(speed - prevScrollSpeedRef.current) / dt
            );
          }
          prevScrollSpeedRef.current = speed;
        }
      }

      lastScrollYRef.current = curY;
      lastScrollTimeRef.current = now;
    };

    // ── Focus / Visibility ─────────────────────────────────────────────────

    const handleFocus = () => {
      focusBlurEventsRef.current += 1;
      lastInteractionTimeRef.current = Date.now();
    };
    const handleBlur = () => {
      focusBlurEventsRef.current += 1;
    };
    const handleVisibilityChange = () => {
      pageVisibilityChangesRef.current += 1;
      if (!document.hidden) lastInteractionTimeRef.current = Date.now();
    };

    // ── Register listeners ─────────────────────────────────────────────────

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("dblclick", handleDblClick, { passive: true });
    window.addEventListener("contextmenu", handleContextMenu, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("keyup", handleKeyUp, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("focus", handleFocus, { passive: true });
    window.addEventListener("blur", handleBlur, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange, { passive: true });

    // ── Sub-window WPM slicer ──────────────────────────────────────────────
    // Every SUB_WINDOW_MS we snapshot the keystroke count for variance calculation
    const subWindowInterval = setInterval(() => {
      const elapsed = Date.now() - subWindowStartRef.current;
      if (elapsed > 0) {
        const subWpm = (subWindowCurrentRef.current / 5) * (60_000 / elapsed);
        subWindowKeyCountsRef.current.push(subWpm);
      }
      subWindowCurrentRef.current = 0;
      subWindowStartRef.current = Date.now();
    }, SUB_WINDOW_MS);

    // ── Idle accumulator ───────────────────────────────────────────────────
    const idleInterval = setInterval(() => {
      if (Date.now() - lastInteractionTimeRef.current > IDLE_THRESHOLD_MS) {
        idleMsRef.current += IDLE_POLL_MS;
      }
    }, IDLE_POLL_MS);

    // ── Live stats update for UI (every 5 s) ──────────────────────────────
    const uiInterval = setInterval(() => {
      const velArr = mouseVelocitiesRef.current;
      const avgVel = avg(velArr);
      const elapsedS = (Date.now() - sessionStartRef.current) / 1000;
      const idleSec = idleMsRef.current / 1000;

      setLiveStats({
        wpm: Math.round((keystrokeCountRef.current / 5) * (60_000 / WINDOW_MS)),
        mouseVel: Math.round(avgVel * 1000) / 1000,
        idleRatio: elapsedS > 0 ? Math.min(1, idleSec / elapsedS) : 0,
        clicks: mouseClicksRef.current,
        scrollPx: Math.round(scrollDistRef.current),
      });
    }, 5_000);

    // ── 30-second telemetry dispatch ───────────────────────────────────────
    const telemetryInterval = setInterval(() => {
      const now = Date.now();
      const windowSec = WINDOW_MS / 1000;

      // Derived metrics
      const wpmRaw = (keystrokeCountRef.current / 5) * (60 / windowSec);
      const avgMouseVel = avg(mouseVelocitiesRef.current);
      const avgMouseAccel = avg(mouseAccelerationsRef.current);
      const avgScrollSpeed = avg(scrollSpeedsRef.current);
      const avgScrollAccel = avg(scrollAccelerationsRef.current);
      const avgTypingCadence = avg(interKeyDelaysRef.current);
      const interKeyVar = variance(interKeyDelaysRef.current);
      const avgKeyHold = avg(keyHoldDurationsRef.current);
      const backspacePerMin = (backspaceCountRef.current / windowSec) * 60;
      const wpmVariance = variance(subWindowKeyCountsRef.current);
      const errorBurstPerMin = (backspaceCountRef.current / windowSec) * 60;
      const idleSeconds = idleMsRef.current / 1000;
      const sessionSecs = (now - sessionStartRef.current) / 1000;

      const payload: Record<string, number | null> = {
        // Keyboard
        typing_speed_wpm: wpmRaw > 0 ? wpmRaw : null,
        error_burst_per_min: errorBurstPerMin,
        typing_cadence_ms: avgTypingCadence > 0 ? avgTypingCadence : null,
        inter_key_delay_var: interKeyVar,
        key_hold_duration_avg: avgKeyHold > 0 ? avgKeyHold : null,
        backspace_freq: backspacePerMin,
        typing_speed_variance: wpmVariance,

        // Mouse
        mouse_velocity: avgMouseVel,
        mouse_acceleration: avgMouseAccel,
        mouse_clicks: mouseClicksRef.current,
        double_clicks: doubleClicksRef.current,
        right_clicks: rightClicksRef.current,

        // Scroll
        scroll_distance: scrollDistRef.current,
        scroll_speed: avgScrollSpeed > 0 ? avgScrollSpeed : null,
        scroll_acceleration: avgScrollAccel,

        // Session
        focus_blur_events: focusBlurEventsRef.current,
        page_visibility_changes: pageVisibilityChangesRef.current,
        idle_time_seconds: idleSeconds,
        active_session_duration: sessionSecs,

        // Physiological – null (no hardware sensor connected)
        heart_rate_bpm: null,
        hrv_ms: null,
        facial_fatigue_score: null,
        ambient_noise_db: null,
        luminance_pct: null,
      };

      // Attach pending stress label only if user changed the slider
      if (pendingStressRef.current !== null) {
        payload.user_reported_stress = pendingStressRef.current;
        pendingStressRef.current = null;
      }

      if (ws.connected) {
        ws.send(payload);
      }

      resetAccumulators();
    }, WINDOW_MS);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("dblclick", handleDblClick);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(subWindowInterval);
      clearInterval(idleInterval);
      clearInterval(uiInterval);
      clearInterval(telemetryInterval);
      unsubWS();
    };
  }, [resetAccumulators]);

  // When slider changes, stage the new value – it will be sent in the next 30 s window
  const handleStressChange = (value: number) => {
    setUserStress(value);
    pendingStressRef.current = value;
    setStressSubmitted(false);
  };

  const handleStressSubmit = () => {
    pendingStressRef.current = userStress;
    setStressSubmitted(true);
    setTimeout(() => setStressSubmitted(false), 3000);
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const idlePct = Math.round(liveStats.idleRatio * 100);
  const activePct = 100 - idlePct;

  return (
    <TiltCard>
      <motion.div
        whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(6,182,212,0.6)" }}
        className="bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-[pulse_1.5s_ease-in-out_infinite]">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white tracking-wide">Bio-Sync</h3>
            <p className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
              Real Interaction Telemetry
            </p>
          </div>
          {/* Connection badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono border ${
            wsConnected
              ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
              : "bg-red-950/60 border-red-700 text-red-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            {wsConnected ? "LIVE" : "OFFLINE"}
          </div>
        </div>

        {/* Live behavioral metrics grid */}
        <div className="flex-1 flex flex-col justify-center relative z-10 space-y-3">
          {/* Animated heartbeat-style bar */}
          <div className="w-full h-8 relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 30">
              <motion.path
                d="M0 15 L18 15 L22 4 L27 26 L32 15 L46 15 L50 8 L55 22 L60 15 L74 15 L78 2 L83 28 L88 15 L100 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>

          {/* Real behavioral stats — no fake values */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/10 pt-3">
            <div>
              <p className="text-[9px] font-mono text-gray-500 mb-0.5 tracking-widest">TYPING SPEED</p>
              <p className="text-lg font-black text-white">
                {liveStats.wpm} <span className="text-xs font-normal text-cyan-500">WPM</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-gray-500 mb-0.5 tracking-widest">MOUSE VEL</p>
              <p className="text-lg font-black text-white">
                {(liveStats.mouseVel * 1000).toFixed(0)} <span className="text-xs font-normal text-cyan-500">px/s</span>
              </p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-gray-500 mb-0.5 tracking-widest">ACTIVE TIME</p>
              <p className="text-lg font-black text-white">
                {activePct}<span className="text-xs font-normal text-cyan-500">%</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-gray-500 mb-0.5 tracking-widest">CLICKS / WIN</p>
              <p className="text-lg font-black text-white">
                {liveStats.clicks} <span className="text-xs font-normal text-cyan-500">clicks</span>
              </p>
            </div>
          </div>

          {/* 30-s window indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-0.5 bg-gray-800 rounded overflow-hidden">
              <motion.div
                className="h-full bg-cyan-500"
                animate={{ scaleX: [0, 1] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            </div>
            <span className="text-[9px] font-mono text-gray-600">30s window</span>
          </div>

          {/* Self-report stress slider */}
          <div className="border-t border-white/10 pt-3 mt-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-gray-400 tracking-wider">HOW STRESSED ARE YOU?</span>
              <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800 px-2 py-0.5 rounded">
                {userStress} / 5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={userStress}
              onChange={(e) => handleStressChange(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>Very Relaxed</span>
              <span>Neutral</span>
              <span>Highly Stressed</span>
            </div>
            <button
              onClick={handleStressSubmit}
              className={`mt-1 w-full py-1.5 rounded-lg text-[10px] font-mono tracking-widest border transition-all duration-200 ${
                stressSubmitted
                  ? "bg-emerald-900/40 border-emerald-600 text-emerald-400"
                  : "bg-cyan-900/30 border-cyan-700 text-cyan-300 hover:bg-cyan-800/50 hover:border-cyan-500 active:scale-95"
              }`}
            >
              {stressSubmitted ? "✓ LOGGED – SENT NEXT WINDOW" : "LOG STRESS LABEL"}
            </button>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}
