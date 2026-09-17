"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Play,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Video,
  Clock,
  Sparkles,
} from "lucide-react";
import type { GuidedContent } from "@/types/recovery";

export interface GuidedYouTubePlayerProps {
  content: GuidedContent;
  className?: string;
  onSwitchToSanctuary?: () => void;
}

/**
 * GuidedYouTubePlayer
 *
 * An embedded, privacy-conscious YouTube player companion for Guided Content sessions.
 * Follows the Natural Digital Sanctuary visual language.
 *
 * Key Architectural Guarantees:
 * 1. CognitoShield remains the master session controller.
 * 2. This video is strictly an optional companion layer ("Follow along if you'd like").
 * 3. Video completion does NOT auto-complete the CognitoShield session timer.
 * 4. React.memo prevents iframe reloads during 250ms timer ticks.
 * 5. Handles loading states, invalid video IDs, and graceful fallbacks.
 */
function GuidedYouTubePlayerComponent({
  content,
  className = "",
  onSwitchToSanctuary,
}: GuidedYouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Validate video ID format (basic YouTube ID check)
  const isValidVideoId = useMemo(() => {
    return Boolean(
      content.videoId &&
        typeof content.videoId === "string" &&
        content.videoId.trim().length > 0
    );
  }, [content.videoId]);

  // Clean embed URL using youtube-nocookie.com for privacy
  const embedUrl = useMemo(() => {
    if (!isValidVideoId) return "";
    const cleanId = encodeURIComponent(content.videoId.trim());
    return `https://www.youtube-nocookie.com/embed/${cleanId}?rel=0&modestbranding=1&enablejsapi=1&origin=${
      typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : ""
    }`;
  }, [isValidVideoId, content.videoId]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
  }, []);

  // If the user opted out of the video layer to focus purely on the 3D sanctuary
  if (isDismissed) {
    return (
      <div
        className={`rounded-3xl p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 ${className}`}
        style={{
          background: "var(--rc-bg-card)",
          border: "1px solid var(--rc-border-card)",
          boxShadow: "var(--rc-shadow-card)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--rc-sage-dim)",
                color: "var(--rc-sage-light)",
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p
                className="text-xs font-bold"
                style={{ color: "var(--rc-text-primary)" }}
              >
                Focusing on 3D Sanctuary
              </p>
              <p
                className="text-[11px]"
                style={{ color: "var(--rc-text-muted)" }}
              >
                Optional video companion hidden. Follow the breathing orb and step guidance below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full self-start sm:self-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A]"
            style={{
              background: "var(--rc-sage-dim)",
              color: "var(--rc-sage-light)",
            }}
          >
            Show Video Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300 ${className}`}
      style={{
        background: "var(--rc-bg-card)",
        border: "1px solid var(--rc-border-card)",
        boxShadow: "var(--rc-shadow-card)",
      }}
      aria-label={`Guided Video: ${content.title}`}
    >
      {/* Header Banner: Guided Content Info & Master Controller Notice */}
      <div
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          borderBottom: "1px solid var(--rc-border-soft)",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--rc-sage-dim)",
                color: "var(--rc-sage-light)",
              }}
            >
              <Video className="w-3 h-3" />
              Guided Content
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: "var(--rc-text-muted)" }}
            >
              <Clock className="w-3 h-3" />
              {content.durationMinutes} min
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(230, 167, 86, 0.12)",
                color: "var(--rc-amber)",
              }}
            >
              Provider: YouTube
            </span>
          </div>
          <h3
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ color: "var(--rc-text-primary)" }}
          >
            {content.title}
          </h3>
          <p
            className="text-xs max-w-xl leading-relaxed"
            style={{ color: "var(--rc-text-secondary)" }}
          >
            {content.description}
          </p>
        </div>

        {/* Master Controller indicator */}
        <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: "var(--rc-sage-dim)",
              color: "var(--rc-sage-light)",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#84BD90]" />
            <span>CognitoShield Controls Session</span>
          </div>
          <span
            className="text-[11px] italic"
            style={{ color: "var(--rc-text-muted)" }}
          >
            Follow along if you&apos;d like.
          </span>
        </div>
      </div>

      {/* Embedded Player Container (Responsive 16:9) */}
      <div className="relative w-full aspect-video bg-neutral-900 overflow-hidden">
        {/* State A: Invalid or Missing Video ID */}
        {!isValidVideoId && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-neutral-300 bg-neutral-900/95 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-semibold text-white">
                Content Stream Unavailable
              </h4>
              <p className="text-xs text-neutral-400">
                This guided content does not have an active video stream attached. You can continue using CognitoShield&apos;s 3D sanctuary and guided steps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onSwitchToSanctuary) {
                  onSwitchToSanctuary();
                } else {
                  setIsDismissed(true);
                }
              }}
              className="text-xs font-semibold px-4 py-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
            >
              Continue with CognitoShield Guided
            </button>
          </div>
        )}

        {/* State B: Embed Loading Skeleton */}
        {isValidVideoId && isLoading && !hasError && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center space-y-3"
            style={{
              background: "linear-gradient(135deg, #242921 0%, #171A15 100%)",
            }}
            aria-live="polite"
          >
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full border-2 border-[#7BA47A]/30 border-t-[#7BA47A] animate-spin"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center text-[#7BA47A]">
                <Play className="w-4 h-4 ml-0.5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-300">
                Loading Guided Companion...
              </p>
              <p className="text-[11px] text-neutral-500">
                Connecting to curated YouTube stream
              </p>
            </div>
          </div>
        )}

        {/* State C: Playback Error / Fallback UI */}
        {isValidVideoId && hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-neutral-300 bg-neutral-900/95 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-semibold text-white">
                Unable to Load Video Stream
              </h4>
              <p className="text-xs text-neutral-400">
                The embedded YouTube player could not be reached or playback was restricted. Your CognitoShield session timer and guidance remain active.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#4A6741] text-white hover:bg-[#3d5535] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Player</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToSanctuary) {
                    onSwitchToSanctuary();
                  } else {
                    setIsDismissed(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741]"
              >
                <span>Continue with CognitoShield Guided</span>
              </button>
            </div>
          </div>
        )}

        {/* State D: The Responsive Iframe */}
        {isValidVideoId && (
          <iframe
            src={embedUrl}
            title={content.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            tabIndex={0}
          />
        )}
      </div>

      {/* Sub-Player Guidance Note & Action Bar */}
      <div
        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          borderTop: "1px solid var(--rc-border-soft)",
          color: "var(--rc-text-muted)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5E966A]" />
          <span>
            The session runs on CognitoShield&apos;s timer. Ending or pausing the video will not alter your session.
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isValidVideoId && (
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(content.videoId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#84BD90] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A] rounded"
              title="Open video on YouTube (external link)"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              if (onSwitchToSanctuary) {
                onSwitchToSanctuary();
              } else {
                setIsDismissed(true);
              }
            }}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full text-[var(--rc-text-muted)] hover:text-[var(--rc-text-primary)] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E966A]"
          >
            Hide Video
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoize the player to prevent iframe re-renders when the parent RecoverySession
 * re-renders on the 250ms universal timer ticks.
 */
export const GuidedYouTubePlayer = React.memo(
  GuidedYouTubePlayerComponent,
  (prev, next) => {
    return (
      prev.content.id === next.content.id &&
      prev.content.videoId === next.content.videoId &&
      prev.className === next.className &&
      prev.onSwitchToSanctuary === next.onSwitchToSanctuary
    );
  }
);

export default GuidedYouTubePlayer;
