"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { CITY_CENTERS } from "@/types/api";
import type { Locale, TranslationKey } from "@/lib/i18n/translations";
import { getTranslation } from "@/lib/i18n/translations";

const STORAGE_KEY = "obelisk-language";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  cityCenter: { latitude: number; longitude: number };
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Detects the initial locale from browser language settings.
 *
 * @returns "tr" if the browser language starts with "tr", otherwise "en".
 */
function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "tr" || stored === "en") return stored;
  return navigator.language.startsWith("tr") ? "tr" : "en";
}

interface LocaleProviderProps {
  children: ReactNode;
}

/**
 * Provides locale context to the component tree.
 *
 * Initializes to "en" for SSR hydration safety, then syncs from
 * localStorage / navigator.language on mount.
 *
 * @param children - Child components that can consume locale context.
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale()); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: SSR renders "en", then client syncs real locale
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const cityCenter = useMemo(() => CITY_CENTERS[locale] ?? CITY_CENTERS.en, [locale]);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(key, locale),
    [locale]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, cityCenter, t }),
    [locale, setLocale, cityCenter, t]
  );

  return React.createElement(LocaleContext.Provider, { value }, children);
}

/**
 * Consumes the locale context.
 *
 * @returns Object with locale, setLocale, cityCenter, and t function.
 * @throws If used outside of LocaleProvider.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
