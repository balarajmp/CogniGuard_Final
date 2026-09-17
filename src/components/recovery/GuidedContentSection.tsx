"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Sparkles, X, Play } from "lucide-react";
import {
  GUIDED_CONTENT_CATALOG,
  type GuidedContent,
  type RecoveryActivityType,
} from "@/types/recovery";
import GuidedContentCard from "./GuidedContentCard";

interface GuidedContentSectionProps {
  selectedContent: GuidedContent | null;
  onSelectContent: (content: GuidedContent | null) => void;
  onLaunchSession?: (content: GuidedContent) => void;
  reduced?: boolean;
}

type FilterCategory = "all" | "breathing" | "eye-rest" | "stretch" | "focus-reset" | "guided-session";

const FILTER_OPTIONS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All Sessions" },
  { id: "breathing", label: "Breathing" },
  { id: "eye-rest", label: "Eye Rest" },
  { id: "stretch", label: "Movement" },
  { id: "focus-reset", label: "Mind & Focus" },
  { id: "guided-session", label: "Guided Routines" },
];

export default function GuidedContentSection({
  selectedContent,
  onSelectContent,
  onLaunchSession,
  reduced = false,
}: GuidedContentSectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  const filteredContent = GUIDED_CONTENT_CATALOG.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "breathing") return item.activityType === "breathing";
    if (activeFilter === "eye-rest") return item.activityType === "eye-rest";
    if (activeFilter === "stretch") return item.activityType === "stretch" || item.activityType === "break";
    if (activeFilter === "focus-reset") return item.activityType === "focus-reset" || item.activityType === "hydration";
    if (activeFilter === "guided-session") return item.activityType === "guided-session";
    return true;
  });

  const handleToggleSelect = (content: GuidedContent) => {
    if (selectedContent?.id === content.id) {
      onSelectContent(null);
    } else {
      onSelectContent(content);
    }
  };

  return (
    <section className="space-y-6 w-full" aria-labelledby="guided-content-heading">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-[#7BA47A]" />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--rc-text-muted)" }}
            >
              Optional Video Companion
            </span>
          </div>
          <h2
            id="guided-content-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: "var(--rc-text-primary)" }}
          >
            Curated Guided Content
          </h2>
          <p
            className="text-xs sm:text-sm mt-1 max-w-xl leading-relaxed"
            style={{ color: "var(--rc-text-secondary)" }}
          >
            Follow along if you&apos;d like. These curated video sessions accompany your CognitoShield break while the sanctuary timer keeps pace.
          </p>
        </div>

        {/* Selected pill summary */}
        {selectedContent && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto"
            style={{
              background: "var(--rc-sage-dim)",
              border: "1px solid var(--rc-sage)",
              color: "var(--rc-moss)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Companion Selected</span>
            <button
              type="button"
              onClick={() => onSelectContent(null)}
              aria-label="Clear companion selection"
              className="hover:opacity-75 focus-visible:outline-none p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Filter guided content by activity type"
      >
        {FILTER_OPTIONS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(tab.id)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
              style={{
                background: isActive ? "var(--rc-moss)" : "var(--rc-bg-card)",
                color: isActive ? "var(--rc-text-inverse)" : "var(--rc-text-secondary)",
                border: isActive ? "none" : "1px solid var(--rc-border-card)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Selection Banner */}
      {selectedContent && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl"
          style={{
            background: "var(--rc-bg-card)",
            border: "1px solid var(--rc-sage)",
            boxShadow: "var(--rc-shadow-card)",
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--rc-moss)",
                  color: "var(--rc-text-inverse)",
                }}
              >
                Active Companion
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--rc-text-muted)" }}>
                {selectedContent.durationMinutes} min • YouTube
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold" style={{ color: "var(--rc-text-primary)" }}>
              {selectedContent.title}
            </h3>
            <p className="text-xs" style={{ color: "var(--rc-text-secondary)" }}>
              When you begin, this video will appear as an optional follow-along companion inside your session.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onLaunchSession && (
              <button
                type="button"
                onClick={() => onLaunchSession(selectedContent)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A]"
                style={{
                  background: "var(--rc-moss)",
                  color: "var(--rc-text-inverse)",
                }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Begin with Companion</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectContent(null)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A]"
              style={{
                background: "var(--rc-bg-alt)",
                color: "var(--rc-text-secondary)",
                border: "1px solid var(--rc-border-soft)",
              }}
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.map((content) => (
          <GuidedContentCard
            key={content.id}
            content={content}
            isSelected={selectedContent?.id === content.id}
            onSelect={handleToggleSelect}
            onLaunch={onLaunchSession}
            reduced={reduced}
          />
        ))}
      </div>
    </section>
  );
}
