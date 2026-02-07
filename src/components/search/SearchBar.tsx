"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";
import { GlassButton } from "@/components/ui";
import type { SearchStage } from "@/hooks/useSearch";

const STAGE_MESSAGES: Record<SearchStage, string> = {
  idle: "",
  parsing: "Understanding your question...",
  searching: "Finding stories nearby...",
  generating: "Crafting response...",
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  searchStage?: SearchStage;
  placeholder?: string;
  isUsingViewport?: boolean;
}

/**
 * Floating minimal search pill with glassmorphic styling.
 *
 * Args:
 *     onSearch: Callback when search is submitted.
 *     onClear: Callback when search is cleared.
 *     isLoading: Whether search is in progress.
 *     searchStage: Current search stage.
 *     placeholder: Placeholder text.
 *     isUsingViewport: Whether search uses viewport instead of GPS location.
 */
export function SearchBar({
  onSearch,
  onClear,
  isLoading = false,
  searchStage = "idle",
  placeholder = "Ask Obelisk anything...",
  isUsingViewport = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const hasInput = query.trim().length > 0;
  const stageMessage = STAGE_MESSAGES[searchStage];

  return (
    <form onSubmit={handleSubmit} suppressHydrationWarning>
      <motion.div
        className={clsx(
          "relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl",
          "glass-floating transition-all duration-200"
        )}
        style={{
          boxShadow: isFocused
            ? "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"
            : "var(--shadow-float)",
        }}
        transition={springTransitions.snappy}
      >
        <motion.div
          animate={{ scale: isLoading ? [1, 1.1, 1] : 1 }}
          transition={
            isLoading
              ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
              : springTransitions.quick
          }
        >
          {isLoading ? (
            <svg
              className="w-[18px] h-[18px] text-coral animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-[18px] h-[18px] text-[var(--foreground-secondary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          {isLoading && stageMessage ? (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[14px] text-coral font-medium truncate"
            >
              {stageMessage}
            </motion.p>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={clsx(
                "w-full bg-transparent outline-none text-[15px]",
                "text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)]"
              )}
              suppressHydrationWarning
            />
          )}
        </div>

        <AnimatePresence>
          {hasInput && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springTransitions.quick}
            >
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="!p-1.5"
              >
                <svg
                  className="w-4 h-4 text-[var(--foreground-secondary)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isUsingViewport && !isFocused && !isLoading && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springTransitions.quick}
            className="text-[12px] text-[var(--foreground-secondary)] text-center mt-1.5"
          >
            Searching this area
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
