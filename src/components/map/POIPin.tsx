"use client";

import { memo } from "react";
import { Marker } from "react-map-gl/mapbox";
import type { Remark, Poi, CategorySlug, Category } from "@/types/api";
import { CATEGORY_COLORS } from "@/types/api";

interface POIPinProps {
  remark: Remark & { poi: Poi & { category?: Category } };
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Unified minimal glassmorphic pin for all POIs on the map.
 *
 * Args:
 *     remark: The remark with associated POI data.
 *     isSelected: Whether this pin is currently selected.
 *     onClick: Callback when pin is tapped.
 */
export const POIPin = memo(function POIPin({
  remark,
  isSelected = false,
  onClick,
}: POIPinProps) {
  const categorySlug = (remark.poi.category?.slug ?? "history") as CategorySlug;
  const color = CATEGORY_COLORS[categorySlug];

  return (
    <Marker
      latitude={remark.poi.latitude}
      longitude={remark.poi.longitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent?.stopPropagation();
        onClick?.();
      }}
    >
      <button
        className="relative flex items-center justify-center transition-transform duration-200"
        style={{ transform: isSelected ? "scale(1.2)" : "scale(1)" }}
        aria-label={`View remark: ${remark.title}`}
      >
        {isSelected && (
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              width: 36,
              height: 36,
              background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
            }}
          />
        )}

        <div
          className="relative glass-floating rounded-full flex items-center justify-center transition-shadow duration-200"
          style={{
            width: isSelected ? 28 : 24,
            height: isSelected ? 28 : 24,
            boxShadow: isSelected
              ? `0 4px 12px ${color}50, 0 0 0 2px ${color}`
              : `0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1.5px ${color}80`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: isSelected ? 10 : 8,
              height: isSelected ? 10 : 8,
              backgroundColor: color,
              boxShadow: isSelected ? `0 0 8px ${color}60` : "none",
            }}
          />
        </div>
      </button>
    </Marker>
  );
});
