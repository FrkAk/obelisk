"use client";

import { motion, AnimatePresence } from "framer-motion";
import { springTransitions, searchResultVariants } from "@/lib/ui/animations";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/ui/constants";
import { formatDistance } from "@/lib/geo/distance";
import type { CategorySlug, SearchResult } from "@/types/api";
import { CATEGORY_COLORS } from "@/types/api";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultTap: (result: SearchResult) => void;
}

/**
 * Displays unified search results as a clean divider-separated list.
 *
 * Each result shows a category-colored dot, name in display serif, subtitle in UI font,
 * and optional teaser in reading serif. No card wrappers or pill badges.
 *
 * @param results - Pre-sorted array of unified search results.
 * @param isLoading - Whether results are loading.
 * @param onResultTap - Callback when any result is tapped.
 */
export function SearchResults({
  results,
  isLoading = false,
  onResultTap,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="py-6">
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
        <p
          className="text-[17px] text-[var(--foreground)] mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          No results found
        </p>
        <p className="text-[14px] text-[var(--foreground-secondary)]">
          Try a different search or expand your radius
        </p>
      </motion.div>
    );
  }

  return (
    <div>
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
            <SearchResultRow
              result={result}
              onTap={() => onResultTap(result)}
              isLast={index === results.length - 1}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SearchResultRowProps {
  result: SearchResult;
  onTap: () => void;
  isLast: boolean;
}

/**
 * Single search result row with category dot, name, subtitle, and optional teaser.
 *
 * @param result - The unified search result to display.
 * @param onTap - Callback when the row is tapped.
 * @param isLast - Whether this is the last result (suppresses bottom divider).
 */
function SearchResultRow({ result, onTap, isLast }: SearchResultRowProps) {
  const categoryColor = getCategoryColor(result);
  const teaser = result.remark?.teaser ?? result.description ?? null;
  const distanceStr = result.distance != null && result.distance > 0 ? formatDistance(result.distance) : null;
  const subtitle = [result.category, distanceStr].filter(Boolean).join(" \u00B7 ");

  return (
    <button
      onClick={onTap}
      className="w-full text-left py-3.5 px-1 cursor-pointer hover:bg-[var(--glass-bg-thin)] transition-colors duration-150"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--glass-border)",
      }}
    >
      <div className="flex items-center gap-2.5 mb-0.5">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: categoryColor }}
        />
        <h4
          className="text-[var(--foreground)] leading-tight truncate"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-body)" }}
        >
          {result.name}
        </h4>
      </div>

      {subtitle && (
        <p
          className="text-[var(--foreground-secondary)] ml-[18px]"
          style={{ fontFamily: "var(--font-ui)", fontSize: "var(--font-size-footnote)" }}
        >
          {subtitle}
        </p>
      )}

      {teaser && (
        <p
          className="text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed mt-1 ml-[18px]"
          style={{ fontFamily: "var(--font-reading)", fontSize: "var(--font-size-subhead)" }}
        >
          {teaser}
        </p>
      )}
    </button>
  );
}

/**
 * Shimmer loading skeleton for a single search result row.
 */
function LoadingSkeleton() {
  return (
    <div className="py-3.5 px-1 border-b border-[var(--glass-border)]">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-2 h-2 rounded-full shimmer" />
        <div className="h-5 w-40 rounded shimmer" />
      </div>
      <div className="ml-[18px] space-y-1.5">
        <div className="h-3.5 w-28 rounded shimmer" />
        <div className="h-3.5 w-full rounded shimmer" />
      </div>
    </div>
  );
}

/**
 * Resolves the category dot color for a search result.
 *
 * @param result - The search result.
 * @returns Hex color string for the category dot.
 */
function getCategoryColor(result: SearchResult): string {
  if (result.source === "geocoding") return DEFAULT_CATEGORY_COLOR;

  const slug = result.category as CategorySlug;
  const color = CATEGORY_COLORS[slug];
  if (color) return color;

  if (result.remark?.poi?.category?.color) return result.remark.poi.category.color;

  return DEFAULT_CATEGORY_COLOR;
}
