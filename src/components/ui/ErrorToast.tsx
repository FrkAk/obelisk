"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationVariants } from "@/lib/ui/animations";
import { useLocale } from "@/hooks/useLocale";

interface ErrorToastProps {
  message: string | null;
  onClose: () => void;
}

/**
 * Floating glassmorphic error toast that appears above the bottom sheet.
 * Auto-dismisses after 6s. Only shows the latest error.
 *
 * @param message - Error message to display, or null to hide.
 * @param onClose - Callback to clear the error state.
 */
export function ErrorToast({ message, onClose }: ErrorToastProps) {
  const { t } = useLocale();
  const [showReported, setShowReported] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismiss, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, dismiss]);

  const handleReport = () => {
    setShowReported(true);
    // TODO: implement error reporting — send to backend
    setTimeout(() => setShowReported(false), 2000);
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed bottom-20 left-3 right-3 z-[60] max-w-[520px] mx-auto"
          variants={notificationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div
            className="glass-floating rounded-xl px-4 py-3"
            style={{ borderLeft: "3px solid var(--color-error)" }}
          >
            <div className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 mt-0.5"
                style={{ color: "var(--color-error)" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <p
                className="flex-1 text-[13px] leading-snug"
                style={{
                  fontFamily: "var(--font-ui)",
                  color: "var(--foreground)",
                }}
              >
                {message}
              </p>

              <button
                onClick={dismiss}
                className="flex-shrink-0 -mt-0.5 -mr-1 p-1"
                style={{ color: "var(--foreground-tertiary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={handleReport}
                className="glass-floating rounded-full px-2.5 py-1 text-[11px]"
                style={{
                  fontFamily: "var(--font-ui)",
                  color: "var(--foreground-tertiary)",
                }}
              >
                {showReported ? t("details.reported") : t("poi.report")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
