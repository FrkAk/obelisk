"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { Marker } from "react-map-gl/maplibre";
import {
  UtensilsCrossed,
  Landmark,
  Building2,
  Trees,
  MapPin,
  Church,
  ShoppingBag,
  Coffee,
  Beer,
  Music,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  food: UtensilsCrossed,
  cafe: Coffee,
  bar: Beer,
  pub: Beer,
  landmark: Landmark,
  monument: Landmark,
  memorial: Landmark,
  museum: Building2,
  gallery: Building2,
  park: Trees,
  garden: Trees,
  nature: Trees,
  church: Church,
  cathedral: Church,
  temple: Church,
  shop: ShoppingBag,
  store: ShoppingBag,
  music: Music,
  theater: Music,
  theatre: Music,
  university: GraduationCap,
  school: GraduationCap,
  plaza: MapPin,
  square: MapPin,
};

const MIN_ZOOM_FOR_MARKERS = 13;
const POI_FETCH_RADIUS = 1000;

interface PoiMarker {
  id: string;
  name: string;
  longitude: string;
  latitude: string;
  categories: string[] | null;
}

/**
 * Gets the appropriate icon for a POI based on its categories.
 *
 * Args:
 *     categories: Array of category strings or null.
 *
 * Returns:
 *     The matching Lucide icon component.
 */
function getCategoryIcon(categories: string[] | null): LucideIcon {
  if (!categories || categories.length === 0) {
    return MapPin;
  }

  for (const category of categories) {
    const lowerCategory = category.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (lowerCategory.includes(key)) {
        return icon;
      }
    }
  }

  return MapPin;
}

/**
 * Layer component that displays POI markers on the map.
 *
 * Returns:
 *     React component rendering POI markers.
 */
export function PoiMarkersLayer() {
  const { viewState, selectedPoi } = useMapStore();

  const shouldFetch = viewState.zoom >= MIN_ZOOM_FOR_MARKERS;

  const { data: pois } = trpc.poi.nearby.useQuery(
    {
      longitude: viewState.longitude.toString(),
      latitude: viewState.latitude.toString(),
      radiusMeters: POI_FETCH_RADIUS,
      limit: 30,
    },
    {
      enabled: shouldFetch,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    }
  );

  const visiblePois = useMemo(() => {
    if (!pois || !shouldFetch) return [];
    return pois as PoiMarker[];
  }, [pois, shouldFetch]);

  if (!shouldFetch || visiblePois.length === 0) {
    return null;
  }

  return (
    <>
      {visiblePois.map((poi, index) => (
        <PoiMarkerItem
          key={poi.id}
          poi={poi}
          index={index}
          isSelected={selectedPoi?.id === poi.id}
        />
      ))}
    </>
  );
}

interface PoiMarkerItemProps {
  poi: PoiMarker;
  index: number;
  isSelected: boolean;
}

function PoiMarkerItem({ poi, index, isSelected }: PoiMarkerItemProps) {
  const { setSelectedPoi } = useMapStore();
  const [isVisible, setIsVisible] = useState(false);

  const Icon = getCategoryIcon(poi.categories);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 30);
    return () => clearTimeout(timer);
  }, [index]);

  const handleClick = useCallback(() => {
    setSelectedPoi({
      id: poi.id,
      name: poi.name,
      longitude: parseFloat(poi.longitude),
      latitude: parseFloat(poi.latitude),
      categories: poi.categories,
    });
  }, [poi, setSelectedPoi]);

  return (
    <Marker
      latitude={parseFloat(poi.latitude)}
      longitude={parseFloat(poi.longitude)}
      anchor="center"
      onClick={handleClick}
    >
      <button
        className={cn(
          "flex items-center justify-center",
          "rounded-full",
          "border transition-all duration-300",
          isSelected
            ? "h-11 w-11 bg-[#007AFF] border-[#007AFF] shadow-blue"
            : "h-8 w-8 glass border-white/30 shadow-elevated hover:scale-110 hover:shadow-lg",
          "active:scale-95",
          isVisible ? "animate-marker-pop" : "opacity-0 scale-0"
        )}
        style={{
          animationDelay: `${index * 30}ms`,
          animationFillMode: "forwards",
        }}
        aria-label={poi.name}
      >
        <Icon
          className={cn(
            "transition-all duration-200",
            isSelected ? "h-5 w-5 text-white" : "h-3.5 w-3.5 text-primary"
          )}
        />
      </button>
    </Marker>
  );
}
