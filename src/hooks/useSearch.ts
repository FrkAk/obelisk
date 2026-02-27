"use client";

import { useState, useCallback, useRef } from "react";
import type {
  SearchResult,
  SearchResponse,
  ParsedIntent,
  ViewportContext,
  CategorySlug,
  SearchStage,
} from "@/types/api";

interface UseSearchOptions {
  radius?: number;
  limit?: number;
}

interface UseSearchReturn {
  results: SearchResult[];
  intent: ParsedIntent | null;
  isLoading: boolean;
  searchStage: SearchStage;
  error: string | null;
  timing: SearchResponse["timing"] | null;
  search: (
    query: string,
    location: { latitude: number; longitude: number },
    category?: CategorySlug,
    viewport?: ViewportContext
  ) => Promise<void>;
  clear: () => void;
}

/**
 * Hook for performing searches across Obelisk POIs and external sources.
 *
 * Args:
 *     options: Search options including radius and result limit.
 *
 * Returns:
 *     Search state and functions for performing and clearing searches.
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { radius = 1000, limit = 20 } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStage, setSearchStage] = useState<SearchStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<SearchResponse["timing"] | null>(null);

  const search = useCallback(
    async (
      query: string,
      location: { latitude: number; longitude: number },
      category?: CategorySlug,
      viewport?: ViewportContext
    ) => {
      setIsLoading(true);
      setError(null);
      setSearchStage("parsing");

      try {
        const searchQuery = category && !query ? category : query;

        setSearchStage("searching");

        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            location,
            radius,
            limit,
            viewport,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Search failed: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();

        setResults(data.results);
        setIntent(data.intent);
        setTiming(data.timing);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        setError(message);
        setResults([]);
        setIntent(null);
      } finally {
        setIsLoading(false);
        setSearchStage("idle");
      }
    },
    [radius, limit]
  );

  const clear = useCallback(() => {
    setResults([]);
    setIntent(null);
    setError(null);
    setTiming(null);
    setSearchStage("idle");
  }, []);

  return {
    results,
    intent,
    isLoading,
    searchStage,
    error,
    timing,
    search,
    clear,
  };
}

/**
 * Hook for autocomplete suggestions with debounced fetching.
 *
 * Returns:
 *     Autocomplete state and functions for fetching and clearing suggestions.
 */
export function useAutocomplete() {
  const [suggestions, setSuggestions] = useState<Array<{ name: string; category: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(
    (prefix: string, location?: { latitude: number; longitude: number }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (prefix.length < 2) {
        setSuggestions([]);
        return;
      }

      timerRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const params = new URLSearchParams({ q: prefix });
          if (location) {
            params.set("lat", location.latitude.toString());
            params.set("lon", location.longitude.toString());
          }
          const response = await fetch(`/api/search/autocomplete?${params}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 150);
    },
    []
  );

  const clear = useCallback(() => setSuggestions([]), []);

  return { suggestions, isLoading, fetchSuggestions, clear };
}
