"use client";

import { useState, useCallback, useRef } from "react";
import type {
  SearchResult,
  SearchResponse,
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
  isLoading: boolean;
  searchStage: SearchStage;
  error: string | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchStage, setSearchStage] = useState<SearchStage>("idle");
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        setError(message);
        setResults([]);
      } finally {
        setIsLoading(false);
        setSearchStage("idle");
      }
    },
    [radius, limit]
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchStage("idle");
  }, []);

  return {
    results,
    isLoading,
    searchStage,
    error,
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(
    (prefix: string, location?: { latitude: number; longitude: number }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (prefix.length < 2) {
        setSuggestions([]);
        return;
      }

      timerRef.current = setTimeout(async () => {
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
        }
      }, 150);
    },
    []
  );

  const clear = useCallback(() => setSuggestions([]), []);

  return { suggestions, fetchSuggestions, clear };
}
