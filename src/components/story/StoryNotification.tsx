"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";
import type { Remark, Poi, CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";

interface StoryNotificationProps {
  remark: Remark & { poi: Poi };
  onTap: () => void;
  onDismiss: () => void;
}

export function StoryNotification({ remark, onTap, onDismiss }: StoryNotificationProps) {
  const categorySlug = (remark.poi.category?.slug ?? "history") as CategorySlug;
  const categoryColor = CATEGORY_COLORS[categorySlug];

  return (
    <motion.div
      className="fixed bottom-8 left-4 right-4 z-30"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <GlassCard
        className="flex items-center gap-3 cursor-pointer"
        onClick={onTap}
        padding="md"
        radius="xl"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L1 21h22L12 2zm0 3.83L19.13 19H4.87L12 5.83z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {remark.teaser || remark.title}
          </p>
          <p className="text-sm text-foreground-secondary">
            Tap to discover
          </p>
        </div>

        <button
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Dismiss"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-foreground-secondary">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </GlassCard>
    </motion.div>
  );
}
