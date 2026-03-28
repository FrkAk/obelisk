"use client";

import { motion } from "framer-motion";
import { springTransitions } from "@/lib/ui/animations";
import { useLocale } from "@/hooks/useLocale";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  hasUserLocation: boolean;
}

/**
 * Unified floating control pill for zoom and location.
 *
 * @param onZoomIn - Callback when zoom in is pressed.
 * @param onZoomOut - Callback when zoom out is pressed.
 * @param onLocate - Callback when locate button is pressed.
 * @param hasUserLocation - Whether user location is available.
 */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  hasUserLocation,
}: MapControlsProps) {
  const { t } = useLocale();

  return (
    <div className="absolute bottom-36 right-5 z-10 flex flex-col gap-3">
      <div className="glass-floating rounded-2xl overflow-hidden flex flex-col">
        <motion.button
          type="button"
          onClick={onZoomIn}
          className="w-12 h-12 flex items-center justify-center border-b border-[var(--glass-border)]"
          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
          whileTap={{ scale: 0.95 }}
          transition={springTransitions.quick}
          aria-label={t("map.zoomIn")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-[var(--foreground)]"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>

        <motion.button
          type="button"
          onClick={onZoomOut}
          className="w-12 h-12 flex items-center justify-center"
          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
          whileTap={{ scale: 0.95 }}
          transition={springTransitions.quick}
          aria-label={t("map.zoomOut")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-[var(--foreground)]"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
      </div>

      <motion.button
        type="button"
        onClick={() => {
          if (hasUserLocation) onLocate();
        }}
        className="w-12 h-12 glass-floating rounded-2xl flex items-center justify-center"
        style={{
          opacity: hasUserLocation ? 1 : 0.5,
        }}
        whileHover={hasUserLocation ? { scale: 1.05 } : undefined}
        whileTap={hasUserLocation ? { scale: 0.95 } : undefined}
        transition={springTransitions.quick}
        disabled={!hasUserLocation}
        aria-label={t("map.locateMe")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-[var(--foreground)]"
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </motion.button>
    </div>
  );
}
