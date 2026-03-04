"use client";

import { motion } from "framer-motion";
import type { Remark, Poi, Category } from "@/types/api";
import { springTransitions, notificationVariants } from "@/lib/ui/animations";

interface RemarkNotificationProps {
  remark: Remark & { poi: Poi & { category?: Category } };
  onTap: () => void;
  onDismiss: () => void;
}

/**
 * Floating liquid glass notification toast for new remark discoveries.
 *
 * Renders a clean, understated card with amber accent border, amber dot indicator,
 * POI name in display serif, and teaser in reading serif.
 *
 * @param remark - The remark with associated POI data.
 * @param onTap - Callback when notification is tapped.
 * @param onDismiss - Callback when notification is dismissed.
 */
export function RemarkNotification({ remark, onTap, onDismiss }: RemarkNotificationProps) {
  return (
    <motion.div
      className="fixed bottom-14 left-4 right-4 z-30"
      variants={notificationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.button
        className="w-full glass-liquid rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer text-left"
        style={{ borderLeft: "3px solid var(--accent)" }}
        onClick={onTap}
        whileTap={{ scale: 0.98 }}
        transition={springTransitions.quick}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "var(--accent)" }}
        />

        <div className="flex-1 min-w-0">
          <p
            className="truncate text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)", fontSize: "17px" }}
          >
            {remark.poi.name}
          </p>
          <p
            className="text-[14px] text-[var(--foreground-secondary)] line-clamp-1"
            style={{ fontFamily: "var(--font-reading)" }}
          >
            {remark.teaser || remark.title}
          </p>
        </div>

        <motion.div
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={springTransitions.quick}
          role="button"
          aria-label="Dismiss"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-[var(--foreground-secondary)]"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
