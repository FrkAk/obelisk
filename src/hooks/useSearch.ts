"use client";

import { useState, useCallback } from "react";
import type {
  SearchResult,
  SearchResponse,
  ParsedIntent,
} from "@/lib/search/types";
import type { CategorySlug } from "@/types";

interface UseSearchOptions {
  radius?: number;
  limit?: number;
}

interface UseSearchReturn {
  results: SearchResult[];
  conversationalResponse: string | null;
  intent: ParsedIntent | null;
  isLoading: boolean;
  error: string | null;
  timing: SearchResponse["timing"] | null;
  search: (
    query: string,
    location: { latitude: number; longitude: number },
    category?: CategorySlug
  ) => Promise<void>;
  clear: () => void;
}

/**
 * Hook for performing intelligent searches across Obelisk and external POIs.
 *
 * Args:
 *     options: Search options including radius and result limit.
 *
 * Returns:
 *     Search state and functions for performing searches.
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { radius = 1000, limit = 20 } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [conversationalResponse, setConversationalResponse] = useState<string | null>(null);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<SearchResponse["timing"] | null>(null);

  const search = useCallback(
    async (
      query: string,
      location: { latitude: number; longitude: number },
      category?: CategorySlug
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const searchQuery = category && !query ? category : query;

        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            location,
            radius,
            limit,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Search failed: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();

        setResults(data.results);
        setConversationalResponse(data.conversationalResponse);
        setIntent(data.intent);
        setTiming(data.timing);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        setError(message);
        setResults([]);
        setConversationalResponse(null);
        setIntent(null);
      } finally {
        setIsLoading(false);
      }
    },
    [radius, limit]
  );

  const clear = useCallback(() => {
    setResults([]);
    setConversationalResponse(null);
    setIntent(null);
    setError(null);
    setTiming(null);
  }, []);

  return {
    results,
    conversationalResponse,
    intent,
    isLoading,
    error,
    timing,
    search,
    clear,
  };
}
