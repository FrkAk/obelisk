"use client";

import { memo } from "react";
import { Marker, useMap } from "react-map-gl";

interface ClusterPinProps {
  latitude: number;
  longitude: number;
  pointCount: number;
  color: string;
  expansionZoom: number;
}

/**
 * Glassmorphic cluster pin that shows count and expands on click.
 *
 * Args:
 *     latitude: Cluster center latitude.
 *     longitude: Cluster center longitude.
 *     pointCount: Number of points in cluster.
 *     color: Dominant category color for accent.
 *     expansionZoom: Zoom level to expand cluster.
 */
export const ClusterPin = memo(function ClusterPin({
  latitude,
  longitude,
  pointCount,
  color,
  expansionZoom,
}: ClusterPinProps) {
  const { current: map } = useMap();

  const handleClick = () => {
    if (map) {
      map.easeTo({
        center: [longitude, latitude],
        zoom: expansionZoom,
        duration: 500,
      });
    }
  };

  const size = Math.min(52, 32 + Math.log2(pointCount) * 5);

  return (
    <Marker
      latitude={latitude}
      longitude={longitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent?.stopPropagation();
        handleClick();
      }}
    >
      <button
        className="glass rounded-full flex items-center justify-center relative transition-transform duration-150 hover:scale-110 active:scale-95"
        style={{
          width: size,
          height: size,
          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.12), 0 0 0 2px ${color}30`,
        }}
        aria-label={`Cluster of ${pointCount} stories, click to expand`}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
          }}
        />
        <span
          className="relative text-sm font-semibold"
          style={{ color }}
        >
          {pointCount}
        </span>
      </button>
    </Marker>
  );
});
