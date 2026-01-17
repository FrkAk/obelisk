"use client";

import { Marker } from "react-map-gl/maplibre";
import { clsx } from "clsx";
import type { Remark, Poi, CategorySlug } from "@/types";
import { CATEGORY_COLORS } from "@/types";

interface RemarkPinProps {
  remark: Remark & { poi: Poi };
  isSelected?: boolean;
  onClick?: () => void;
}

const CATEGORY_ICONS: Record<CategorySlug, string> = {
  history: "M12 2L2 7v15l10-5 10 5V7L12 2z",
  food: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  art: "M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-2 14.5V22h4v-4.5c0-1.1-.9-2-2-2s-2 .9-2 2zm8-3.5c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z",
  nature: "M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z",
  architecture: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  hidden: "M12 2L1 21h22L12 2zm0 3.83L19.13 19H4.87L12 5.83zM11 16h2v2h-2zm0-6h2v4h-2z",
  views: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  culture: "M11 2v4H9V2H7v4H5V2H3v6h8V2h-2zm0 11l-1 1 1 1 1-1-1-1zm0-3l-1 1 1 1 1-1-1-1z",
};

export function RemarkPin({ remark, isSelected = false, onClick }: RemarkPinProps) {
  const categorySlug = (remark.poi.category?.slug ?? "history") as CategorySlug;
  const color = CATEGORY_COLORS[categorySlug];
  const iconPath = CATEGORY_ICONS[categorySlug];

  return (
    <Marker
      latitude={remark.poi.latitude}
      longitude={remark.poi.longitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.();
      }}
    >
      <button
        className={clsx(
          "relative flex items-center justify-center transition-transform duration-200",
          isSelected ? "scale-125 z-10" : "hover:scale-110",
          "animate-pin-drop"
        )}
        aria-label={`View story: ${remark.title}`}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: color }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="white"
            className="drop-shadow"
          >
            <path d={iconPath} />
          </svg>
        </div>
        <div
          className="absolute -bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"
          style={{ borderTopColor: color }}
        />
        {isSelected && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: color }}
          />
        )}
      </button>
    </Marker>
  );
}
