"use client";

import { motion } from "framer-motion";
import { springTransitions } from "@/lib/ui/animations";

interface LocateButtonProps {
  onLocate: () => void;
  hasUserLocation: boolean;
}

/**
 * Glassmorphic locate button for centering map on user location.
 *
 * Args:
 *     onLocate: Callback when button is pressed.
 *     hasUserLocation: Whether user location is available.
 */
export function LocateButton({ onLocate, hasUserLocation }: LocateButtonProps) {
  return (
    <div className="absolute top-36 right-3 z-10">
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasUserLocation) onLocate();
        }}
        className="w-[29px] h-[29px] bg-white rounded-md flex items-center justify-center shadow-md"
        style={{
          opacity: hasUserLocation ? 1 : 0.5,
        }}
        whileHover={hasUserLocation ? { scale: 1.05 } : undefined}
        whileTap={hasUserLocation ? { scale: 0.95 } : undefined}
        transition={springTransitions.quick}
        disabled={!hasUserLocation}
        aria-label="Center on my location"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
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
