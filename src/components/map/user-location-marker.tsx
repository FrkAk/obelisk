"use client";

import { useEffect, useCallback } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";
import { useUserLocationStore } from "@/stores/user-location-store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { cn } from "@/lib/utils";

const APPLE_BLUE = "#007AFF";
const MIN_ACCURACY_RING_SIZE = 20;
const MAX_ACCURACY_RING_SIZE = 200;
const METERS_PER_PIXEL_AT_ZOOM_15 = 4.77;

interface UserLocationMarkerProps {
  enableWatch?: boolean;
}

/**
 * Apple Maps-style user location marker with blue dot, accuracy ring, and heading indicator.
 *
 * Args:
 *     enableWatch: Whether to actively watch user position.
 *
 * Returns:
 *     React component rendering the location marker on the map.
 */
export function UserLocationMarker({ enableWatch = true }: UserLocationMarkerProps) {
  const { current: map } = useMap();
  const {
    latitude,
    longitude,
    accuracy,
    heading,
    trackingMode,
    setPosition,
    setIsWatching,
  } = useUserLocationStore();

  const {
    latitude: geoLat,
    longitude: geoLon,
    accuracy: geoAccuracy,
    heading: geoHeading,
  } = useGeolocation({
    watch: enableWatch && trackingMode !== "off",
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000,
  });

  useEffect(() => {
    if (geoLat !== null && geoLon !== null) {
      setPosition(geoLat, geoLon, geoAccuracy ?? undefined, geoHeading);
      setIsWatching(true);
    }
  }, [geoLat, geoLon, geoAccuracy, geoHeading, setPosition, setIsWatching]);

  useEffect(() => {
    if (!map || trackingMode === "off" || latitude === null || longitude === null) {
      return;
    }

    if (trackingMode === "follow") {
      map.easeTo({
        center: [longitude, latitude],
        duration: 500,
      });
    } else if (trackingMode === "followWithHeading" && heading !== null) {
      map.easeTo({
        center: [longitude, latitude],
        bearing: heading,
        duration: 500,
      });
    }
  }, [map, latitude, longitude, heading, trackingMode]);

  const calculateAccuracyRingSize = useCallback(() => {
    if (!accuracy || !map) return MIN_ACCURACY_RING_SIZE;

    const zoom = map.getZoom();
    const metersPerPixel = METERS_PER_PIXEL_AT_ZOOM_15 * Math.pow(2, 15 - zoom);
    const ringSize = (accuracy / metersPerPixel) * 2;

    return Math.min(Math.max(ringSize, MIN_ACCURACY_RING_SIZE), MAX_ACCURACY_RING_SIZE);
  }, [accuracy, map]);

  if (latitude === null || longitude === null) {
    return null;
  }

  const ringSize = calculateAccuracyRingSize();
  const showHeading = heading !== null && trackingMode === "followWithHeading";

  return (
    <Marker
      latitude={latitude}
      longitude={longitude}
      anchor="center"
    >
      <div className="relative flex items-center justify-center">
        {/* Accuracy Ring */}
        <div
          className="location-ring absolute rounded-full"
          style={{
            width: ringSize,
            height: ringSize,
            backgroundColor: `rgba(0, 122, 255, 0.32)`,
            border: `2px solid rgba(0, 122, 255, 0.45)`,
          }}
        />

        {/* Heading Indicator Cone */}
        {showHeading && (
          <div
            className="absolute"
            style={{
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderBottom: `24px solid rgba(0, 122, 255, 0.25)`,
              transform: `rotate(${heading}deg) translateY(-18px)`,
              transformOrigin: "center bottom",
            }}
          />
        )}

        {/* Main Blue Dot with White Border */}
        <div
          className={cn(
            "location-dot relative z-10 rounded-full",
            trackingMode !== "off" && "shadow-lg"
          )}
          style={{
            width: 16,
            height: 16,
            backgroundColor: APPLE_BLUE,
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0, 122, 255, 0.4)",
          }}
        />
      </div>
    </Marker>
  );
}
