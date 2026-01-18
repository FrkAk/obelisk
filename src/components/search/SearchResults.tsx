"use client";

import { motion, AnimatePresence } from "framer-motion";
import { POICard } from "@/components/poi/POICard";
import { GlassCard } from "@/components/ui";
import { springTransitions } from "@/lib/ui/animations";
import type { SearchResult, ObeliskResult, ExternalResult } from "@/lib/search/types";

interface SearchResultsProps {
  results: SearchResult[];
  conversationalResponse?: string;
  isLoading?: boolean;
  onNavigate?: (result: SearchResult) => void;
  onSelectStory?: (result: ObeliskResult) => void;
  onGenerateStory?: (result: ExternalResult) => void;
  generatingPoiId?: string | null;
}

/**
 * Displays unified search results with conversational response.
 *
 * Args:
 *     results: Array of search results (Obelisk remarks + external POIs).
 *     conversationalResponse: AI-generated response about the results.
 *     isLoading: Whether results are loading.
 *     onNavigate: Callback when navigation is requested for a result.
 *     onSelectStory: Callback when an Obelisk story is selected.
 *     onGenerateStory: Callback when story generation is requested for a POI.
 *     generatingPoiId: ID of POI currently being generated, for loading state.
 */
export function SearchResults({
  results,
  conversationalResponse,
  isLoading = false,
  onNavigate,
  onSelectStory,
  onGenerateStory,
  generatingPoiId,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
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

  const obeliskResults = results.filter(
    (r): r is ObeliskResult => r.type === "remark"
  );
  const externalResults = results.filter(
    (r): r is ExternalResult => r.type === "external"
  );

  return (
    <div className="space-y-6">
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

      {obeliskResults.length > 0 && (
        <section>
          <h3 className="text-[14px] font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide mb-3">
            Stories ({obeliskResults.length})
          </h3>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {obeliskResults.map((result, index) => (
                <motion.div
                  key={result.remark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ ...springTransitions.smooth, delay: index * 0.05 }}
                >
                  <GlassCard
                    padding="md"
                    radius="xl"
                    onClick={() => onSelectStory?.(result)}
                    interactive
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4
                            className="font-semibold text-[var(--foreground)] leading-tight mb-1"
                            style={{ fontSize: "17px" }}
                          >
                            {result.remark.title}
                          </h4>
                          <p className="text-[14px] text-[var(--foreground-secondary)]">
                            {result.remark.poi.name}
                          </p>
                        </div>
                        {result.remark.poi.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={result.remark.poi.imageUrl}
                              alt={result.remark.poi.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {result.remark.teaser && (
                        <p className="text-[14px] text-[var(--foreground-secondary)] line-clamp-2">
                          {result.remark.teaser}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[13px] text-[var(--foreground-secondary)]">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 opacity-60"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                          </svg>
                          {formatDuration(result.remark.durationSeconds)}
                        </span>
                        {result.distance && (
                          <span>{formatDistance(result.distance)}</span>
                        )}
                        {result.remark.poi.category && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[12px] font-medium"
                            style={{
                              backgroundColor: `${result.remark.poi.category.color}20`,
                              color: result.remark.poi.category.color,
                            }}
                          >
                            {result.remark.poi.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {externalResults.length > 0 && (
        <section>
          <h3 className="text-[14px] font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide mb-3">
            Places ({externalResults.length})
          </h3>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {externalResults.map((result, index) => (
                <motion.div
                  key={result.poi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    ...springTransitions.smooth,
                    delay: (obeliskResults.length + index) * 0.05,
                  }}
                >
                  <POICard
                    poi={result.poi}
                    nearbyRemark={result.nearbyRemark}
                    onNavigate={() => onNavigate?.(result)}
                    onDiscoverStory={
                      result.nearbyRemark
                        ? () =>
                            onSelectStory?.({
                              type: "remark",
                              remark: result.nearbyRemark!,
                              distance: result.distance,
                              score: 0,
                            })
                        : undefined
                    }
                    onGenerateStory={
                      !result.nearbyRemark && onGenerateStory
                        ? () => onGenerateStory(result)
                        : undefined
                    }
                    isGenerating={generatingPoiId === result.poi.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="glass rounded-[20px] p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
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
