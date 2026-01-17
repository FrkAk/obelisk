"use client";

import { Marker } from "react-map-gl/maplibre";
import type { GeoLocation } from "@/types";

interface UserLocationMarkerProps {
  location: GeoLocation;
}

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <Marker
      latitude={location.latitude}
      longitude={location.longitude}
      anchor="center"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-sky-blue/30 animate-pulse-location" />
        <div className="relative w-4 h-4 rounded-full bg-sky-blue border-2 border-white shadow-lg" />
        {location.heading !== null && (
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-sky-blue"
            style={{ transform: `translateX(-50%) rotate(${location.heading}deg)` }}
          />
        )}
      </div>
    </Marker>
  );
}
