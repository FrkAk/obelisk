"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Map, { NavigationControl, type MapRef, type ViewStateChangeEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MUNICH_CENTER } from "@/types";

interface MapViewProps {
  children?: React.ReactNode;
  onMoveEnd?: (center: { latitude: number; longitude: number }) => void;
  initialCenter?: { latitude: number; longitude: number };
  initialZoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
}

const DEFAULT_LIGHT = "mapbox://styles/mapbox/streets-v12";
const DEFAULT_DARK = "mapbox://styles/mapbox/dark-v11";

const MAPBOX_LIGHT = process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT || DEFAULT_LIGHT;
const MAPBOX_DARK = process.env.NEXT_PUBLIC_MAPBOX_STYLE_DARK || DEFAULT_DARK;

/**
 * Map view component using Mapbox GL JS with automatic dark mode support.
 *
 * Args:
 *     children: Child components to render inside the map (markers, etc).
 *     onMoveEnd: Callback fired when map movement ends with new center coordinates.
 *     initialCenter: Initial map center coordinates.
 *     initialZoom: Initial zoom level.
 *     userLocation: Current user location for centering.
 */
export function MapView({
  children,
  onMoveEnd,
  initialCenter = MUNICH_CENTER,
  initialZoom = 14,
  userLocation,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFlownToUser = useRef(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      if (onMoveEnd) {
        onMoveEnd({
          latitude: event.viewState.latitude,
          longitude: event.viewState.longitude,
        });
      }
    },
    [onMoveEnd]
  );

  useEffect(() => {
    if (userLocation && mapRef.current && !hasFlownToUser.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        duration: 1500,
      });
      hasFlownToUser.current = true;
    }
  }, [userLocation]);

  const handleLocateClick = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [userLocation]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        latitude: initialCenter.latitude,
        longitude: initialCenter.longitude,
        zoom: initialZoom,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={isDark ? MAPBOX_DARK : MAPBOX_LIGHT}
      onMoveEnd={handleMoveEnd}
      attributionControl={false}
      maxZoom={18}
      minZoom={10}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <button
        onClick={handleLocateClick}
        className="absolute top-[96px] right-[10px] z-10 w-[29px] h-[29px] bg-white rounded flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        aria-label="Center on my location"
        title="Go to my location"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-700 dark:text-gray-200">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
      {children}
    </Map>
  );
}
