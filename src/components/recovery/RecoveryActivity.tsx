"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import type { RecoveryActivityModel } from "@/types/recovery";

interface RecoveryActivityProps {
  activity: RecoveryActivityModel;
  onBegin: (activity: RecoveryActivityModel) => void;
  reduced?: boolean;
  variant?: "quick-break" | "guided-session" | "recommendation";
}

export default function RecoveryActivity({
  activity,
  onBegin,
  reduced = false,
  variant = "quick-break",
}: RecoveryActivityProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = activity.icon;

  if (variant === "guided-session") {
    return (
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`Begin guided session: ${activity.title}, duration ${activity.duration}`}
        onClick={() => onBegin(activity)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onBegin(activity);
          }
        }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reduced ? {} : { y: -3, transition: { duration: 0.25 } }}
        className="rounded-2xl p-6 relative overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741] focus-visible:ring-offset-2"
        style={{
          background: activity.gradient || "linear-gradient(135deg, #D4EBCC 0%, #A8C5A0 100%)",
          border: "1px solid var(--rc-border-card)",
          boxShadow: "var(--rc-shadow-card)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(255,255,255,0.60)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <Icon className="w-5 h-5" style={{ color: "var(--rc-moss)" }} />
          </div>
          <div className="flex-1">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-block mb-1.5"
              style={{
                background: "rgba(255,255,255,0.60)",
                color: "var(--rc-text-secondary)",
              }}
            >
              {activity.metadata?.tag || "Guided"}
            </span>
            <h3
              className="text-sm font-bold mb-1"
              style={{ color: "var(--rc-text-primary)" }}
            >
              {activity.title}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--rc-text-secondary)" }}
            >
              {activity.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--rc-text-secondary)" }}
          >
            <Clock className="w-3 h-3" /> {activity.duration}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBegin(activity);
            }}
            aria-label={`Begin ${activity.title}`}
            className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
            style={{
              background: "rgba(74,103,65,0.85)",
              color: "var(--rc-text-inverse)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59,84,51,0.95)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(74,103,65,0.85)";
            }}
          >
            Begin <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Default Quick Break card
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Begin activity: ${activity.title}, duration ${activity.duration}`}
      onClick={() => onBegin(activity)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBegin(activity);
        }
      }}
      onMouseEnter={() => !reduced && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={reduced ? {} : { y: -3, transition: { duration: 0.25 } }}
      className="rounded-2xl p-5 cursor-pointer relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741] focus-visible:ring-offset-2"
      style={{
        background: isHovered ? activity.accent : "var(--rc-bg-card)",
        border: `1px solid ${
          isHovered ? activity.color + "40" : "var(--rc-border-card)"
        }`,
        boxShadow: isHovered
          ? `0 8px 28px ${activity.color}18`
          : "var(--rc-shadow-card)",
        transition:
          "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: activity.accent,
            border: `1px solid ${activity.color}25`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: activity.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold mb-1"
            style={{ color: "var(--rc-text-primary)" }}
          >
            {activity.title}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--rc-text-secondary)" }}
          >
            {activity.description}
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
          {activity.duration}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBegin(activity);
          }}
          aria-label={`Begin ${activity.title}`}
          className="text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
          style={{ background: activity.color, color: "#fff" }}
        >
          Begin
        </button>
      </div>
    </motion.div>
  );
}
