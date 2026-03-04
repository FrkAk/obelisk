"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const DEFAULT_PHRASES = [
  "Discovering what makes this place special\u2026",
  "Gathering local stories\u2026",
  "Crafting your remark\u2026",
];

const ROTATE_INTERVAL_MS = 3000;

interface LoadingStateProps {
  phrases?: string[];
  className?: string;
}

/**
 * Rotating contextual loading phrases with crossfade and amber pulse dot.
 *
 * Args:
 *     phrases: Array of thinking phrases to rotate through.
 *     className: Additional CSS classes.
 */
export function LoadingState({
  phrases = DEFAULT_PHRASES,
  className,
}: LoadingStateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div
      className={clsx("flex items-center gap-2", className)}
      style={{ fontFamily: "var(--font-reading)", fontStyle: "italic" }}
    >
      <span
        className="animate-amber-pulse inline-block h-2 w-2 rounded-full flex-shrink-0"
        style={{ background: "var(--accent)" }}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="text-tertiary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
