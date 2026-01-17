"use client";

import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "./useGeolocation";
import type { Remark, Poi } from "@/types";

interface NearbyRemarksResponse {
  remarks: (Remark & { poi: Poi })[];
  total: number;
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

export function useNearbyRemarks(radius: number = 5000) {
  const { location, hasRealLocation, isLoading: isLocationLoading } = useGeolocation();

  const query = useQuery({
    queryKey: ["nearbyRemarks", location?.latitude, location?.longitude, radius],
    queryFn: () =>
      fetchNearbyRemarks(location!.latitude, location!.longitude, radius),
    enabled: !!location,
    staleTime: 30000,
    refetchInterval: hasRealLocation ? 30000 : false,
  });

  return {
    remarks: query.data?.remarks ?? [],
    total: query.data?.total ?? 0,
    isLoading: isLocationLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasRealLocation,
    location,
  };
}
