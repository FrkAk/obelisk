"use client";

import { useState, useCallback, useRef } from "react";
import { MapView, type MapBounds } from "./MapView";
import { UserLocationMarker } from "./UserLocationMarker";
import { SearchPin } from "./SearchPin";
import type { GeoLocation, ViewportBounds } from "@/types/api";

interface MapContainerProps {
  onViewportChange?: (center: { latitude: number; longitude: number }) => void;
  onViewportUpdate?: (update: { center: { latitude: number; longitude: number }; bounds: ViewportBounds; zoom: number }) => void;
  onPoiClick?: (poi: { name: string; latitude: number; longitude: number; category?: string }) => void;
  onMapClick?: () => void;
  userLocation?: GeoLocation | null;
  flyToLocation?: { latitude: number; longitude: number; ts: number } | null;
  searchPinLocation?: { latitude: number; longitude: number } | null;
}

/**
 * Map container managing viewport state and rendering map overlays.
 *
 * @param onViewportChange - Callback fired with new center after map movement.
 * @param onViewportUpdate - Callback fired with full viewport state (center, bounds, zoom).
 * @param onPoiClick - Callback when a Mapbox POI feature is clicked.
 * @param userLocation - Current user geolocation.
 * @param flyToLocation - Target location to fly the camera to.
 * @param searchPinLocation - Location to display a search result pin.
 */
export function MapContainer({
  onViewportChange,
  onViewportUpdate,
  onPoiClick,
  onMapClick,
  userLocation,
  flyToLocation,
  searchPinLocation,
}: MapContainerProps) {
  const [, setViewState] = useState<{ zoom: number; bounds: MapBounds | null }>({
    zoom: 14,
    bounds: null,
  });

  const lastCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const handleMoveEnd = useCallback(
    (center: { latitude: number; longitude: number }) => {
      lastCenterRef.current = center;
      onViewportChange?.(center);
    },
    [onViewportChange]
  );

  const handleViewStateChange = useCallback(
    (state: { zoom: number; bounds: MapBounds }) => {
      setViewState(state);
      if (onViewportUpdate && lastCenterRef.current) {
        const [west, south, east, north] = state.bounds;
        onViewportUpdate({
          center: lastCenterRef.current,
          bounds: { west, south, east, north },
          zoom: state.zoom,
        });
      }
    },
    [onViewportUpdate]
  );

  const initialCenter = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
    : undefined;

  return (
    <div className="absolute inset-0">
      <MapView
        initialCenter={initialCenter}
        userLocation={userLocation}
        onMoveEnd={handleMoveEnd}
        onViewStateChange={handleViewStateChange}
        onPoiClick={onPoiClick}
        onMapClick={onMapClick}
        flyToLocation={flyToLocation}
      >
        {userLocation && <UserLocationMarker location={userLocation} />}
        {searchPinLocation && (
          <SearchPin
            latitude={searchPinLocation.latitude}
            longitude={searchPinLocation.longitude}
          />
        )}
      </MapView>
    </div>
  );
}
