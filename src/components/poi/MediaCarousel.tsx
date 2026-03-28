"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { isValidHttpUrl } from "@/lib/url";
import { overlayVariants, fullscreenVariants, springTransitions } from "@/lib/ui/animations";
import type { PoiImage } from "@/types/api";
import { useLocale } from "@/hooks/useLocale";

const StreetView = dynamic(() => import("./StreetView"), { ssr: false });

interface MediaCarouselProps {
  images: PoiImage[];
  mapillaryId?: string;
  mapillaryBearing?: number;
  mapillaryIsPano?: boolean;
  poiName: string;
  poiId?: string;
  compact?: boolean;
  categoryColor?: string;
}

/**
 * Image carousel with scroll-snap, dot indicators, and optional Mapillary street view.
 *
 * @param images - Array of POI images.
 * @param mapillaryId - Mapillary image key for street view slide.
 * @param mapillaryBearing - Camera bearing for the street view.
 * @param mapillaryIsPano - Whether the Mapillary image is a panorama.
 * @param poiName - POI name for alt text.
 * @param poiId - Optional DB UUID for on-demand media enrichment.
 */
export function MediaCarousel({
  images,
  mapillaryId,
  mapillaryBearing,
  mapillaryIsPano,
  poiName,
  poiId,
  compact = false,
  categoryColor,
}: MediaCarouselProps) {
  const { t } = useLocale();
  const [enrichedImages, setEnrichedImages] = useState<PoiImage[]>([]);
  const [enrichedMapillary, setEnrichedMapillary] = useState<{
    mapillaryId: string;
    mapillaryBearing: number;
    mapillaryIsPano: boolean;
  } | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const enrichedRef = useRef<string | null>(null);

  const allImages = [...images, ...enrichedImages].filter((img) => isValidHttpUrl(img.url));
  const effectiveMapillaryId = mapillaryId ?? enrichedMapillary?.mapillaryId;
  const effectiveBearing = mapillaryBearing ?? enrichedMapillary?.mapillaryBearing ?? 0;
  const effectiveIsPano = mapillaryIsPano ?? enrichedMapillary?.mapillaryIsPano;

  const validImages = allImages;
  const hasStreetView = !!effectiveMapillaryId;
  const totalSlides = validImages.length + (hasStreetView ? 1 : 0);
  const showDots = totalSlides > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [streetViewVisible, setStreetViewVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [fullscreenActiveIndex, setFullscreenActiveIndex] = useState(0);
  const [streetViewActivated, setStreetViewActivated] = useState(false);
  const [svLabelCollapsed, setSvLabelCollapsed] = useState(false);
  const [miniSvActivated, setMiniSvActivated] = useState(false);
  const [miniSvLabelCollapsed, setMiniSvLabelCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);
  const streetViewSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const propsHaveMedia = images.some((img) => isValidHttpUrl(img.url));
    if (propsHaveMedia || !poiId || enrichedRef.current === poiId) return;

    enrichedRef.current = poiId;
    setIsEnriching(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: show shimmer before async fetch

    fetch("/api/poi/enrich-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.images?.length) setEnrichedImages(data.images);
        if (data.mapillaryId) {
          setEnrichedMapillary({
            mapillaryId: data.mapillaryId,
            mapillaryBearing: data.mapillaryBearing ?? 0,
            mapillaryIsPano: data.mapillaryIsPano ?? false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsEnriching(false));
  }, [poiId, images, mapillaryId]);

  const streetViewSlideIndex = validImages.length;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || totalSlides === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.min(index, totalSlides - 1);
    setActiveIndex(clamped);
    if (hasStreetView && clamped !== streetViewSlideIndex) {
      setMiniSvActivated(false);
    }
  }, [totalSlides, hasStreetView, streetViewSlideIndex]);

  const handleFullscreenScroll = useCallback(() => {
    const el = fullscreenScrollRef.current;
    if (!el || totalSlides === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.min(index, totalSlides - 1);
    setFullscreenActiveIndex(clamped);
    // Deactivate street view interaction when user swipes away
    if (hasStreetView && clamped !== streetViewSlideIndex) {
      setStreetViewActivated(false);
    }
  }, [totalSlides, hasStreetView, streetViewSlideIndex]);

  useEffect(() => {
    if (!hasStreetView) return;

    // If street view is the first/only slide, it's already visible — no observer needed
    if (validImages.length === 0) {
      setStreetViewVisible(true); // eslint-disable-line react-hooks/set-state-in-effect -- street view is only slide, must show immediately
      return;
    }

    if (!streetViewSentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStreetViewVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(streetViewSentinelRef.current);
    return () => observer.disconnect();
  }, [hasStreetView, validImages.length]);

  // Auto-collapse street view button label after 1.5s
  useEffect(() => {
    if (fullscreenIndex === null) return;
    setSvLabelCollapsed(false); // eslint-disable-line react-hooks/set-state-in-effect -- reset label on activation change
    const timer = setTimeout(() => setSvLabelCollapsed(true), 1500);
    return () => clearTimeout(timer);
  }, [streetViewActivated, fullscreenIndex]);

  // Auto-collapse mini street view button label after 1.5s
  useEffect(() => {
    setMiniSvLabelCollapsed(false); // eslint-disable-line react-hooks/set-state-in-effect -- reset label on activation change
    const timer = setTimeout(() => setMiniSvLabelCollapsed(true), 1500);
    return () => clearTimeout(timer);
  }, [miniSvActivated]);

  // Escape key closes fullscreen
  useEffect(() => {
    if (fullscreenIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreenIndex]);

  // Scroll fullscreen carousel to the opened slide
  useEffect(() => {
    if (fullscreenIndex === null) return;
    setFullscreenActiveIndex(fullscreenIndex); // eslint-disable-line react-hooks/set-state-in-effect -- sync index before portal mounts
    setStreetViewActivated(false);
    // Wait a frame for the portal to mount, then scroll
    requestAnimationFrame(() => {
      fullscreenScrollRef.current?.scrollTo({
        left: fullscreenIndex * window.innerWidth,
        behavior: "instant",
      });
    });
  }, [fullscreenIndex]);

  const aspectRatio = compact ? "2 / 1" : "3 / 2";

  if (totalSlides === 0) {
    if (isEnriching) {
      return (
        <div
          className="relative w-full overflow-hidden rounded-xl mt-3"
          style={{ aspectRatio, transition: "aspect-ratio 0.3s ease" }}
        >
          <div className="w-full h-full shimmer" />
        </div>
      );
    }

    return (
      <div
        className="relative w-full overflow-hidden rounded-xl mt-3"
        style={{ aspectRatio, transition: "aspect-ratio 0.3s ease" }}
      >
        <div
          className="w-full h-full flex flex-col items-center justify-center"
          style={{
            background: categoryColor
              ? `linear-gradient(135deg, ${categoryColor}18 0%, ${categoryColor}08 100%)`
              : "linear-gradient(135deg, var(--surface) 0%, var(--elevated) 100%)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: categoryColor ?? "var(--foreground-tertiary)", opacity: 0.4 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      </div>
    );
  }

  const isStreetViewSlide = (i: number) => hasStreetView && i === streetViewSlideIndex;

  /** Returns the source label for a given slide index. */
  const getSlideLabel = (i: number) => {
    if (isStreetViewSlide(i)) return t("media.streetView");
    const img = validImages[i];
    if (!img) return null;
    return img.source === "commons" ? "Wikimedia" : img.source;
  };

  const fullscreenOverlay =
    fullscreenIndex !== null
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key="fullscreen-backdrop"
              className="fixed inset-0 z-[100] flex flex-col"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)",
              }}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Top bar: counter + close */}
              <motion.div
                className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe"
                style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)" }}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {/* POI name */}
                <div
                  className="px-3 py-1.5 rounded-full glass-floating text-[13px] font-medium max-w-[60%] truncate"
                  style={{ fontFamily: "var(--font-ui)", color: "var(--foreground)" }}
                >
                  {poiName}
                </div>

                <div className="flex items-center gap-2">
                  {/* Counter pill */}
                  {totalSlides > 1 && (
                    <div
                      className="px-3 py-1.5 rounded-full glass-floating text-[13px] tabular-nums"
                      style={{ fontFamily: "var(--font-ui)", color: "var(--foreground-secondary)" }}
                    >
                      {fullscreenActiveIndex + 1}
                      <span style={{ opacity: 0.4 }}> / </span>
                      {totalSlides}
                    </div>
                  )}

                  {/* Lock button — visible when street view is interactive */}
                  <AnimatePresence>
                    {streetViewActivated && isStreetViewSlide(fullscreenActiveIndex) && (
                      <motion.button
                        key="lock-btn"
                        className="h-10 flex items-center rounded-full glass-floating overflow-hidden"
                        style={{ fontFamily: "var(--font-ui)", color: "var(--foreground)", paddingLeft: 12, paddingRight: 12 }}
                        onClick={() => setStreetViewActivated(false)}
                        initial={{ opacity: 0, scale: 0.8, width: "auto" }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={springTransitions.floatingEntry}
                        whileTap={{ scale: 0.92 }}
                        aria-label="Lock to swipe"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <motion.span
                          className="overflow-hidden whitespace-nowrap text-[13px] font-medium inline-block"
                          animate={svLabelCollapsed
                            ? { maxWidth: 0, opacity: 0, marginLeft: 0 }
                            : { maxWidth: 40, opacity: 1, marginLeft: 8 }
                          }
                          transition={springTransitions.liquid}
                        >
                          {t("media.lock")}
                        </motion.span>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Close button */}
                  <motion.button
                    className="w-10 h-10 flex items-center justify-center rounded-full glass-floating"
                    onClick={() => setFullscreenIndex(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: "var(--foreground)" }}
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>

              {/* Swipeable fullscreen slides */}
              <motion.div
                className="flex-1 min-h-0"
                variants={fullscreenVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div
                  ref={fullscreenScrollRef}
                  onScroll={handleFullscreenScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
                >
                  {validImages.map((img) => (
                    <div
                      key={`fs-${img.id}`}
                      className="relative w-full h-full flex-shrink-0 snap-start flex items-center justify-center"
                      style={{ minWidth: "100vw" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={poiName}
                        className="max-w-full max-h-full object-contain"
                        style={{ borderRadius: "var(--radius-md)" }}
                      />
                    </div>
                  ))}

                  {hasStreetView && (
                    <div
                      className="relative w-full h-full flex-shrink-0 snap-start"
                      style={{ minWidth: "100vw" }}
                    >
                      <StreetView
                        mapillaryId={effectiveMapillaryId!}
                        bearing={effectiveBearing}
                        isPano={effectiveIsPano}
                        interactive={streetViewActivated}
                      />
                      {/* Explore overlay — icon-only center button */}
                      {!streetViewActivated && (
                        <button
                          className="absolute inset-0 z-10 flex items-center justify-center"
                          onClick={() => setStreetViewActivated(true)}
                          aria-label="Explore street view"
                        >
                          <motion.div
                            className="flex items-center h-10 rounded-full glass-floating overflow-hidden"
                            style={{ fontFamily: "var(--font-ui)", color: "var(--foreground)", paddingLeft: 12, paddingRight: 12 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={springTransitions.floatingEntry}
                            whileTap={{ scale: 0.92 }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                              <polyline points="5 9 2 12 5 15" />
                              <polyline points="9 5 12 2 15 5" />
                              <polyline points="15 19 12 22 9 19" />
                              <polyline points="19 9 22 12 19 15" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <line x1="12" y1="2" x2="12" y2="22" />
                            </svg>
                            <motion.span
                              className="overflow-hidden whitespace-nowrap text-[13px] font-medium inline-block"
                              animate={svLabelCollapsed
                                ? { maxWidth: 0, opacity: 0, marginLeft: 0 }
                                : { maxWidth: 60, opacity: 1, marginLeft: 8 }
                              }
                              transition={springTransitions.liquid}
                            >
                              {t("media.explore")}
                            </motion.span>
                          </motion.div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bottom bar: source label + dot indicators */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 pb-safe"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {/* Source label */}
                <div
                  className="px-3 py-1.5 rounded-full glass-floating text-[11px]"
                  style={{ fontFamily: "var(--font-ui)", color: "var(--foreground-tertiary)" }}
                >
                  {getSlideLabel(fullscreenActiveIndex)}
                </div>

                {/* Dot indicators */}
                {totalSlides > 1 && (
                  <div className="flex gap-1.5 px-3 py-1.5 rounded-full glass-floating">
                    {Array.from({ length: totalSlides }, (_, i) => (
                      <button
                        key={i}
                        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            i === fullscreenActiveIndex
                              ? "var(--accent)"
                              : "var(--foreground-tertiary)",
                          opacity: i === fullscreenActiveIndex ? 1 : 0.3,
                          transform: i === fullscreenActiveIndex ? "scale(1.3)" : "scale(1)",
                        }}
                        onClick={() => {
                          setFullscreenActiveIndex(i);
                          fullscreenScrollRef.current?.scrollTo({
                            left: i * window.innerWidth,
                            behavior: "smooth",
                          });
                        }}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl mt-3"
      style={{ aspectRatio, transition: "aspect-ratio 0.3s ease" }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
      >
        {validImages.map((img, i) => (
          <div key={img.id} className="relative w-full h-full flex-shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={poiName}
              className="w-full h-full object-cover"
            />
            {/* Source label */}
            <div
              className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full glass-floating text-[11px]"
              style={{ fontFamily: "var(--font-ui)", color: "var(--foreground-tertiary)" }}
            >
              {img.source === "commons" ? "Wikimedia" : img.source}
            </div>
            {/* Expand button */}
            <motion.button
              className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full glass-floating"
              onClick={() => setFullscreenIndex(i)}
              whileTap={{ scale: 0.9 }}
              aria-label="Expand"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </motion.button>
          </div>
        ))}

        {hasStreetView && (
          <div ref={streetViewSentinelRef} className="relative w-full h-full flex-shrink-0 snap-start">
            {streetViewVisible ? (
              <StreetView
                mapillaryId={effectiveMapillaryId!}
                bearing={effectiveBearing}
                isPano={effectiveIsPano}
                interactive={miniSvActivated}
              />
            ) : (
              <div className="w-full h-full shimmer" />
            )}

            {/* Explore overlay — centered icon button */}
            {!miniSvActivated && streetViewVisible && (
              <button
                className="absolute inset-0 z-10 flex items-center justify-center"
                onClick={() => setMiniSvActivated(true)}
                aria-label="Explore street view"
              >
                <motion.div
                  className="flex items-center h-8 rounded-full glass-floating overflow-hidden"
                  style={{ fontFamily: "var(--font-ui)", color: "var(--foreground)", paddingLeft: 10, paddingRight: 10 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springTransitions.floatingEntry}
                  whileTap={{ scale: 0.92 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="5 9 2 12 5 15" />
                    <polyline points="9 5 12 2 15 5" />
                    <polyline points="15 19 12 22 9 19" />
                    <polyline points="19 9 22 12 19 15" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                  <motion.span
                    className="overflow-hidden whitespace-nowrap text-[11px] font-medium inline-block"
                    animate={miniSvLabelCollapsed
                      ? { maxWidth: 0, opacity: 0, marginLeft: 0 }
                      : { maxWidth: 50, opacity: 1, marginLeft: 6 }
                    }
                    transition={springTransitions.liquid}
                  >
                    {t("media.explore")}
                  </motion.span>
                </motion.div>
              </button>
            )}

            {/* Top-right buttons: lock + expand */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
              <AnimatePresence>
                {miniSvActivated && (
                  <motion.button
                    key="mini-lock"
                    className="h-8 flex items-center rounded-full glass-floating overflow-hidden"
                    style={{ fontFamily: "var(--font-ui)", color: "var(--foreground)", paddingLeft: 10, paddingRight: 10 }}
                    onClick={() => setMiniSvActivated(false)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={springTransitions.floatingEntry}
                    whileTap={{ scale: 0.92 }}
                    aria-label="Lock to swipe"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <motion.span
                      className="overflow-hidden whitespace-nowrap text-[11px] font-medium inline-block"
                      animate={miniSvLabelCollapsed
                        ? { maxWidth: 0, opacity: 0, marginLeft: 0 }
                        : { maxWidth: 32, opacity: 1, marginLeft: 6 }
                      }
                      transition={springTransitions.liquid}
                    >
                      {t("media.lock")}
                    </motion.span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Expand to fullscreen */}
              <motion.button
                className="w-8 h-8 flex items-center justify-center rounded-full glass-floating"
                onClick={() => setFullscreenIndex(streetViewSlideIndex)}
                whileTap={{ scale: 0.9 }}
                aria-label="Expand"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {showDots && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full glass-floating">
          {Array.from({ length: totalSlides }, (_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
              style={{
                backgroundColor:
                  i === activeIndex ? "var(--accent)" : "var(--foreground-tertiary)",
                opacity: i === activeIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}

      {fullscreenOverlay}
    </div>
  );
}
