"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useGeolocation } from "./use-geolocation";
import { useProximityStore } from "@/stores/proximity-store";
import { trpc } from "@/lib/trpc/client";

interface UseProximityDetectionOptions {
  radiusMeters?: number;
  enabled?: boolean;
}

interface NearbyPoi {
  id: string;
  name: string;
  longitude: string;
  latitude: string;
  categories: string[] | null;
  distanceMeters: number;
  story: { id: string; title: string; teaser: string } | null;
}

/**
 * Hook for detecting nearby POIs and triggering discovery notifications.
 *
 * Args:
 *     options: Configuration options for proximity detection.
 *
 * Returns:
 *     Object containing current notification and control functions.
 */
export function useProximityDetection(
  options: UseProximityDetectionOptions = {}
) {
  const { radiusMeters = 200, enabled = true } = options;

  const {
    discoveryEnabled,
    currentNotification,
    setCurrentNotification,
    markPoiShown,
    isPoiOnCooldown,
    canQuery,
    recordQuery,
    shownPoiIds,
  } = useProximityStore();

  const {
    latitude,
    longitude,
    error: geoError,
    permissionState,
    requestPosition,
  } = useGeolocation({
    watch: enabled && discoveryEnabled,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 15000,
  });

  const utils = trpc.useUtils();
  const queryInFlight = useRef(false);
  const generatingStoryForId = useRef<string | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const generateStoryForPoi = useCallback(
    async (poi: NearbyPoi) => {
      if (generatingStoryForId.current === poi.id) {
        return null;
      }

      generatingStoryForId.current = poi.id;
      setIsGeneratingStory(true);

      try {
        const storyData = await utils.poi.getStory.fetch({
          poiId: poi.id,
          storyType: "discovery",
        });

        return {
          id: storyData.id,
          title: storyData.title,
          teaser: storyData.teaser,
        };
      } catch (error) {
        console.error("Error generating story for POI:", error);
        return null;
      } finally {
        generatingStoryForId.current = null;
        setIsGeneratingStory(false);
      }
    },
    [utils.poi.getStory]
  );

  const checkNearbyPois = useCallback(async () => {
    if (!latitude || !longitude || queryInFlight.current) {
      return;
    }

    if (!canQuery()) {
      return;
    }

    queryInFlight.current = true;
    recordQuery();

    try {
      const excludeIds = Array.from(shownPoiIds).filter((id) =>
        isPoiOnCooldown(id)
      );

      const nearbyPois = await utils.poi.nearby.fetch({
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        radiusMeters,
        limit: 5,
        excludeIds,
      });

      const eligiblePoiWithStory = nearbyPois.find(
        (poi) => !isPoiOnCooldown(poi.id) && poi.story
      );

      if (eligiblePoiWithStory && eligiblePoiWithStory.story) {
        setCurrentNotification({
          id: eligiblePoiWithStory.id,
          name: eligiblePoiWithStory.name,
          longitude: eligiblePoiWithStory.longitude,
          latitude: eligiblePoiWithStory.latitude,
          categories: eligiblePoiWithStory.categories,
          distanceMeters: eligiblePoiWithStory.distanceMeters,
          story: eligiblePoiWithStory.story,
        });
        return;
      }

      const eligiblePoiWithoutStory = nearbyPois.find(
        (poi) =>
          !isPoiOnCooldown(poi.id) &&
          !poi.story &&
          generatingStoryForId.current !== poi.id
      );

      if (eligiblePoiWithoutStory) {
        const generatedStory = await generateStoryForPoi(eligiblePoiWithoutStory);

        if (generatedStory) {
          setCurrentNotification({
            id: eligiblePoiWithoutStory.id,
            name: eligiblePoiWithoutStory.name,
            longitude: eligiblePoiWithoutStory.longitude,
            latitude: eligiblePoiWithoutStory.latitude,
            categories: eligiblePoiWithoutStory.categories,
            distanceMeters: eligiblePoiWithoutStory.distanceMeters,
            story: generatedStory,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching nearby POIs:", error);
    } finally {
      queryInFlight.current = false;
    }
  }, [
    latitude,
    longitude,
    radiusMeters,
    canQuery,
    recordQuery,
    isPoiOnCooldown,
    shownPoiIds,
    setCurrentNotification,
    utils.poi.nearby,
    generateStoryForPoi,
  ]);

  useEffect(() => {
    if (!enabled || !discoveryEnabled || !latitude || !longitude) {
      return;
    }

    checkNearbyPois();
  }, [enabled, discoveryEnabled, latitude, longitude, checkNearbyPois]);

  const dismissNotification = useCallback(() => {
    if (currentNotification) {
      markPoiShown(currentNotification.id);
      setCurrentNotification(null);
    }
  }, [currentNotification, markPoiShown, setCurrentNotification]);

  const expandNotification = useCallback(() => {
    if (currentNotification) {
      markPoiShown(currentNotification.id);
    }
  }, [currentNotification, markPoiShown]);

  return {
    currentNotification,
    dismissNotification,
    expandNotification,
    isActive: enabled && discoveryEnabled && !geoError,
    hasLocationPermission: !geoError,
    permissionState,
    requestPosition,
    isGeneratingStory,
  };
}
