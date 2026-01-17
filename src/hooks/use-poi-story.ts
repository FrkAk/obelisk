"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

type StoryType = "discovery" | "historical" | "cultural" | "foodie" | "hidden";

interface UsePoiStoryOptions {
  poiId: string;
  storyType?: StoryType;
}

/**
 * Hook for managing POI story reveal state and fetching.
 *
 * Args:
 *     poiId: The POI ID to fetch story for.
 *     storyType: Type of story to fetch (default: "discovery").
 *
 * Returns:
 *     Object containing story data, loading state, and reveal controls.
 */
export function usePoiStory({ poiId, storyType = "discovery" }: UsePoiStoryOptions) {
  const [isRevealed, setIsRevealed] = useState(false);

  const storyQuery = trpc.poi.getStory.useQuery(
    { poiId, storyType },
    { enabled: isRevealed }
  );

  const revealStory = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const resetStory = useCallback(() => {
    setIsRevealed(false);
  }, []);

  return {
    story: storyQuery.data,
    isLoading: storyQuery.isLoading,
    isError: storyQuery.isError,
    error: storyQuery.error,
    isRevealed,
    revealStory,
    resetStory,
  };
}
