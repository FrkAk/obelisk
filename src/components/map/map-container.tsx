"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Map, { type MapRef } from "react-map-gl/maplibre";
import { Loader2 } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { MapControls } from "./map-controls";
import { UserLocationMarker } from "./user-location-marker";
import { PoiMarkersLayer } from "./poi-markers-layer";
import { DiscoveryLayer } from "@/components/discovery/discovery-layer";
import { PoiDetailSheet } from "./poi-detail-sheet";
import { MAP_STYLE_URL } from "@/lib/constants/map";
import "maplibre-gl/dist/maplibre-gl.css";

function MapLoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

export function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const { viewState, setViewState, selectedPoi, setSelectedPoi } = useMapStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const isHydrated = useHydrated();

  const handleMove = useCallback(
    (evt: { viewState: typeof viewState }) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const flyTo = useCallback(
    (longitude: number, latitude: number, zoom?: number) => {
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: zoom ?? viewState.zoom,
        duration: 1500,
      });
    },
    [viewState.zoom]
  );

  useEffect(() => {
    useMapStore.setState({ flyTo });
  }, [flyTo]);

  if (!isHydrated) {
    return (
      <div className="relative h-full w-full">
        <MapLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!isLoaded && <MapLoadingSkeleton />}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onLoad={handleLoad}
        mapStyle={MAP_STYLE_URL}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <UserLocationMarker />
        <PoiMarkersLayer />
      </Map>
      {isLoaded && (
        <>
          <MapControls />
          <DiscoveryLayer />
        </>
      )}
      <PoiDetailSheet
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
      />
    </div>
  );
}
