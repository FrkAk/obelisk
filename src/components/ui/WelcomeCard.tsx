"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/hooks/useLocale";
import { springTransitions } from "@/lib/ui/animations";
import { OBELISK_ICON_PATH } from "@/lib/ui/constants";

const STORAGE_KEY = "obelisk-welcome-dismissed";

/**
 * Full-screen welcome overlay shown on first visit.
 *
 * Displays early access warning about bugs, unstable search, and AI hallucinations.
 * Persists dismissal to localStorage. Language auto-detected from browser.
 */
export function WelcomeCard() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  /**
   * Dismisses the welcome card and persists to localStorage.
   */
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative max-w-[380px] w-full glass-floating rounded-3xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={springTransitions.liquid}
          >
            {/* Accent top edge */}
            <div
              className="h-[3px] w-full"
              style={{
                background: "linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent) 70%, transparent 100%)",
              }}
            />

            <div className="px-6 pt-6 pb-5 space-y-5">
              {/* Icon + badge */}
              <div className="flex items-start justify-between">
                <motion.svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    width: 28,
                    height: 36,
                    color: "var(--accent)",
                    filter: "drop-shadow(0 0 8px var(--accent-subtle))",
                  }}
                  animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path d={OBELISK_ICON_PATH} />
                </motion.svg>

                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase"
                  style={{
                    fontFamily: "var(--font-ui)",
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("welcome.earlyAccess")}
                </span>
              </div>

              {/* Title */}
              <h1
                className="leading-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--font-size-title2)",
                  color: "var(--foreground)",
                }}
              >
                {t("welcome.title")}
              </h1>

              {/* Body */}
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: "var(--font-reading)",
                  fontSize: "var(--font-size-subhead)",
                  color: "var(--foreground-secondary)",
                  lineHeight: 1.65,
                }}
              >
                {t("welcome.body")}
              </p>

              {/* CTA button */}
              <motion.button
                className="w-full py-3 rounded-2xl text-[15px] font-medium"
                style={{
                  fontFamily: "var(--font-ui)",
                  background: "var(--accent)",
                  color: "#fff",
                }}
                onClick={handleDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={springTransitions.snappy}
              >
                {t("welcome.okay")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
