"use client";

import { motion } from "framer-motion";
import { Play, Check, Clock, Video, Sparkles } from "lucide-react";
import type { GuidedContent } from "@/types/recovery";

interface GuidedContentCardProps {
  content: GuidedContent;
  isSelected: boolean;
  onSelect: (content: GuidedContent) => void;
  onLaunch?: (content: GuidedContent) => void;
  reduced?: boolean;
}

export default function GuidedContentCard({
  content,
  isSelected,
  onSelect,
  onLaunch,
  reduced = false,
}: GuidedContentCardProps) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Guided content session: ${content.title}, ${content.durationMinutes} minutes. ${content.description}`}
      onClick={() => onSelect(content)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(content);
        }
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      whileHover={reduced ? {} : { y: -3, transition: { duration: 0.25 } }}
      className="rounded-2xl p-5 cursor-pointer relative overflow-hidden flex flex-col justify-between backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A] focus-visible:ring-offset-2 transition-all duration-300"
      style={{
        background: isSelected ? "rgba(26, 42, 31, 0.88)" : "var(--rc-bg-card)",
        border: isSelected
          ? "1.5px solid var(--rc-sage)"
          : "1px solid var(--rc-border-card)",
        boxShadow: isSelected
          ? "0 8px 30px rgba(94, 150, 106, 0.2)"
          : "var(--rc-shadow-card)",
      }}
    >
      {/* Card Header row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Provider badge */}
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{
              background: "rgba(160,136,106,0.12)",
              color: "var(--rc-earth)",
            }}
          >
            <Video className="w-3 h-3" />
            <span>YouTube Curated</span>
          </span>

          {/* Duration */}
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              background: "var(--rc-bg-alt)",
              color: "var(--rc-text-primary)",
            }}
          >
            <Clock className="w-3 h-3 text-[#7BA47A]" />
            <span>{content.durationMinutes} min</span>
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-base font-bold mb-1.5 tracking-tight"
          style={{ color: "var(--rc-text-primary)" }}
        >
          {content.title}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed mb-3"
          style={{ color: "var(--rc-text-secondary)" }}
        >
          {content.description}
        </p>

        {/* Follow along cue */}
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium italic"
            style={{ color: "var(--rc-text-muted)" }}
          >
            <Sparkles className="w-3 h-3 text-[#7BA47A]" />
            Follow along if you&apos;d like.
          </span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md font-medium"
              style={{
                background: "rgba(123,164,122,0.10)",
                color: "var(--rc-moss)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div
        className="pt-3 border-t flex items-center justify-between gap-3 mt-auto"
        style={{ borderColor: "var(--rc-border-soft)" }}
      >
        <span
          className="text-[11px] font-medium"
          style={{ color: isSelected ? "var(--rc-moss)" : "var(--rc-text-muted)" }}
        >
          {isSelected ? "Selected as companion" : "Optional video"}
        </span>

        <div className="flex items-center gap-2">
          {isSelected && onLaunch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(content);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
              style={{
                background: "var(--rc-moss)",
                color: "var(--rc-text-inverse)",
              }}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Begin</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(content);
            }}
            aria-label={isSelected ? `Deselect ${content.title}` : `Select ${content.title}`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
            style={{
              background: isSelected ? "var(--rc-sage-dim)" : "var(--rc-bg-alt)",
              color: isSelected ? "var(--rc-moss)" : "var(--rc-text-secondary)",
              border: isSelected ? "1px solid var(--rc-sage)" : "1px solid var(--rc-border-soft)",
            }}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </>
            ) : (
              <span>Choose</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
