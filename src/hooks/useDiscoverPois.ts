"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DiscoverResult {
  discovered: number;
  existing: number;
  total: number;
}

interface GenerateResult {
  generated: number;
  message?: string;
}

interface DiscoverOptions {
  lat: number;
  lon: number;
  radius?: number;
  limit?: number;
}

/**
 * Hook for discovering new POIs and generating stories.
 *
 * Returns:
 *     Object with discover function and status.
 */
export function useDiscoverPois() {
  const [status, setStatus] = useState<"idle" | "discovering" | "generating" | "complete" | "error">("idle");
  const [progress, setProgress] = useState<string>("");
  const queryClient = useQueryClient();

  const discoverMutation = useMutation({
    mutationFn: async ({ lat, lon, radius = 2000 }: DiscoverOptions): Promise<DiscoverResult> => {
      const response = await fetch("/api/pois/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, radius }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to discover POIs");
      }

      return response.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ lat, lon, radius = 2000, limit = 5 }: DiscoverOptions): Promise<GenerateResult> => {
      const response = await fetch("/api/remarks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, radius, limit }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate stories");
      }

      return response.json();
    },
  });

  const discover = useCallback(
    async (options: DiscoverOptions) => {
      setStatus("discovering");
      setProgress("Searching for interesting places...");

      try {
        const discoverResult = await discoverMutation.mutateAsync(options);
        setProgress(`Found ${discoverResult.discovered} new places`);

        if (discoverResult.discovered > 0 || discoverResult.total > 0) {
          setStatus("generating");
          setProgress("Creating stories...");

          const generateResult = await generateMutation.mutateAsync(options);
          setProgress(`Generated ${generateResult.generated} new stories`);
        }

        setStatus("complete");
        await queryClient.invalidateQueries({ queryKey: ["nearbyRemarks"] });

        setTimeout(() => {
          setStatus("idle");
          setProgress("");
        }, 3000);

        return {
          discovered: discoverResult.discovered,
          generated: generateMutation.data?.generated ?? 0,
        };
      } catch (error) {
        setStatus("error");
        setProgress(error instanceof Error ? error.message : "Something went wrong");

        setTimeout(() => {
          setStatus("idle");
          setProgress("");
        }, 5000);

        throw error;
      }
    },
    [discoverMutation, generateMutation, queryClient]
  );

  return {
    discover,
    status,
    progress,
    isDiscovering: status === "discovering" || status === "generating",
  };
}
