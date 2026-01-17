"use client";

import { MapView } from "./MapView";
import { RemarkPin } from "./RemarkPin";
import { UserLocationMarker } from "./UserLocationMarker";
import type { Remark, Poi, GeoLocation } from "@/types";

interface MapContainerProps {
  remarks: (Remark & { poi: Poi })[];
  onPinClick: (remark: Remark & { poi: Poi }) => void;
  selectedRemarkId?: string;
  isLoading: boolean;
  userLocation?: GeoLocation | null;
}

export function MapContainer({
  remarks,
  onPinClick,
  selectedRemarkId,
  isLoading,
  userLocation,
}: MapContainerProps) {
  const initialCenter = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
    : undefined;

  return (
    <div className="absolute inset-0">
      <MapView initialCenter={initialCenter} userLocation={userLocation}>
        {userLocation && <UserLocationMarker location={userLocation} />}
        {remarks.map((remark) => (
          <RemarkPin
            key={remark.id}
            remark={remark}
            isSelected={remark.id === selectedRemarkId}
            onClick={() => onPinClick(remark)}
          />
        ))}
      </MapView>

      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="glass px-4 py-2 rounded-full text-sm">
            Loading stories...
          </div>
        </div>
      )}
    </div>
  );
}
