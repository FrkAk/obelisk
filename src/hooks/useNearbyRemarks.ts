"use client";

import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "./useGeolocation";
import type { Remark, Poi, Category } from "@/types/api";

interface NearbyRemarksResponse {
  remarks: (Remark & { poi: Poi & { category?: Category } })[];
  total: number;
}

interface UseNearbyRemarksOptions {
  radius?: number;
  externalLocation?: { latitude: number; longitude: number } | null;
}

async function fetchNearbyRemarks(
  latitude: number,
  longitude: number,
  radius: number = 1000
): Promise<NearbyRemarksResponse> {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    radius: radius.toString(),
  });

  const response = await fetch(`/api/remarks?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch nearby remarks");
  }

  return response.json();
}

/**
 * Hook for fetching nearby remarks based on location.
 *
 * Args:
 *     options: Configuration including radius and optional external location.
 *
 * Returns:
 *     Remarks, loading state, and location information.
 */
export function useNearbyRemarks(options: UseNearbyRemarksOptions = {}) {
  const { radius = 5000, externalLocation } = options;
  const { location: gpsLocation, hasRealLocation, isLoading: isLocationLoading } = useGeolocation();

  const effectiveLocation = externalLocation ?? gpsLocation;

  const query = useQuery({
    queryKey: ["nearbyRemarks", effectiveLocation?.latitude, effectiveLocation?.longitude, radius],
    queryFn: () =>
      fetchNearbyRemarks(effectiveLocation!.latitude, effectiveLocation!.longitude, radius),
    enabled: !!effectiveLocation,
    staleTime: 30000,
    refetchInterval: hasRealLocation && !externalLocation ? 30000 : false,
  });

  return {
    remarks: query.data?.remarks ?? [],
    total: query.data?.total ?? 0,
    isLoading: isLocationLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasRealLocation,
    location: gpsLocation,
  };
}
