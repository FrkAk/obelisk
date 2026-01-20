"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { GlassPill } from "@/components/ui";
import type { Remark, Poi, CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { springTransitions } from "@/lib/ui/animations";

interface StoryCardProps {
  remark: Remark & { poi: Poi };
  onNavigate?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  cooldownRemaining?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: "☕",
  history: "🏛️",
  art: "🎨",
  nature: "🌳",
  architecture: "🏗️",
  hidden: "✨",
  views: "👀",
  culture: "🎭",
};

/**
 * Minimal story card matching the POICard design.
 *
 * Args:
 *     remark: The story remark with associated POI data.
 *     onNavigate: Callback when navigation is requested.
 *     onRegenerate: Callback when user wants to regenerate the story.
 *     isRegenerating: Whether regeneration is in progress.
 *     cooldownRemaining: Seconds remaining before regeneration is allowed.
 */
export function StoryCard({
  remark,
  onNavigate,
  onRegenerate,
  isRegenerating = false,
  cooldownRemaining = 0,
}: StoryCardProps) {
  const categorySlug = (remark.poi.category?.slug ?? "history") as CategorySlug;
  const categoryColor = CATEGORY_COLORS[categorySlug];
  const categoryName = remark.poi.category?.name ?? "History";
  const categoryIcon = CATEGORY_ICONS[categorySlug] || "📍";

  return (
    <motion.article
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.smooth}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${categoryColor}20 0%, ${categoryColor}10 100%)`,
            border: `1px solid ${categoryColor}30`,
          }}
        >
          <span className="text-xl">{categoryIcon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="font-semibold text-[var(--foreground)] leading-tight"
            style={{ fontSize: "18px" }}
          >
            {remark.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <GlassPill size="sm" color={categoryColor}>
              {categoryName}
            </GlassPill>
            <span className="text-[13px] text-[var(--foreground-secondary)]">
              {remark.poi.name}
            </span>
          </div>
        </div>
      </div>

      <div
        className="text-[var(--foreground)]/90 font-serif leading-[1.6]"
        style={{ fontSize: "16px" }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {remark.content}
        </ReactMarkdown>
      </div>

      {remark.localTip && (
        <motion.div
          className="relative rounded-xl overflow-hidden"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springTransitions.smooth, delay: 0.1 }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-coral" />
          <div className="glass-thin rounded-xl pl-4 pr-3 py-3 ml-0.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">💡</span>
              <span className="text-[12px] font-semibold text-coral">Local Tip</span>
            </div>
            <div className="text-[14px] text-[var(--foreground-secondary)] leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-0">{children}</p>,
                }}
              >
                {remark.localTip}
              </ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--glass-border)]">
        {onNavigate && (
          <motion.button
            className="flex items-center justify-center w-11 h-11 glass-floating rounded-xl"
            onClick={onNavigate}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransitions.quick}
            aria-label="Navigate"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[var(--foreground)]"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </motion.button>
        )}

        {onRegenerate && (
          <motion.button
            className="flex items-center justify-center w-11 h-11 glass-floating rounded-xl disabled:opacity-50"
            onClick={onRegenerate}
            disabled={isRegenerating || cooldownRemaining > 0}
            whileHover={!isRegenerating && cooldownRemaining === 0 ? { scale: 1.05 } : undefined}
            whileTap={!isRegenerating && cooldownRemaining === 0 ? { scale: 0.95 } : undefined}
            transition={springTransitions.quick}
            aria-label={cooldownRemaining > 0 ? `Regenerate (${cooldownRemaining}s)` : "Regenerate"}
          >
            {isRegenerating ? (
              <svg
                className="w-5 h-5 animate-spin text-coral"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-[var(--foreground-secondary)]"
              >
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            )}
          </motion.button>
        )}

        {cooldownRemaining > 0 && (
          <span className="text-[12px] text-[var(--foreground-tertiary)] ml-1">
            {cooldownRemaining}s
          </span>
        )}
      </div>
    </motion.article>
  );
}
