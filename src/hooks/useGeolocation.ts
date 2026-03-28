"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GeoLocation } from "@/types/api";
import { DEFAULT_CENTER } from "@/types/api";

interface GeolocationState {
  location: GeoLocation | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
  isPermissionDenied: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 15000,
};

/**
 * Tracks user geolocation via the browser Geolocation API.
 *
 * @param options - Geolocation API options (accuracy, age, timeout).
 * @param fallbackCenter - Fallback center when location unavailable.
 * @returns Location state with fallback and permission status.
 */
export function useGeolocation(
  options: UseGeolocationOptions = {},
  fallbackCenter: { latitude: number; longitude: number } = DEFAULT_CENTER,
) {
  const mergedOptions = { ...defaultOptions, ...options };

  const [state, setState] = useState<GeolocationState>(() => {
    const supported =
      typeof navigator !== "undefined" && "geolocation" in navigator;
    return {
      location: null,
      error: supported
        ? null
        : ({
            code: 2,
            message: "Geolocation not supported",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      isLoading: supported,
      isPermissionDenied: false,
    };
  });

  const updateLocation = useCallback((position: GeolocationPosition) => {
    setState({
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      },
      error: null,
      isLoading: false,
      isPermissionDenied: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
      isPermissionDenied: error.code === error.PERMISSION_DENIED,
    }));
  }, []);

  const [geolocationSupported] = useState(
    () => typeof navigator !== "undefined" && "geolocation" in navigator
  );

  useEffect(() => {
    if (!geolocationSupported) {
      return;
    }

    navigator.geolocation.getCurrentPosition(updateLocation, handleError, {
      enableHighAccuracy: mergedOptions.enableHighAccuracy,
      maximumAge: mergedOptions.maximumAge,
      timeout: mergedOptions.timeout,
    });

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        maximumAge: mergedOptions.maximumAge,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [
    updateLocation,
    handleError,
    geolocationSupported,
    mergedOptions.enableHighAccuracy,
    mergedOptions.maximumAge,
    mergedOptions.timeout,
  ]);

  const fallbackLocation = useMemo<GeoLocation>(
    () => ({
      latitude: fallbackCenter.latitude,
      longitude: fallbackCenter.longitude,
      accuracy: null,
      heading: null,
      speed: null,
      timestamp: 0,
    }),
    [fallbackCenter.latitude, fallbackCenter.longitude]
  );

  return {
    ...state,
    location: state.location ?? fallbackLocation,
    hasRealLocation: state.location !== null,
  };
}
