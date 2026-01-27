"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeoLocation } from "@/types";
import { MUNICH_CENTER } from "@/types";

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

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };

  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: true,
    isPermissionDenied: false,
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

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          code: 2,
          message: "Geolocation not supported",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }));
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
    mergedOptions.enableHighAccuracy,
    mergedOptions.maximumAge,
    mergedOptions.timeout,
  ]);

  const fallbackLocation: GeoLocation = {
    latitude: MUNICH_CENTER.latitude,
    longitude: MUNICH_CENTER.longitude,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
  };

  return {
    ...state,
    location: state.location ?? fallbackLocation,
    hasRealLocation: state.location !== null,
  };
}
