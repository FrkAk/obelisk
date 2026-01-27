"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Map, { type MapRef, type ViewStateChangeEvent, type MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MUNICH_CENTER } from "@/types";
import { MapControls } from "./MapControls";

interface PoiClickData {
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
}

export type MapBounds = [number, number, number, number];

interface MapViewProps {
  children?: React.ReactNode;
  onMoveEnd?: (center: { latitude: number; longitude: number }) => void;
  onViewStateChange?: (state: { zoom: number; bounds: MapBounds }) => void;
  onPoiClick?: (poi: PoiClickData) => void;
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
  onViewStateChange,
  onPoiClick,
  initialCenter = MUNICH_CENTER,
  initialZoom = 14,
  userLocation,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFlownToUser = useRef(false);
  const [isDark, setIsDark] = useState(false);
  const [cursorStyle, setCursorStyle] = useState<string>("grab");

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
      if (onViewStateChange) {
        const map = mapRef.current?.getMap();
        const mapBounds = map?.getBounds();
        if (mapBounds) {
          const bounds: MapBounds = [
            mapBounds.getWest(),
            mapBounds.getSouth(),
            mapBounds.getEast(),
            mapBounds.getNorth(),
          ];
          onViewStateChange({ zoom: event.viewState.zoom, bounds });
        }
      }
    },
    [onMoveEnd, onViewStateChange]
  );


  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (userLocation && map && !hasFlownToUser.current) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        duration: 1500,
      });
      hasFlownToUser.current = true;
    }
  }, [userLocation]);

  const handleLocateClick = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (userLocation && map) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [userLocation]);

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.zoomIn({ duration: 300 });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.zoomOut({ duration: 300 });
    }
  }, []);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!onPoiClick || !map) return;

      const features = map.queryRenderedFeatures(event.point);

      const poiFeature = features.find((f) => {
        const layerId = f.layer?.id || "";
        const sourceLayer = f.sourceLayer || "";
        return (
          layerId.includes("poi") ||
          layerId.includes("label") ||
          sourceLayer.includes("poi") ||
          (f.properties?.name && f.geometry.type === "Point")
        );
      });

      if (poiFeature) {
        const props = poiFeature.properties;
        const geometry = poiFeature.geometry;

        if (geometry.type === "Point" && props?.name) {
          onPoiClick({
            name: props.name || props.name_en || "Unknown",
            latitude: geometry.coordinates[1],
            longitude: geometry.coordinates[0],
            category: props.class || props.type || props.maki,
          });
        }
      }
    },
    [onPoiClick]
  );

  const handleMouseEnter = useCallback(() => {
    setCursorStyle("pointer");
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCursorStyle("grab");
  }, []);

  const handleLoad = useCallback(() => {
    if (onViewStateChange) {
      const map = mapRef.current?.getMap();
      const mapBounds = map?.getBounds();
      const zoom = map?.getZoom() ?? initialZoom;
      if (mapBounds) {
        const bounds: MapBounds = [
          mapBounds.getWest(),
          mapBounds.getSouth(),
          mapBounds.getEast(),
          mapBounds.getNorth(),
        ];
        onViewStateChange({ zoom, bounds });
      }
    }
  }, [onViewStateChange, initialZoom]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        id="mainMap"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          latitude: initialCenter.latitude,
          longitude: initialCenter.longitude,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={isDark ? MAPBOX_DARK : MAPBOX_LIGHT}
        onLoad={handleLoad}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cursor={cursorStyle}
        attributionControl={false}
        maxZoom={18}
        minZoom={10}
      >
        {children}
      </Map>
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocateClick}
        hasUserLocation={!!userLocation}
      />
    </div>
  );
}
