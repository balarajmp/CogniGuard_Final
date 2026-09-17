"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, Sparkles, Leaf, Sun } from "lucide-react";
import type { RecoveryActivityModel } from "@/types/recovery";

interface RecoverySessionHeaderProps {
  activity: RecoveryActivityModel;
  onExit: () => void;
  statusLabel?: string;
}

/**
 * RecoverySessionHeader
 *
 * Cinematic top bar matching reference image:
 * Left: Leaf icon + MIND & FOCUS RECOVERY CENTER + Subtitle
 * Right: "Take a break · Reset · Be present" pill + Duration + Exit action
 */
export default function RecoverySessionHeader({
  activity,
  onExit,
  statusLabel = "Recovery Space",
}: RecoverySessionHeaderProps) {
  return (
    <header className="relative z-20 w-full mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      {/* ── Top-Left: Brand & Subtitle ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md"
          style={{
            background: "rgba(94, 150, 106, 0.2)",
            border: "1px solid rgba(132, 189, 144, 0.35)",
            color: "#84BD90",
            boxShadow: "0 0 16px rgba(132, 189, 144, 0.2)",
          }}
        >
          <Leaf className="w-5 h-5 text-[#84BD90]" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.24em] text-[#EFF5EC]">
            Mind &amp; Focus Recovery Center
          </h1>
          <p className="text-[11px] text-[#A8BAA5] tracking-wide mt-0.5">
            A calmer mind builds a brighter you.
          </p>
        </div>
      </div>

      {/* ── Top-Right: Pill badge + Exit Button ── */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Cinematic "Take a break · Reset · Be present" pill from reference */}
        <div
          className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl transition-all duration-300"
          style={{
            background: "rgba(18, 28, 22, 0.72)",
            border: "1px solid rgba(132, 189, 144, 0.2)",
            color: "#A8BAA5",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <span className="text-[#EFF5EC]">Take a break</span>
          <span className="text-[#5E966A]">•</span>
          <span className="text-[#EFF5EC]">Reset</span>
          <span className="text-[#5E966A]">•</span>
          <span className="text-[#EFF5EC]">Be present</span>
          <Sun className="w-3.5 h-3.5 text-[#E6A756] animate-pulse ml-1" />
        </div>

        {/* Duration badge */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md"
          style={{
            background: "rgba(18, 28, 22, 0.72)",
            border: "1px solid rgba(132, 189, 144, 0.2)",
            color: "#EFF5EC",
          }}
        >
          <Clock className="w-3.5 h-3.5 text-[#84BD90]" />
          <span>{activity.duration}</span>
        </span>

        {/* Exit action button */}
        <button
          onClick={onExit}
          type="button"
          aria-label="Exit recovery session"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A]"
          style={{
            background: "rgba(18, 28, 22, 0.72)",
            border: "1px solid rgba(132, 189, 144, 0.2)",
            color: "#A8BAA5",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#EFF5EC";
            e.currentTarget.style.borderColor = "rgba(132, 189, 144, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#A8BAA5";
            e.currentTarget.style.borderColor = "rgba(132, 189, 144, 0.2)";
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
          <kbd
            className="hidden sm:inline-block text-[9px] uppercase font-mono px-1 py-0.5 rounded ml-0.5"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#A8BAA5",
            }}
          >
            Esc
          </kbd>
        </button>
      </div>
    </header>
  );
}
