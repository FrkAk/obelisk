"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";
import { QuickFilters } from "./QuickFilter";
import { GlassButton } from "@/components/ui";
import type { CategorySlug } from "@/types";
import type { SearchStage } from "@/hooks/useSearch";

const STAGE_MESSAGES: Record<SearchStage, string> = {
  idle: "",
  parsing: "Understanding your question...",
  searching: "Finding stories nearby...",
  generating: "Crafting response...",
};

interface SearchBarProps {
  onSearch: (query: string, category?: CategorySlug) => void;
  onClear?: () => void;
  isLoading?: boolean;
  searchStage?: SearchStage;
  placeholder?: string;
}

/**
 * Intelligent search bar with glassmorphic styling and quick filters.
 *
 * Args:
 *     onSearch: Callback when search is submitted.
 *     onClear: Callback when search is cleared.
 *     isLoading: Whether search is in progress.
 *     placeholder: Placeholder text.
 */
export function SearchBar({
  onSearch,
  onClear,
  isLoading = false,
  searchStage = "idle",
  placeholder = "Ask Obelisk anything...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategorySlug | undefined>();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim() || activeCategory) {
        onSearch(query.trim(), activeCategory);
      }
    },
    [query, activeCategory, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setActiveCategory(undefined);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const handleCategoryChange = useCallback(
    (category: CategorySlug | undefined) => {
      setActiveCategory(category);
      if (category && !query.trim()) {
        onSearch("", category);
      }
    },
    [query, onSearch]
  );

  const hasInput = query.trim().length > 0 || activeCategory !== undefined;

  const stageMessage = STAGE_MESSAGES[searchStage];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit}>
        <motion.div
          className={clsx(
            "relative flex items-center gap-3 px-4 py-3 rounded-2xl",
            "glass transition-all duration-200",
            isFocused && "ring-2 ring-coral/30"
          )}
          style={{
            boxShadow: isFocused
              ? "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 var(--glass-border-highlight)"
              : "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 0.5px 0 var(--glass-border-highlight)",
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
                className="w-5 h-5 text-coral animate-spin"
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
                className="w-5 h-5 text-[var(--foreground-secondary)]"
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
                  "w-full bg-transparent outline-none text-[16px]",
                  "text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)]"
                )}
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
      </form>

      <QuickFilters
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
