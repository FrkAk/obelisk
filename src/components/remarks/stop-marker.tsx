"use client";

import { Marker } from "react-map-gl/maplibre";
import { cn } from "@/lib/utils";

interface StopMarkerProps {
  longitude: number;
  latitude: number;
  sequenceNumber: number;
  isActive?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragEnd?: (e: { lngLat: { lng: number; lat: number } }) => void;
}

export function StopMarker({
  longitude,
  latitude,
  sequenceNumber,
  isActive,
  onClick,
  draggable,
  onDragEnd,
}: StopMarkerProps) {
  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      draggable={draggable}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm shadow-lg transition-transform cursor-pointer",
          isActive
            ? "bg-primary text-primary-foreground scale-110"
            : "bg-background text-foreground border-2 border-primary hover:scale-105"
        )}
      >
        {sequenceNumber}
      </div>
    </Marker>
  );
}
