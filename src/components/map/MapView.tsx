"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { NavigationControl, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MUNICH_CENTER } from "@/types";

interface MapViewProps {
  children?: React.ReactNode;
  onMoveEnd?: (center: { latitude: number; longitude: number }) => void;
  initialCenter?: { latitude: number; longitude: number };
  initialZoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
}

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export function MapView({
  children,
  onMoveEnd,
  initialCenter = MUNICH_CENTER,
  initialZoom = 14,
  userLocation,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFlownToUser = useRef(false);

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
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (mapRef.current && isDark) {
      mapRef.current.getMap().setStyle("https://tiles.openfreemap.org/styles/dark");
    }
  }, []);

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
      initialViewState={{
        latitude: initialCenter.latitude,
        longitude: initialCenter.longitude,
        zoom: initialZoom,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={OPENFREEMAP_STYLE}
      onMoveEnd={handleMoveEnd}
      attributionControl={false}
      maxZoom={18}
      minZoom={10}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <button
        onClick={handleLocateClick}
        className="absolute top-[96px] right-[10px] z-10 w-[29px] h-[29px] bg-white rounded flex items-center justify-center shadow-md border border-gray-200 hover:bg-gray-100 active:bg-gray-200"
        aria-label="Center on my location"
        title="Go to my location"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
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
