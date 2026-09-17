"use client";
/**
 * GroundTruthPrompt – Phase 6.5
 *
 * A non-intrusive periodic check-in that appears every 45 minutes to collect
 * self-reported stress, fatigue, and focus levels.
 *
 * These labeled samples are stored in the UserGroundTruthLabel table and will
 * be used as supervised learning targets for the future XGBoost model.
 *
 * Timing state is persisted to localStorage so it survives page reloads.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getApiUrl } from "@/lib/api";

// ─── Config ───────────────────────────────────────────────────────────────────

/** How often to show the prompt (ms). Default: 45 min */
const PROMPT_INTERVAL_MS = 45 * 60 * 1_000;

/** Snooze duration (ms). Default: 15 min */
const SNOOZE_MS = 15 * 60 * 1_000;

const LS_LAST_SHOWN = "cg_gt_last_shown";
const LS_NEXT_PROMPT = "cg_gt_next_prompt";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RatingRowProps {
  label: string;
  sublabel: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  required?: boolean;
}

function RatingRow({ label, sublabel, value, onChange, lowLabel, highLabel, required }: RatingRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-white">
          {label}
          {required && <span className="text-cyan-400 ml-0.5">*</span>}
        </span>
        {value !== null && (
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800 px-1.5 py-0.5 rounded">
            {value}/5
          </span>
        )}
      </div>
      <p className="text-[10px] text-gray-500">{sublabel}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded-lg text-xs font-bold border transition-all duration-150 ${
              value === n
                ? "bg-cyan-600 border-cyan-400 text-white shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-gray-600 font-mono px-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroundTruthPrompt() {
  const [visible, setVisible] = useState(false);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [fatigueLevel, setFatigueLevel] = useState<number | null>(null);
  const [focusLevel, setFocusLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule the next prompt
  const scheduleNext = useCallback((delayMs: number = PROMPT_INTERVAL_MS) => {
    const nextAt = Date.now() + delayMs;
    localStorage.setItem(LS_NEXT_PROMPT, String(nextAt));
  }, []);

  const openPrompt = useCallback(() => {
    setStressLevel(null);
    setFatigueLevel(null);
    setFocusLevel(null);
    setNotes("");
    setSubmitted(false);
    setError(null);
    setVisible(true);
    localStorage.setItem(LS_LAST_SHOWN, String(Date.now()));
  }, []);

  // On mount: check if it's time to show, then poll every minute
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // only show when authenticated

    const check = () => {
      const nextAt = Number(localStorage.getItem(LS_NEXT_PROMPT) || 0);
      if (Date.now() >= nextAt) {
        openPrompt();
      }
    };

    // Bootstrap: if never shown before, schedule first prompt
    if (!localStorage.getItem(LS_NEXT_PROMPT)) {
      scheduleNext();
    }

    check(); // immediate check on mount
    const interval = setInterval(check, 60_000); // re-check every minute
    return () => clearInterval(interval);
  }, [openPrompt, scheduleNext]);

  const handleSnooze = () => {
    setVisible(false);
    scheduleNext(SNOOZE_MS);
  };

  const handleDismiss = () => {
    setVisible(false);
    scheduleNext(PROMPT_INTERVAL_MS);
  };

  const handleSubmit = async () => {
    if (stressLevel === null) {
      setError("Please rate your stress level.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const base = getApiUrl();

      await axios.post(
        `${base}/biometrics/ground-truth`,
        {
          stress_level: stressLevel,
          fatigue_level: fatigueLevel,
          focus_level: focusLevel,
          notes: notes.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmitted(true);
      scheduleNext(PROMPT_INTERVAL_MS);

      // Auto-close after 2 s
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            key="gt-modal"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-[#0a0f1a] border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden"
          >
            {/* Header bar */}
            <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/30 px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-cyan-300 tracking-widest uppercase">
                  Wellness Check-in
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                How are you feeling right now?
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white">Response Saved</p>
                <p className="text-[10px] text-gray-500 text-center px-4">
                  Thank you — your label will help train CogniGuard&apos;s AI model.
                </p>
              </motion.div>
            ) : (
              <div className="px-4 py-4 space-y-4">
                <RatingRow
                  label="Stress Level"
                  sublabel="1 = Very Relaxed · 5 = Highly Stressed"
                  value={stressLevel}
                  onChange={setStressLevel}
                  lowLabel="Relaxed"
                  highLabel="Stressed"
                  required
                />

                <RatingRow
                  label="Fatigue Level"
                  sublabel="1 = Energized · 5 = Exhausted (optional)"
                  value={fatigueLevel}
                  onChange={setFatigueLevel}
                  lowLabel="Energized"
                  highLabel="Exhausted"
                />

                <RatingRow
                  label="Focus Level"
                  sublabel="1 = Very Distracted · 5 = Deep Focus (optional)"
                  value={focusLevel}
                  onChange={setFocusLevel}
                  lowLabel="Distracted"
                  highLabel="Focused"
                />

                {/* Optional note */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-mono">OPTIONAL NOTE</span>
                  <textarea
                    maxLength={200}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any context? (max 200 chars)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-600 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-[10px] text-red-400 font-mono">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSnooze}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-mono text-gray-400 border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Snooze 15m
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold text-white bg-cyan-700 hover:bg-cyan-600 border border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {submitting ? "Saving…" : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
