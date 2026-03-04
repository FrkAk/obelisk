"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { LoadingState } from "@/components/ui/LoadingState";
import { springTransitions } from "@/lib/ui/animations";
import { CATEGORY_COLORS } from "@/types/api";
import type { ExternalPOI, Remark, Poi, CategorySlug, Category } from "@/types/api";

interface POICardProps {
  poi: ExternalPOI;
  remark?: (Remark & { poi: Poi & { category?: Category } }) | null;
  onNavigate?: () => void;
  onGenerateRemark?: () => void;
  onRegenerate?: () => void;
  onBack?: () => void;
  isGenerating?: boolean;
  isRegenerating?: boolean;
  cooldownRemaining?: number;
  autoGenerate?: boolean;
}

type TabId = "remark" | "capsules" | "details";
const TABS: { id: TabId; label: string }[] = [
  { id: "remark", label: "Remark" },
  { id: "capsules", label: "Capsules" },
  { id: "details", label: "Details" },
];

/**
 * Formats a distance in meters to a human-readable string.
 *
 * @param meters - Distance in meters.
 * @returns Formatted distance string, or empty string if no value.
 */
function formatDistance(meters?: number): string {
  if (!meters) return "";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

/**
 * Normalizes a phone number for tel: links.
 *
 * @param phone - Raw phone string.
 * @returns Cleaned phone string with international prefix.
 */
function formatPhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^00/, "+");
}

/**
 * Unified POI card with photo carousel placeholder, horizontal swipe tabs,
 * and Obelisk-first remark experience.
 *
 * @param poi - External POI data.
 * @param remark - Optional existing Obelisk remark.
 * @param onNavigate - Callback when navigation is requested.
 * @param onGenerateRemark - Callback to generate remark.
 * @param onRegenerate - Callback to regenerate existing remark.
 * @param onBack - Callback to go back to search results.
 * @param isGenerating - Whether remark generation is in progress.
 * @param isRegenerating - Whether remark regeneration is in progress.
 * @param cooldownRemaining - Seconds before regeneration allowed.
 * @param autoGenerate - Auto-trigger generation if no remark exists.
 */
export function POICard({
  poi,
  remark,
  onNavigate,
  onGenerateRemark,
  onRegenerate,
  onBack,
  isGenerating = false,
  isRegenerating = false,
  cooldownRemaining = 0,
  autoGenerate = true,
}: POICardProps) {
  const categoryColor = CATEGORY_COLORS[poi.category as CategorySlug] || CATEGORY_COLORS.history;
  const hasRemark = !!remark;

  const hasTriggeredRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("remark");
  const [tabDirection, setTabDirection] = useState(0);
  const [showCapsuleCreate, setShowCapsuleCreate] = useState(false);

  useEffect(() => {
    if (
      autoGenerate &&
      !hasRemark &&
      !isGenerating &&
      onGenerateRemark &&
      hasTriggeredRef.current !== poi?.id
    ) {
      hasTriggeredRef.current = poi?.id ?? null;
      onGenerateRemark();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, hasRemark, isGenerating, poi?.id]);

  /**
   * Switches to a tab and tracks swipe direction for animation.
   *
   * @param tab - The tab to switch to.
   */
  const switchTab = (tab: TabId) => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    const nextIndex = TABS.findIndex((t) => t.id === tab);
    setTabDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(tab);
  };

  /**
   * Handles drag-end on tab content to detect horizontal swipes.
   *
   * @param _event - Pointer event (unused).
   * @param info - Drag info with offset and velocity.
   */
  const handleTabDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const threshold = 50;
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);

    if (info.offset.x < -threshold || info.velocity.x < -200) {
      const next = Math.min(TABS.length - 1, currentIndex + 1);
      if (next !== currentIndex) switchTab(TABS[next].id);
    } else if (info.offset.x > threshold || info.velocity.x > 200) {
      const prev = Math.max(0, currentIndex - 1);
      if (prev !== currentIndex) switchTab(TABS[prev].id);
    }
  };

  return (
    <motion.article
      className="space-y-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.smooth}
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] mb-3"
          style={{ color: "var(--foreground-secondary)", fontFamily: "var(--font-ui)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Results
        </button>
      )}

      {/* Photo carousel placeholder */}
      <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "3 / 2" }}>
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--surface) 0%, var(--elevated) 100%)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground-tertiary)" }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* POI header */}
      <div className="px-1 pt-3 space-y-1">
        <h2
          className="leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--font-size-title2)",
            color: "var(--foreground)",
          }}
        >
          {poi.name}
        </h2>
        <div className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-ui)", fontSize: "var(--font-size-footnote)", color: "var(--foreground-secondary)" }}>
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <span>{poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}</span>
          {poi.distance && (
            <>
              <span style={{ color: "var(--foreground-tertiary)" }}>·</span>
              <span>{formatDistance(poi.distance)}</span>
            </>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 px-1 pt-3">
        {onNavigate && (
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-floating text-[13px] font-medium"
            style={{ fontFamily: "var(--font-ui)" }}
            onClick={onNavigate}
            whileTap={{ scale: 0.95 }}
            transition={springTransitions.quick}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Navigate
          </motion.button>
        )}

        <motion.button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-floating text-[13px] font-medium opacity-50"
          style={{ fontFamily: "var(--font-ui)" }}
          title="Coming soon"
          whileTap={{ scale: 0.95 }}
          transition={springTransitions.quick}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h2v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-3v8h2c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
          </svg>
          Echo
        </motion.button>

        <motion.button
          className="flex items-center justify-center w-8 h-8 rounded-full glass-floating text-[13px]"
          whileTap={{ scale: 0.95 }}
          transition={springTransitions.quick}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground-secondary)" }}>
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </motion.button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-4 px-1 pt-4 pb-1 border-b border-[var(--glass-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="relative pb-2"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--font-size-footnote)",
              fontWeight: 500,
              color: activeTab === tab.id ? "var(--foreground)" : "var(--foreground-secondary)",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
                transition={springTransitions.tabSwipe}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="relative min-h-[160px] overflow-hidden">
        <AnimatePresence initial={false} mode="wait" custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            initial={{ x: tabDirection * 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: tabDirection * -200, opacity: 0 }}
            transition={springTransitions.tabSwipe}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleTabDragEnd}
            className="px-1 pt-3"
          >
            {activeTab === "remark" && (
              <RemarkTab
                remark={remark}
                isGenerating={isGenerating}
                isRegenerating={isRegenerating}
                hasRemark={hasRemark}
                onRegenerate={onRegenerate}
                cooldownRemaining={cooldownRemaining}
              />
            )}
            {activeTab === "capsules" && (
              <CapsulesTab
                showCreate={showCapsuleCreate}
                onShowCreate={() => setShowCapsuleCreate(true)}
              />
            )}
            {activeTab === "details" && <DetailsTab poi={poi} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: activeTab === tab.id ? "var(--accent)" : "var(--foreground-tertiary)",
              opacity: activeTab === tab.id ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </motion.article>
  );
}

