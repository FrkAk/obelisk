"use client";

import { motion } from "framer-motion";
import { GlassButton, GlassPill } from "@/components/ui";
import type { Remark, Poi, CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { springTransitions } from "@/lib/ui/animations";

interface StoryCardProps {
  remark: Remark & { poi: Poi };
  onNavigate?: () => void;
}

/**
 * Premium story card with iOS-style typography and layout.
 *
 * Args:
 *     remark: The story remark with associated POI data.
 *     onNavigate: Callback when navigation is requested.
 */
export function StoryCard({ remark, onNavigate }: StoryCardProps) {
  const categorySlug = (remark.poi.category?.slug ?? "history") as CategorySlug;
  const categoryColor = CATEGORY_COLORS[categorySlug];
  const categoryName = remark.poi.category?.name ?? "History";

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const estimatedReadTime = Math.ceil(remark.content.split(" ").length / 200);

  return (
    <motion.article
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.smooth}
    >
      {remark.poi.imageUrl && (
        <motion.div
          className="relative aspect-[16/10] rounded-[20px] overflow-hidden bg-gray-100 dark:bg-gray-800"
          style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
          whileHover={{ scale: 1.01 }}
          transition={springTransitions.snappy}
        >
          <img
            src={remark.poi.imageUrl}
            alt={remark.poi.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <GlassPill color={categoryColor} size="sm">
            {categoryName}
          </GlassPill>
          <div className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            <span className="text-[13px] font-medium">
              {formatDuration(remark.durationSeconds)} · {estimatedReadTime} min read
            </span>
          </div>
        </div>

        <h2
          className="font-semibold tracking-tight text-[var(--foreground)]"
          style={{ fontSize: "22px", lineHeight: "28px" }}
        >
          {remark.title}
        </h2>

        <p
          className="text-[var(--foreground)]/90 font-serif leading-[1.6]"
          style={{ fontSize: "17px" }}
        >
          {remark.content}
        </p>

        {remark.localTip && (
          <motion.div
            className="relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springTransitions.smooth, delay: 0.1 }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-coral" />
            <div className="glass-thin rounded-2xl pl-5 pr-4 py-4 ml-0.5">
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-coral">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span className="text-[13px] font-semibold text-coral">Local Tip</span>
              </div>
              <p className="text-[15px] text-[var(--foreground-secondary)] leading-relaxed">
                {remark.localTip}
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 pt-3">
          <motion.div
            className="flex-1"
            whileTap={{ scale: 0.97 }}
            transition={springTransitions.quick}
          >
            <GlassButton variant="secondary" fullWidth size="lg">
              <span className="flex items-center justify-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 16.5v-9l7 4.5-7 4.5z" />
                </svg>
                <span className="font-semibold">Listen</span>
              </span>
            </GlassButton>
          </motion.div>

          {onNavigate && (
            <motion.div
              className="flex-1"
              whileTap={{ scale: 0.97 }}
              transition={springTransitions.quick}
            >
              <GlassButton onClick={onNavigate} fullWidth size="lg">
                <span className="flex items-center justify-center gap-2.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="font-semibold">Navigate</span>
                </span>
              </GlassButton>
            </motion.div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
