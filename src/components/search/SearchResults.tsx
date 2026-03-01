"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassPill } from "@/components/ui/GlassPill";
import { springTransitions, searchResultVariants } from "@/lib/ui/animations";
import type { CategorySlug, SearchResult } from "@/types/api";
import { CATEGORY_COLORS } from "@/types/api";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultTap: (result: SearchResult) => void;
}

/**
 * Displays unified search results as a sorted card list.
 *
 * Args:
 *     results: Pre-sorted array of unified search results.
 *     isLoading: Whether results are loading.
 *     onResultTap: Callback when any result card is tapped.
 */
export function SearchResults({
  results,
  isLoading = false,
  onResultTap,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        className="py-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={springTransitions.smooth}
      >
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-[18px] font-semibold text-[var(--foreground)] mb-2">
          No results found
        </h3>
        <p className="text-[15px] text-[var(--foreground-secondary)]">
          Try a different search or expand your radius
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            custom={index}
            variants={searchResultVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <SearchResultCard
              result={result}
              onTap={() => onResultTap(result)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onTap: () => void;
}

/**
 * Single search result card with category icon, metadata, and badges.
 *
 * Args:
 *     result: The unified search result to display.
 *     onTap: Callback when the card is tapped.
 */
function SearchResultCard({ result, onTap }: SearchResultCardProps) {
  const categoryInfo = getCategoryInfo(result);
  const subtitle = result.address ?? result.category;
  const teaser = result.remark?.teaser ?? result.description ?? null;

  return (
    <GlassCard padding="md" radius="xl" onClick={onTap} interactive>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: categoryInfo.color
                ? `linear-gradient(135deg, ${categoryInfo.color}30, ${categoryInfo.color}15)`
                : "var(--glass-bg)",
            }}
          >
            <span className="text-lg">{categoryInfo.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[17px] font-semibold text-[var(--foreground)] leading-tight mb-0.5 truncate">
              {result.name}
            </h4>
            <p className="text-[14px] text-[var(--foreground-secondary)] truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {teaser && (
          <p className="text-[14px] text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
            {teaser}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {categoryInfo.name && (
            <GlassPill size="sm" color={categoryInfo.color}>
              {categoryInfo.name}
            </GlassPill>
          )}

          {result.distance != null && (
            <GlassPill size="sm">
              {formatDistance(result.distance)}
            </GlassPill>
          )}

          {result.hasStory && (
            <GlassPill size="sm" color="#FF6B4A">
              Story
            </GlassPill>
          )}

          {result.cuisine && (
            <GlassPill size="sm">
              {result.cuisine}
            </GlassPill>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function LoadingSkeleton() {
  return (
    <GlassCard padding="md" radius="xl" variant="thin">
      <div className="space-y-3 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)]" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 bg-[var(--glass-bg)] rounded" />
            <div className="h-4 w-32 bg-[var(--glass-bg)] rounded" />
          </div>
        </div>
        <div className="h-4 w-full bg-[var(--glass-bg)] rounded" />
        <div className="h-4 w-3/4 bg-[var(--glass-bg)] rounded" />
      </div>
    </GlassCard>
  );
}

interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
}

function getCategoryInfo(result: SearchResult): CategoryInfo {
  if (result.source === "geocoding") {
    return { name: result.placeType ?? "location", icon: "📌", color: "#5AC8FA" };
  }

  const slug = result.category as CategorySlug;
  const color = CATEGORY_COLORS[slug];
  if (color) {
    return { name: slug, icon: getCategoryIcon(slug), color };
  }

  if (result.remark?.poi?.category) {
    const cat = result.remark.poi.category;
    return { name: cat.name, icon: cat.icon, color: cat.color };
  }

  return { name: "", icon: "📍", color: "" };
}

function getCategoryIcon(slug: CategorySlug): string {
  const icons: Record<CategorySlug, string> = {
    history: "🏛️",
    food: "🍴",
    art: "🎨",
    nature: "🌿",
    architecture: "🏗️",
    hidden: "💎",
    views: "🌄",
    culture: "🎭",
    shopping: "🛍️",
    nightlife: "🌙",
    sports: "⚽",
    health: "🏥",
    transport: "🚇",
    education: "🎓",
    services: "🏢",
  };
  return icons[slug] ?? "📍";
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