/* ─── Tab Components ─── */

interface RemarkTabProps {
  remark?: (Remark & { poi: Poi & { category?: Category } }) | null;
  isGenerating: boolean;
  isRegenerating: boolean;
  hasRemark: boolean;
  onRegenerate?: () => void;
  cooldownRemaining: number;
}

/**
 * Remark tab showing generated content, loading state, or empty prompt.
 *
 * @param remark - The remark data if available.
 * @param isGenerating - Whether initial generation is in progress.
 * @param isRegenerating - Whether regeneration is in progress.
 * @param hasRemark - Whether a remark exists.
 * @param onRegenerate - Callback to regenerate the remark.
 * @param cooldownRemaining - Seconds until regeneration is available.
 */
function RemarkTab({ remark, isGenerating, isRegenerating, hasRemark, onRegenerate, cooldownRemaining }: RemarkTabProps) {
  if ((isGenerating || isRegenerating) && !hasRemark) {
    return <LoadingState />;
  }

  if (hasRemark && remark) {
    return (
      <div className="space-y-4">
        {isRegenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl" style={{ background: "var(--glass-bg-thin)" }}>
            <LoadingState />
          </div>
        )}

        <div
          style={{
            fontFamily: "var(--font-reading)",
            fontSize: "var(--font-size-body)",
            lineHeight: 1.7,
            color: "var(--foreground)",
          }}
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
          <div
            className="rounded-xl overflow-hidden pl-3"
            style={{
              borderLeft: "3px solid var(--accent)",
              background: "var(--surface)",
            }}
          >
            <div className="py-2.5 pr-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">💡</span>
                <span
                  className="font-semibold"
                  style={{
                    fontSize: "var(--font-size-caption1)",
                    color: "var(--accent)",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  Local Tip
                </span>
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-footnote)",
                  color: "var(--foreground-secondary)",
                  lineHeight: 1.5,
                  fontFamily: "var(--font-reading)",
                }}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-0">{children}</p>,
                  }}
                >
                  {remark.localTip}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {onRegenerate && (
          <motion.button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-floating text-[12px] font-medium disabled:opacity-40"
            style={{ fontFamily: "var(--font-ui)" }}
            onClick={onRegenerate}
            disabled={isRegenerating || cooldownRemaining > 0}
            whileTap={{ scale: 0.95 }}
            transition={springTransitions.quick}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground-secondary)" }}>
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            {cooldownRemaining > 0 ? `${cooldownRemaining}s` : "Regenerate"}
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p style={{ color: "var(--foreground-secondary)", fontSize: "var(--font-size-subhead)" }}>
        No remark yet for this place
      </p>
    </div>
  );
}

interface CapsulesTabProps {
  showCreate: boolean;
  onShowCreate: () => void;
}

/**
 * Capsules tab with empty state and UI-only create flow.
 *
 * @param showCreate - Whether to show the capsule creation form.
 * @param onShowCreate - Callback to show the creation form.
 */
