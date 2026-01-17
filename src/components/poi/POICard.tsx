"use client";

import { motion } from "framer-motion";
import { GlassCard, GlassButton, GlassPill } from "@/components/ui";
import { springTransitions } from "@/lib/ui/animations";
import type { ExternalPOI } from "@/lib/search/types";
import type { Remark, Poi } from "@/types";

interface POICardProps {
  poi: ExternalPOI;
  nearbyRemark?: Remark & { poi: Poi };
  onNavigate?: () => void;
  onDiscoverStory?: () => void;
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

function formatDistance(meters?: number): string {
  if (!meters) return "";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

/**
 * Card for displaying external POI information.
 *
 * Args:
 *     poi: External POI data from search results.
 *     nearbyRemark: Optional nearby Obelisk story.
 *     onNavigate: Callback when navigation is requested.
 *     onDiscoverStory: Callback when user wants to see nearby story.
 */
export function POICard({
  poi,
  nearbyRemark,
  onNavigate,
  onDiscoverStory,
}: POICardProps) {
  const categoryIcon = CATEGORY_ICONS[poi.category] || "📍";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.smooth}
    >
      <GlassCard padding="md" radius="xl" interactive>
        <div className="space-y-4">
          {poi.imageUrl && (
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={poi.imageUrl}
                alt={poi.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3
                className="font-semibold text-[var(--foreground)] leading-tight"
                style={{ fontSize: "18px" }}
              >
                {poi.name}
              </h3>
              <div className="flex-shrink-0 text-xl">{categoryIcon}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <GlassPill size="sm">
                {poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}
              </GlassPill>
              {poi.distance && (
                <span className="text-[13px] text-[var(--foreground-secondary)]">
                  {formatDistance(poi.distance)}
                </span>
              )}
            </div>

            {poi.cuisine && (
              <p className="text-[14px] text-[var(--foreground-secondary)]">
                {poi.cuisine}
              </p>
            )}

            <div className="space-y-2 text-[14px] text-[var(--foreground-secondary)]">
              {poi.openingHours && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 opacity-60"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span className="truncate">{poi.openingHours}</span>
                </div>
              )}

              {poi.phone && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 opacity-60"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <a
                    href={`tel:${poi.phone}`}
                    className="hover:text-coral transition-colors"
                  >
                    {poi.phone}
                  </a>
                </div>
              )}

              {poi.website && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 opacity-60"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                  <a
                    href={poi.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-coral transition-colors truncate"
                  >
                    {new URL(poi.website).hostname}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                {poi.hasWifi && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-green-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                    </svg>
                    <span className="text-[12px]">WiFi</span>
                  </div>
                )}
                {poi.hasOutdoorSeating && (
                  <div className="flex items-center gap-1">
                    <span className="text-base">🪑</span>
                    <span className="text-[12px]">Outdoor</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {onNavigate && (
              <GlassButton onClick={onNavigate} fullWidth size="md">
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>Navigate</span>
                </span>
              </GlassButton>
            )}
            {poi.website && (
              <GlassButton
                variant="secondary"
                size="md"
                onClick={() => window.open(poi.website, "_blank")}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                  </svg>
                  <span>Website</span>
                </span>
              </GlassButton>
            )}
          </div>

          {nearbyRemark && (
            <motion.div
              className="pt-3 border-t border-[var(--glass-border)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={onDiscoverStory}
                className="flex items-center gap-3 w-full p-3 rounded-xl glass-thin hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-coral/70 flex items-center justify-center">
                  <span className="text-white text-lg">✨</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] text-coral font-medium">
                    Obelisk has a story nearby!
                  </p>
                  <p className="text-[15px] text-[var(--foreground)] font-medium truncate">
                    {nearbyRemark.title}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-[var(--foreground-secondary)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
