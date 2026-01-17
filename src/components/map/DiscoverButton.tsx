"use client";

import { motion, AnimatePresence } from "framer-motion";
import { springTransitions, discoverButtonVariants } from "@/lib/ui/animations";

interface DiscoverButtonProps {
  onDiscover: () => void;
  status: "idle" | "discovering" | "generating" | "complete" | "error";
  progress: string;
  disabled?: boolean;
}

/**
 * Premium floating button to trigger POI discovery and story generation.
 *
 * Args:
 *     onDiscover: Callback when button is pressed.
 *     status: Current discovery status.
 *     progress: Progress message to display.
 *     disabled: Whether button is disabled.
 */
export function DiscoverButton({
  onDiscover,
  status,
  progress,
  disabled,
}: DiscoverButtonProps) {
  const isActive = status !== "idle";

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={springTransitions.bouncy}
            className="glass-thick px-5 py-3.5 rounded-full flex items-center gap-3"
            style={{
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            {status === "discovering" || status === "generating" ? (
              <div className="relative w-5 h-5">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-coral/30"
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-coral"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : status === "complete" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springTransitions.bouncy}
              >
                <svg className="w-5 h-5 text-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springTransitions.bouncy}
              >
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </motion.div>
            )}
            <span className="text-[15px] font-medium text-[var(--foreground)]">{progress}</span>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            variants={discoverButtonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="pressed"
            animate="idle"
            onClick={onDiscover}
            disabled={disabled}
            className="relative group"
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(255, 107, 74, 0.9) 0%, rgba(229, 89, 59, 0.9) 100%)",
              }}
              animate={!disabled ? {
                boxShadow: [
                  "0 0 0 0 rgba(255, 107, 74, 0.4)",
                  "0 0 0 12px rgba(255, 107, 74, 0)",
                ],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="relative flex items-center gap-2.5 px-6 py-4 rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgba(255, 107, 74, 0.9) 0%, rgba(229, 89, 59, 0.9) 100%)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 4px 16px rgba(255, 107, 74, 0.35), 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15))",
                }}
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span
                className="text-[15px]"
                style={{
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
                }}
              >
                Discover Stories
              </span>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
