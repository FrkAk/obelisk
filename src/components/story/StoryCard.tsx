"use client";

import { GlassButton, GlassPill } from "@/components/ui";
import type { Remark, Poi, CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";

interface StoryCardProps {
  remark: Remark & { poi: Poi };
  onNavigate?: () => void;
}

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

  return (
    <article className="space-y-4">
      {remark.poi.imageUrl && (
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={remark.poi.imageUrl}
            alt={remark.poi.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GlassPill color={categoryColor}>
            {categoryName}
          </GlassPill>
          <span className="text-foreground-secondary text-sm">
            {formatDuration(remark.durationSeconds)} read
          </span>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">
          {remark.title}
        </h2>

        <p className="text-lg leading-relaxed text-foreground/90 font-serif">
          {remark.content}
        </p>

        {remark.localTip && (
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-coral">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              Local tip
            </div>
            <p className="text-sm text-foreground-secondary">
              {remark.localTip}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <GlassButton variant="secondary" className="flex-1">
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 16.5v-9l7 4.5-7 4.5z" />
              </svg>
              Listen
            </span>
          </GlassButton>

          {onNavigate && (
            <GlassButton onClick={onNavigate} className="flex-1">
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Navigate
              </span>
            </GlassButton>
          )}
        </div>
      </div>
    </article>
  );
}
