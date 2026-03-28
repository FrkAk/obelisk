"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";
import { useLocale } from "@/hooks/useLocale";
import type { Locale } from "@/lib/i18n/translations";

/** Rotation interval for placeholder text in ms. */
const PLACEHOLDER_ROTATE_MS = 4000;

const LANGUAGE_OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: "en", flag: "\uD83C\uDDEC\uD83C\uDDE7", label: "English" },
  { locale: "tr", flag: "\uD83C\uDDF9\uD83C\uDDF7", label: "T\u00FCrk\u00E7e" },
];

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
 * Floating minimal search pill with glassmorphic styling, autocomplete, rotating placeholder suggestions, and language switcher.
 *
 * @param onSearch - Callback when search is submitted.
 * @param onClear - Callback when search is cleared.
 * @param onInputChange - Callback when input text changes (for autocomplete).
 * @param isLoading - Whether search is in progress.
 * @param placeholder - Placeholder text shown when focused.
 * @param isUsingViewport - Whether search uses viewport instead of GPS location.
 * @param suggestions - Autocomplete suggestion items to display.
 * @param onSuggestionSelect - Callback when a suggestion is tapped.
 */
export function SearchBar({
  onSearch,
  onClear,
  onInputChange,
  isLoading = false,
  placeholder,
  isUsingViewport = false,
  suggestions = [],
  onSuggestionSelect,
}: SearchBarProps) {
  const { t, locale, setLocale } = useLocale();

  const promptSuggestions = useMemo(() => [
    t("search.suggestion1"),
    t("search.suggestion2"),
    t("search.suggestion3"),
    t("search.suggestion4"),
    t("search.suggestion5"),
    t("search.suggestion6"),
    t("search.suggestion7"),
  ], [t]);

  const effectivePlaceholder = placeholder ?? t("search.placeholder");

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % promptSuggestions.length);
    }, PLACEHOLDER_ROTATE_MS);
    return () => clearInterval(interval);
  }, [promptSuggestions.length]);

  useEffect(() => {
    if (!showLangDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLangDropdown]);

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

  const handleLanguageSelect = useCallback(
    (selected: Locale) => {
      setLocale(selected);
      setShowLangDropdown(false);
    },
    [setLocale]
  );

  const hasInput = query.trim().length > 0;
  const showSuggestions = isFocused && suggestions.length > 0 && !isLoading;
  const showAnimatedPlaceholder = !isFocused && !hasInput;
  const currentFlag = LANGUAGE_OPTIONS.find((o) => o.locale === locale)?.flag ?? "\uD83C\uDDEC\uD83C\uDDE7";

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
            boxShadow: "var(--shadow-float-current)",
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

          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={isFocused ? effectivePlaceholder : ""}
              className={clsx(
                "w-full bg-transparent outline-none text-[15px]",
                "text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)]"
              )}
              style={{ fontFamily: "var(--font-ui)" }}
              suppressHydrationWarning
            />

            {showAnimatedPlaceholder && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex items-center pointer-events-none text-[15px]"
                  style={{
                    fontFamily: "var(--font-ui)",
                    color: "var(--foreground-tertiary)",
                  }}
                >
                  {promptSuggestions[placeholderIndex]}
                </motion.span>
              </AnimatePresence>
            )}
          </div>

          {/* Language flag switcher */}
          <div ref={langRef} className="relative flex-shrink-0">
            <motion.button
              type="button"
              onClick={() => setShowLangDropdown((prev) => !prev)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[14px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              whileTap={{ scale: 0.9 }}
              transition={springTransitions.quick}
            >
              {currentFlag}
            </motion.button>

            <AnimatePresence>
              {showLangDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={springTransitions.quick}
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 glass-floating min-w-[140px]"
                  style={{ boxShadow: "var(--shadow-float-current)" }}
                >
                  {LANGUAGE_OPTIONS.map((option, i) => (
                    <button
                      key={option.locale}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleLanguageSelect(option.locale)}
                      className={clsx(
                        "w-full text-left px-3 py-2.5 flex items-center gap-2.5",
                        "hover:bg-[var(--glass-bg)] transition-colors duration-150",
                        i < LANGUAGE_OPTIONS.length - 1 && "border-b border-[var(--glass-border)]"
                      )}
                    >
                      <span className="text-[16px]">{option.flag}</span>
                      <span
                        className="text-[13px]"
                        style={{
                          fontFamily: "var(--font-ui)",
                          color: option.locale === locale ? "var(--foreground)" : "var(--foreground-secondary)",
                          fontWeight: option.locale === locale ? 500 : 400,
                        }}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
              {t("search.searchingArea")}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

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
              boxShadow: "var(--shadow-float-current)",
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
                  className="text-[14px] text-[var(--foreground)] truncate"
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