function CapsulesTab({ showCreate, onShowCreate }: CapsulesTabProps) {
  const [showComingSoon, setShowComingSoon] = useState(false);

  if (showCreate) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(["Text", "Voice", "Photo", "Video"] as const).map((format) => (
            <span
              key={format}
              className="px-2.5 py-1 rounded-full text-[12px] font-medium"
              style={{
                fontFamily: "var(--font-ui)",
                background: format === "Text" ? "var(--accent-subtle)" : "var(--surface)",
                color: format === "Text" ? "var(--accent)" : "var(--foreground-secondary)",
              }}
            >
              {format}
            </span>
          ))}
        </div>

        <textarea
          className="w-full rounded-xl p-3 border border-[var(--glass-border)] resize-none focus:outline-none focus:border-[var(--accent)]"
          style={{
            fontFamily: "var(--font-reading)",
            fontSize: "var(--font-size-subhead)",
            background: "var(--surface)",
            color: "var(--foreground)",
          }}
          rows={4}
          placeholder="Share your experience..."
        />

        <div className="relative">
          <motion.button
            className="px-4 py-2 rounded-full text-[13px] font-medium"
            style={{
              fontFamily: "var(--font-ui)",
              background: "var(--accent)",
              color: "#fff",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowComingSoon(true);
              setTimeout(() => setShowComingSoon(false), 2000);
            }}
          >
            Leave capsule
          </motion.button>
          <AnimatePresence>
            {showComingSoon && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-full mt-1 text-[12px]"
                style={{ color: "var(--foreground-tertiary)", fontFamily: "var(--font-ui)" }}
              >
                Coming soon
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)", opacity: 0.6 }}>
        <rect x="14" y="6" width="20" height="36" rx="10" />
        <line x1="14" y1="20" x2="34" y2="20" />
        <line x1="14" y1="28" x2="34" y2="28" />
      </svg>
      <p style={{ color: "var(--foreground-secondary)", fontSize: "var(--font-size-footnote)", fontFamily: "var(--font-ui)" }}>
        No capsules here yet
      </p>
      <motion.button
        className="px-3.5 py-1.5 rounded-full text-[13px] font-medium"
        style={{
          fontFamily: "var(--font-ui)",
          background: "var(--accent-subtle)",
          color: "var(--accent)",
        }}
        whileTap={{ scale: 0.95 }}
        onClick={onShowCreate}
      >
        Leave the first one
      </motion.button>
    </div>
  );
}

/**
 * Details tab showing address, hours, phone, website, and amenities.
 *
 * @param poi - The POI data to display details for.
 */
function DetailsTab({ poi }: { poi: ExternalPOI }) {
  const details: { icon: React.ReactNode; label: string; href?: string }[] = [];

  if (poi.address) {
    details.push({
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground-tertiary)" }}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      ),
      label: poi.address,
    });
  }

  if (poi.openingHours) {
    details.push({
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground-tertiary)" }}>
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
      ),
      label: poi.openingHours,
    });
  }

  if (poi.phone) {
    details.push({
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground-tertiary)" }}>
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      ),
      label: poi.phone,
      href: `tel:${formatPhone(poi.phone)}`,
    });
  }

  if (poi.website) {
    const displayUrl = poi.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
    details.push({
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground-tertiary)" }}>
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
        </svg>
      ),
      label: displayUrl,
      href: poi.website,
    });
  }

  const amenities: string[] = [];
  if (poi.hasWifi) amenities.push("WiFi available");
  if (poi.hasOutdoorSeating) amenities.push("Outdoor seating");
  if (poi.cuisine) amenities.push(poi.cuisine);

  return (
    <div className="space-y-3">
      {details.length > 0 && (
        <div className="space-y-2.5">
          {details.map((d, i) => {
            const content = (
              <div key={i} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 mt-0.5">{d.icon}</span>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--font-size-footnote)",
                    color: d.href ? "var(--accent)" : "var(--foreground-secondary)",
                    lineHeight: 1.4,
                  }}
                >
                  {d.label}
                </span>
              </div>
            );

            if (d.href) {
              return (
                <a key={i} href={d.href} target={d.href.startsWith("tel:") ? "_self" : "_blank"} rel="noopener noreferrer">
                  {content}
                </a>
              );
            }
            return content;
          })}
        </div>
      )}

      {amenities.length > 0 && (
        <div className="pt-2">
          <p
            className="font-medium mb-2"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--font-size-caption1)",
              color: "var(--foreground-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Good to know
          </p>
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 rounded-full text-[12px]"
                style={{
                  fontFamily: "var(--font-ui)",
                  background: "var(--surface)",
                  color: "var(--foreground-secondary)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {details.length === 0 && amenities.length === 0 && (
        <div className="text-center py-8">
          <p style={{ color: "var(--foreground-secondary)", fontSize: "var(--font-size-footnote)" }}>
            No details available
          </p>
        </div>
      )}
    </div>
  );
}
