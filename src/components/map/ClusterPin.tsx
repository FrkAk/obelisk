"use client";

import { memo } from "react";
import { Marker, useMap } from "react-map-gl/mapbox";

interface ClusterPinProps {
  latitude: number;
  longitude: number;
  pointCount: number;
  color: string;
  expansionZoom: number;
}

/**
 * Subtle glassmorphic cluster indicator that expands on click.
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

  const size = Math.min(44, 28 + Math.log2(pointCount) * 4);

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
        className="glass-floating rounded-full flex items-center justify-center relative transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{
          width: size,
          height: size,
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1.5px ${color}40`,
        }}
        aria-label={`Cluster of ${pointCount} stories, click to expand`}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, ${color}15 0%, transparent 60%)`,
          }}
        />
        <span
          className="relative text-[13px] font-semibold"
          style={{ color }}
        >
          {pointCount}
        </span>
      </button>
    </Marker>
  );
});
