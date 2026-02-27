"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { GlassPill } from "@/components/ui/GlassPill";
import { ShimmerText } from "@/components/ui/ShimmerText";
import { springTransitions } from "@/lib/ui/animations";
import { CATEGORY_ICONS } from "@/lib/ui/constants";
import type { ExternalPOI, Remark, Poi, CategorySlug, Category } from "@/types/api";
import { CATEGORY_COLORS } from "@/types/api";

interface POICardProps {
  poi: ExternalPOI;
  remark?: (Remark & { poi: Poi & { category?: Category } }) | null;
  onNavigate?: () => void;
  onGenerateStory?: () => void;
  onRegenerate?: () => void;
  onBack?: () => void;
  isGenerating?: boolean;
  isRegenerating?: boolean;
  cooldownRemaining?: number;
  autoGenerate?: boolean;
}

function formatDistance(meters?: number): string {
  if (!meters) return "";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

function formatPhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^00/, "+");
}

/**
 * Unified POI card with Obelisk-first experience and auto-generation.
 *
 * Args:
 *     poi: External POI data.
 *     remark: Optional existing Obelisk story.
 *     onNavigate: Callback when navigation is requested.
 *     onGenerateStory: Callback to generate story.
 *     onRegenerate: Callback to regenerate existing story.
 *     isGenerating: Whether story generation is in progress.
 *     isRegenerating: Whether story regeneration is in progress.
 *     cooldownRemaining: Seconds before regeneration allowed.
 *     autoGenerate: Auto-trigger generation if no story exists.
 */
export function POICard({
  poi,
  remark,
  onNavigate,
  onGenerateStory,
  onRegenerate,
  onBack,
  isGenerating = false,
  isRegenerating = false,
  cooldownRemaining = 0,
  autoGenerate = true,
}: POICardProps) {
  const categoryIcon = CATEGORY_ICONS[poi.category as CategorySlug] ?? "📍";
  const categoryColor = CATEGORY_COLORS[poi.category as CategorySlug] || CATEGORY_COLORS.history;
  const hasStory = !!remark;
  const isLoading = isGenerating || isRegenerating;

  const hasTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      autoGenerate &&
      !hasStory &&
      !isGenerating &&
      onGenerateStory &&
      hasTriggeredRef.current !== poi?.id
    ) {
      hasTriggeredRef.current = poi?.id ?? null;
      onGenerateStory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, hasStory, isGenerating, poi?.id]);

  return (
    <motion.article
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.smooth}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to results
        </button>
      )}

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
            className="font-semibold text-[var(--foreground)] leading-tight truncate"
            style={{ fontSize: "18px" }}
          >
            {poi.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <GlassPill size="sm" color={categoryColor}>
              {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
            </GlassPill>
            {poi.distance && (
              <span className="text-[13px] text-[var(--foreground-secondary)]">
                {formatDistance(poi.distance)}
              </span>
            )}
          </div>
        </div>
      </div>

      {(poi.address || poi.openingHours || poi.cuisine || poi.hasWifi || poi.hasOutdoorSeating) && (
        <div className="space-y-2">
          {poi.address && (
            <div className="flex items-start gap-2 text-[13px] text-[var(--foreground-secondary)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="flex-shrink-0 mt-0.5 opacity-60"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="leading-snug">{poi.address}</span>
            </div>
          )}

          {poi.openingHours && (
            <div className="flex items-start gap-2 text-[13px] text-[var(--foreground-secondary)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="flex-shrink-0 mt-0.5 opacity-60"
              >
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              <span className="leading-snug">{poi.openingHours}</span>
            </div>
          )}

          {(poi.cuisine || poi.hasWifi || poi.hasOutdoorSeating) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {poi.cuisine && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                  🍽️ {poi.cuisine}
                </span>
              )}
              {poi.hasWifi && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                  📶 WiFi
                </span>
              )}
              {poi.hasOutdoorSeating && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                  ☀️ Outdoor
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <AnimatePresence mode="wait">
          {isLoading && !hasStory ? (
            <motion.div
              key="shimmer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-[13px] text-coral">
                <svg
                  className="w-4 h-4 animate-spin"
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
                <span className="font-medium">Creating story...</span>
              </div>
              <ShimmerText lines={4} />
            </motion.div>
          ) : hasStory ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <p className="text-[var(--foreground-secondary)] text-[15px]">
                No story yet for this place
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

        {hasStory && onRegenerate && (
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

        <div className="flex-1" />

        {poi.phone && (
          <motion.button
            className="flex items-center justify-center w-11 h-11 glass-floating rounded-xl"
            onClick={() => window.open(`tel:${formatPhone(poi.phone!)}`, "_self")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransitions.quick}
            aria-label="Call"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[var(--foreground-secondary)]"
            >
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </motion.button>
        )}

        {poi.website && (
          <motion.button
            className="flex items-center justify-center w-11 h-11 glass-floating rounded-xl"
            onClick={() => window.open(poi.website, "_blank")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransitions.quick}
            aria-label="Website"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[var(--foreground-secondary)]"
            >
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.article>
  );
}
