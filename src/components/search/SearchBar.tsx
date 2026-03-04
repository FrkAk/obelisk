"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";

const PROMPT_SUGGESTIONS = [
  "A quiet cafe near the river...",
  "Something hidden nearby...",
  "Where locals eat lunch...",
  "Best view of the old town...",
  "A place with history...",
  "Somewhere peaceful to read...",
  "A courtyard off the beaten path...",
];

/** Number of prompts shown at a time. */
const PROMPTS_VISIBLE = 3;

/** Rotation interval in ms. */
const PROMPT_ROTATE_MS = 8000;

interface AutocompleteSuggestion {
  name: string;
  category: string;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  onInputChange?: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  isUsingViewport?: boolean;
  suggestions?: AutocompleteSuggestion[];
  onSuggestionSelect?: (name: string) => void;
}

/**
 * Floating minimal search pill with glassmorphic styling, autocomplete, and contextual prompt suggestions.
 *
 * Shows rotating prompt pills below the bar when empty and unfocused. Tapping a prompt
 * fills the input and submits the search.
 *
 * @param onSearch - Callback when search is submitted.
 * @param onClear - Callback when search is cleared.
 * @param onInputChange - Callback when input text changes (for autocomplete).
 * @param isLoading - Whether search is in progress.
 * @param placeholder - Placeholder text.
 * @param isUsingViewport - Whether search uses viewport instead of GPS location.
 * @param suggestions - Autocomplete suggestion items to display.
 * @param onSuggestionSelect - Callback when a suggestion is tapped.
 */
export function SearchBar({
  onSearch,
  onClear,
  onInputChange,
  isLoading = false,
  placeholder = "Ask Obelisk anything...",
  isUsingViewport = false,
  suggestions = [],
  onSuggestionSelect,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [promptOffset, setPromptOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptOffset((prev) => (prev + PROMPTS_VISIBLE) % PROMPT_SUGGESTIONS.length);
    }, PROMPT_ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onInputChange?.(value);
    },
    [onInputChange]
  );

  const handleSuggestionTap = useCallback(
    (name: string) => {
      setQuery(name);
      onSuggestionSelect?.(name);
    },
    [onSuggestionSelect]
  );

  const handlePromptTap = useCallback(
    (prompt: string) => {
      setQuery(prompt);
      onSearch(prompt);
    },
    [onSearch]
  );

  const hasInput = query.trim().length > 0;
  const showSuggestions = isFocused && suggestions.length > 0 && !isLoading;
  const showPrompts = !isFocused && !hasInput && !isLoading;

  const visiblePrompts = PROMPT_SUGGESTIONS.slice(
    promptOffset,
    promptOffset + PROMPTS_VISIBLE
  ).concat(
    promptOffset + PROMPTS_VISIBLE > PROMPT_SUGGESTIONS.length
      ? PROMPT_SUGGESTIONS.slice(0, (promptOffset + PROMPTS_VISIBLE) - PROMPT_SUGGESTIONS.length)
      : []
  );

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} suppressHydrationWarning>
        <motion.div
          className={clsx(
            "relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl",
            "glass-floating transition-all duration-200"
          )}
          style={{
            borderColor: isFocused ? "var(--glass-border-strong)" : undefined,
            boxShadow: isFocused
              ? "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"
              : "var(--shadow-float)",
          }}
          transition={springTransitions.snappy}
        >
          {isLoading ? (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 animate-amber-pulse"
              style={{ background: "var(--accent)" }}
            />
          ) : (
            <svg
              className="w-[18px] h-[18px] text-[var(--foreground-secondary)] flex-shrink-0"
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

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className={clsx(
              "flex-1 min-w-0 bg-transparent outline-none text-[15px]",
              "text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)]"
            )}
            style={{ fontFamily: "var(--font-ui)" }}
            suppressHydrationWarning
          />

          <AnimatePresence>
            {hasInput && !isLoading && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransitions.quick}
                onClick={handleClear}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 text-[var(--foreground-secondary)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              </motion.button>
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
              className="text-[12px] text-[var(--foreground-tertiary)] text-center mt-1.5"
            >
              Searching this area
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {/* Contextual prompt suggestions */}
      <AnimatePresence mode="wait">
        {showPrompts && (
          <motion.div
            key={promptOffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-2 mt-2.5 justify-center"
          >
            {visiblePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handlePromptTap(prompt)}
                className={clsx(
                  "glass-thin rounded-full px-3 py-1.5 text-[13px]",
                  "text-[var(--foreground-tertiary)] hover:text-[var(--foreground-secondary)]",
                  "transition-colors duration-200 cursor-pointer"
                )}
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springTransitions.quick}
            className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 glass-floating"
            style={{
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            {suggestions.slice(0, 5).map((suggestion, i) => (
              <button
                key={`${suggestion.name}-${suggestion.category}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionTap(suggestion.name)}
                className={clsx(
                  "w-full text-left px-4 py-2.5 flex items-center justify-between",
                  "hover:bg-[var(--glass-bg)] transition-colors duration-150",
                  i < suggestions.slice(0, 5).length - 1 && "border-b border-[var(--glass-border)]"
                )}
              >
                <span
                  className="text-[14px] text-[var(--foreground)] truncate font-medium"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {suggestion.name}
                </span>
                <span className="text-[12px] text-[var(--foreground-tertiary)] ml-3 flex-shrink-0">
                  {suggestion.category}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
