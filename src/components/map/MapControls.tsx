"use client";

import { motion } from "framer-motion";
import { springTransitions } from "@/lib/ui/animations";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  hasUserLocation: boolean;
}

/**
 * Glassmorphic map controls for zoom and location.
 *
 * Args:
 *     onZoomIn: Callback when zoom in is pressed.
 *     onZoomOut: Callback when zoom out is pressed.
 *     onLocate: Callback when locate button is pressed.
 *     hasUserLocation: Whether user location is available.
 */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  hasUserLocation,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-32 right-4 z-10 flex flex-col gap-2">
      <motion.button
        type="button"
        onClick={onZoomIn}
        className="w-11 h-11 glass rounded-xl flex items-center justify-center"
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 var(--glass-border-highlight)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springTransitions.quick}
        aria-label="Zoom in"
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
        className="w-11 h-11 glass rounded-xl flex items-center justify-center"
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 var(--glass-border-highlight)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springTransitions.quick}
        aria-label="Zoom out"
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

      <motion.button
        type="button"
        onClick={() => {
          if (hasUserLocation) onLocate();
        }}
        className="w-11 h-11 glass rounded-xl flex items-center justify-center"
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 var(--glass-border-highlight)",
          opacity: hasUserLocation ? 1 : 0.5,
        }}
        whileHover={hasUserLocation ? { scale: 1.05 } : undefined}
        whileTap={hasUserLocation ? { scale: 0.95 } : undefined}
        transition={springTransitions.quick}
        disabled={!hasUserLocation}
        aria-label="Center on my location"
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
