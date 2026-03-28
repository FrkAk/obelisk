"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { OBELISK_ICON_PATH } from "@/lib/ui/constants";
import { useLocale } from "@/hooks/useLocale";

const ROTATE_INTERVAL_MS = 4000;

interface LoadingStateProps {
  phrases?: string[];
  className?: string;
}

/**
 * Branded loading state with Obelisk silhouette icon, progressive phrases, and clip-path text reveal.
 *
 * @param phrases - Array of thinking phrases to rotate through.
 * @param className - Additional CSS classes.
 */
export function LoadingState({
  phrases,
  className,
}: LoadingStateProps) {
  const { t } = useLocale();
  const effectivePhrases = phrases ?? [
    t("loading.moment"),
    t("loading.lookingInto"),
    t("loading.gatheringStories"),
    t("loading.piecingTogether"),
    t("loading.crafting"),
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % effectivePhrases.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [effectivePhrases.length]);

  return (
    <div
      className={clsx("flex items-center gap-2.5", className)}
      style={{ fontFamily: "var(--font-reading)", fontStyle: "italic" }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0"
        style={{
          width: 18,
          height: 24,
          color: "var(--accent)",
          filter: "drop-shadow(0 0 4px var(--accent-subtle))",
        }}
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d={OBELISK_ICON_PATH} />
      </motion.svg>

      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="text-tertiary"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {effectivePhrases[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
