"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassPill } from "@/components/ui";
import { springTransitions, searchResultVariants } from "@/lib/ui/animations";
import { CATEGORY_COLORS } from "@/types";
import type { CategorySlug } from "@/types";
import type { SearchResult, ObeliskResult, ExternalResult } from "@/lib/search/types";

interface SearchResultsProps {
  results: SearchResult[];
  conversationalResponse?: string;
  isLoading?: boolean;
  onResultTap: (result: SearchResult) => void;
  generatingPoiId?: string | null;
}

/**
 * Displays unified search results as a single sorted card list.
 *
 * Args:
 *     results: Pre-sorted array of search results (Obelisk remarks + external POIs).
 *     conversationalResponse: AI-generated response about the results.
 *     isLoading: Whether results are loading.
 *     onResultTap: Callback when any result card is tapped.
 *     generatingPoiId: ID of POI currently generating a story, for loading state.
 */
export function SearchResults({
  results,
  conversationalResponse,
  isLoading = false,
  onResultTap,
  generatingPoiId,
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
    <div className="space-y-4">
      {conversationalResponse && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransitions.smooth}
        >
          <GlassCard padding="md" radius="xl" variant="thin">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-coral/70 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">✨</span>
              </div>
              <p className="text-[15px] text-[var(--foreground)] leading-relaxed">
                {conversationalResponse}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {results.map((result, index) => (
            <motion.div
              key={getResultKey(result)}
              custom={index}
              variants={searchResultVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <SearchResultCard
                result={result}
                onTap={() => onResultTap(result)}
                isGenerating={
                  result.type === "external" &&
                  generatingPoiId === result.poi.id
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onTap: () => void;
  isGenerating: boolean;
}

/**
 * Single search result card with category icon, metadata, and badges.
 *
 * Args:
 *     result: The search result to display.
 *     onTap: Callback when the card is tapped.
 *     isGenerating: Whether a story is currently being generated for this result.
 */
function SearchResultCard({ result, onTap, isGenerating }: SearchResultCardProps) {
  const categoryInfo = getCategoryInfo(result);
  const title = getTitle(result);
  const subtitle = getSubtitle(result);
  const teaser = getTeaser(result);
  const thumbnail = getThumbnail(result);
  const isObelisk = result.type === "remark";

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
              {title}
            </h4>
            <p className="text-[14px] text-[var(--foreground-secondary)] truncate">
              {subtitle}
            </p>
          </div>

          {thumbnail && (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
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

          {isObelisk && (
            <>
              <GlassPill size="sm">
                {formatDuration(result.remark.durationSeconds)}
              </GlassPill>
              <GlassPill size="sm" color="#FF6B4A">
                Story
              </GlassPill>
            </>
          )}

          {isGenerating && (
            <GlassPill size="sm" color="#FF6B4A">
              Generating...
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
          <div className="w-14 h-14 rounded-xl bg-[var(--glass-bg)]" />
        </div>
        <div className="h-4 w-full bg-[var(--glass-bg)] rounded" />
        <div className="h-4 w-3/4 bg-[var(--glass-bg)] rounded" />
      </div>
    </GlassCard>
  );
}

function getResultKey(result: SearchResult): string {
  if (result.type === "remark") return result.remark.id;
  return result.poi.id;
}

interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
}

function getCategoryInfo(result: SearchResult): CategoryInfo {
  if (result.type === "remark" && result.remark.poi?.category) {
    const cat = result.remark.poi.category;
    return { name: cat.name, icon: cat.icon, color: cat.color };
  }

  if (result.type === "external") {
    const slug = result.poi.category as CategorySlug;
    const color = CATEGORY_COLORS[slug];
    if (color) {
      return { name: slug, icon: getCategoryIcon(slug), color };
    }
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
  };
  return icons[slug] ?? "📍";
}

function getTitle(result: SearchResult): string {
  if (result.type === "remark") return result.remark.title;
  return result.poi.name;
}

function getSubtitle(result: SearchResult): string {
  if (result.type === "remark") return result.remark.poi?.name ?? "";
  return result.poi.address ?? result.poi.category;
}

function getTeaser(result: SearchResult): string | null {
  if (result.type === "remark") return result.remark.teaser;
  return null;
}

function getThumbnail(result: SearchResult): string | null {
  if (result.type === "remark") return result.remark.poi?.imageUrl ?? null;
  return result.poi.imageUrl ?? null;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
