"use client";

import { memo } from "react";
import { Marker } from "react-map-gl/mapbox";

interface POIPinProps {
  latitude: number;
  longitude: number;
  color?: string;
  isSelected?: boolean;
}

/**
 * Simple solid circle pin for search result locations on the map.
 *
 * @param latitude - Pin latitude.
 * @param longitude - Pin longitude.
 * @param color - Pin fill color, defaults to muted gray.
 * @param isSelected - Whether the pin is currently selected.
 */
export const POIPin = memo(function POIPin({
  latitude,
  longitude,
  color = "#8B8B8B",
  isSelected = false,
}: POIPinProps) {
  const size = isSelected ? 14 : 10;

  return (
    <Marker latitude={latitude} longitude={longitude} anchor="center">
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: isSelected
            ? `0 2px 8px ${color}60, 0 1px 3px rgba(0, 0, 0, 0.2)`
            : `0 1px 4px rgba(0, 0, 0, 0.15)`,
          transition: "width 150ms, height 150ms, box-shadow 150ms",
        }}
      />
    </Marker>
  );
});
