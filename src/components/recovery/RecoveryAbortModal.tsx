"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, Play } from "lucide-react";

interface RecoveryAbortModalProps {
  isOpen: boolean;
  onConfirmAbort: () => void;
  onCancel: () => void;
  elapsedTimeLabel: string;
}

export default function RecoveryAbortModal({
  isOpen,
  onConfirmAbort,
  onCancel,
  elapsedTimeLabel,
}: RecoveryAbortModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap & escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel ("Keep Going") by default to prevent accidental abort
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab") {
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean) as HTMLButtonElement[];
        if (focusable.length < 2) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="abort-modal-title"
          aria-describedby="abort-modal-desc"
        >
          {/* Backdrop with soft blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(18, 28, 22, 0.95)",
              border: "1px solid rgba(132, 189, 144, 0.25)",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(94, 150, 106, 0.15)",
            }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(230, 167, 86, 0.18)",
                  border: "1px solid rgba(230, 167, 86, 0.35)",
                }}
                aria-hidden="true"
              >
                <AlertCircle className="w-5 h-5 text-[#E6A756]" />
              </div>

              <div>
                <h3
                  id="abort-modal-title"
                  className="text-lg font-bold text-[#EFF5EC]"
                >
                  Exit session early?
                </h3>
                <p
                  id="abort-modal-desc"
                  className="text-xs text-[#A8BAA5] mt-1 leading-relaxed"
                >
                  You have rested for <strong className="font-semibold text-[#EFF5EC]">{elapsedTimeLabel}</strong>. Exiting now will mark this session as aborted.
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5 mb-6 text-xs leading-relaxed text-[#A8BAA5]"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px dashed rgba(132, 189, 144, 0.2)",
              }}
            >
              You can always take another mindful recovery break whenever you need to refresh focus.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 flex-wrap">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onCancel}
                aria-label="Keep going with session"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84BD90] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121C16]"
                style={{
                  background: "#4A6741",
                  color: "#EFF5EC",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#3D5535")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#4A6741")}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Keep Going</span>
              </button>

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={onConfirmAbort}
                aria-label="Confirm exit and abort session"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6A756] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121C16]"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#A8BAA5",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EFF5EC";
                  e.currentTarget.style.borderColor = "rgba(230, 167, 86, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#A8BAA5";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit &amp; Abort</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
