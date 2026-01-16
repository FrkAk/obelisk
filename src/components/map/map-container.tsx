"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Map, { type MapRef } from "react-map-gl/maplibre";
import { useMapStore } from "@/stores/map-store";
import { MapControls } from "./map-controls";
import { UserLocationMarker } from "./user-location-marker";
import { PoiMarkersLayer } from "./poi-markers-layer";
import { DiscoveryLayer } from "@/components/discovery/discovery-layer";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import "maplibre-gl/dist/maplibre-gl.css";

export function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const { viewState, setViewState, selectedPoi, setSelectedPoi } = useMapStore();
  const [isLoaded, setIsLoaded] = useState(false);

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

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onLoad={handleLoad}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
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
      {selectedPoi && (
        <BottomSheet
          isOpen={!!selectedPoi}
          onClose={() => setSelectedPoi(null)}
          initialSnap="half"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{selectedPoi.name}</h2>
            {selectedPoi.categories && selectedPoi.categories.length > 0 && (
              <p className="text-muted-foreground">
                {selectedPoi.categories.join(", ")}
              </p>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
