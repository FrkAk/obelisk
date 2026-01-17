"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";
import type { Remark, Poi, CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { springTransitions, notificationVariants } from "@/lib/ui/animations";

interface StoryNotificationProps {
  remark: Remark & { poi: Poi };
  onTap: () => void;
  onDismiss: () => void;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Premium notification toast for new story discoveries.
 *
 * Args:
 *     remark: The story remark with associated POI data.
 *     onTap: Callback when notification is tapped.
 *     onDismiss: Callback when notification is dismissed.
 */
export function StoryNotification({ remark, onTap, onDismiss }: StoryNotificationProps) {
  const categorySlug = (remark.poi.category?.slug ?? "history") as CategorySlug;
  const categoryColor = CATEGORY_COLORS[categorySlug];
  const darkColor = darkenColor(categoryColor, 30);

  return (
    <motion.div
      className="fixed bottom-8 left-4 right-4 z-30"
      variants={notificationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={springTransitions.quick}
      >
        <GlassCard
          className="flex items-center gap-4 cursor-pointer"
          onClick={onTap}
          padding="md"
          radius="xl"
          variant="thick"
        >
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(145deg, ${categoryColor} 0%, ${darkColor} 100%)`,
              boxShadow: `0 4px 12px ${categoryColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
            }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...springTransitions.bouncy, delay: 0.1 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              style={{ filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))" }}
            >
              <path d="M12 2L1 21h22L12 2zm0 3.83L19.13 19H4.87L12 5.83z" />
            </svg>
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.p
              className="font-semibold truncate text-[var(--foreground)]"
              style={{ fontSize: "17px" }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransitions.smooth, delay: 0.15 }}
            >
              {remark.teaser || remark.title}
            </motion.p>
            <motion.p
              className="text-[13px] text-[var(--foreground-secondary)]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransitions.smooth, delay: 0.2 }}
            >
              Tap to discover
            </motion.p>
          </div>

          <motion.button
            className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springTransitions.quick}
            aria-label="Dismiss"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[var(--foreground-secondary)]"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </motion.button>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
