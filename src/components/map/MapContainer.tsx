"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Supercluster from "supercluster";
import { MapView, type MapBounds } from "./MapView";
import { POIPin } from "./POIPin";
import { ClusterPin } from "./ClusterPin";
import { UserLocationMarker } from "./UserLocationMarker";
import { SearchPin } from "./SearchPin";
import type { Remark, GeoLocation, CategorySlug, PoiWithCategory, ViewportBounds } from "@/types/api";
import { CATEGORY_COLORS } from "@/types/api";

interface MapContainerProps {
  remarks: (Remark & { poi: PoiWithCategory })[];
  onPinClick: (remark: Remark & { poi: PoiWithCategory }) => void;
  onViewportChange?: (center: { latitude: number; longitude: number }) => void;
  onViewportUpdate?: (update: { center: { latitude: number; longitude: number }; bounds: ViewportBounds; zoom: number }) => void;
  onPoiClick?: (poi: { name: string; latitude: number; longitude: number; category?: string }) => void;
  selectedRemarkId?: string;
  isLoading: boolean;
  userLocation?: GeoLocation | null;
  flyToLocation?: { latitude: number; longitude: number; ts: number } | null;
  searchPinLocation?: { latitude: number; longitude: number } | null;
}

type RemarkProperties = { remark: Remark & { poi: PoiWithCategory } };
type ClusterFeature = Supercluster.ClusterFeature<RemarkProperties>;
type PointFeature = Supercluster.PointFeature<RemarkProperties>;

const CLUSTER_RADIUS = 50;
const MAX_ZOOM = 16;

export function MapContainer({
  remarks,
  onPinClick,
  onViewportChange,
  onViewportUpdate,
  onPoiClick,
  selectedRemarkId,
  isLoading,
  userLocation,
  flyToLocation,
  searchPinLocation,
}: MapContainerProps) {
  const [viewState, setViewState] = useState<{ zoom: number; bounds: MapBounds | null }>({
    zoom: 14,
    bounds: null,
  });

  const superclusterRef = useRef<Supercluster<RemarkProperties> | null>(null);
  const lastCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const points: GeoJSON.Feature<GeoJSON.Point, RemarkProperties>[] = useMemo(
    () =>
      remarks.map((remark) => ({
        type: "Feature",
        properties: { remark },
        geometry: {
          type: "Point",
          coordinates: [remark.poi.longitude, remark.poi.latitude],
        },
      })),
    [remarks]
  );

  const supercluster = useMemo(() => {
    const sc = new Supercluster<RemarkProperties>({
      radius: CLUSTER_RADIUS,
      maxZoom: MAX_ZOOM,
      minZoom: 0,
    });
    sc.load(points);
    return sc;
  }, [points]);

  useEffect(() => {
    superclusterRef.current = supercluster;
  }, [supercluster]);

  const clusters = useMemo(() => {
    if (!viewState.bounds) return [];
    return supercluster.getClusters(viewState.bounds, Math.floor(viewState.zoom));
  }, [supercluster, viewState.bounds, viewState.zoom]);

  const getDominantCategory = useCallback(
    (clusterId: number): { category: CategorySlug; color: string } => {
      const leaves = supercluster.getLeaves(clusterId, Infinity);
      const categoryCount: Record<string, number> = {};

      leaves.forEach((leaf) => {
        const cat = (leaf.properties.remark.poi.category?.slug ?? "history") as CategorySlug;
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      let maxCount = 0;
      let dominant: CategorySlug = "history";
      Object.entries(categoryCount).forEach(([cat, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominant = cat as CategorySlug;
        }
      });

      return { category: dominant, color: CATEGORY_COLORS[dominant] };
    },
    [supercluster]
  );

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

  const getClusterExpansionZoom = useCallback(
    (clusterId: number): number => {
      return Math.min(supercluster.getClusterExpansionZoom(clusterId), MAX_ZOOM + 1);
    },
    [supercluster]
  );

  const remarkClickHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    remarks.forEach((remark) => {
      handlers.set(remark.id, () => onPinClick(remark));
    });
    return handlers;
  }, [remarks, onPinClick]);

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
        flyToLocation={flyToLocation}
      >
        {userLocation && <UserLocationMarker location={userLocation} />}
        {searchPinLocation && (
          <SearchPin
            latitude={searchPinLocation.latitude}
            longitude={searchPinLocation.longitude}
          />
        )}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const props = cluster.properties as { cluster?: boolean; cluster_id?: number; point_count?: number; remark?: Remark & { poi: PoiWithCategory } };

          if (props.cluster && props.cluster_id !== undefined) {
            const clusterData = cluster as ClusterFeature;
            const pointCount = clusterData.properties.point_count;
            const clusterId = clusterData.properties.cluster_id;
            const { color } = getDominantCategory(clusterId);
            const expansionZoom = getClusterExpansionZoom(clusterId);

            return (
              <ClusterPin
                key={`cluster-${clusterId}`}
                latitude={latitude}
                longitude={longitude}
                pointCount={pointCount}
                color={color}
                expansionZoom={expansionZoom}
              />
            );
          }

          const pointData = cluster as PointFeature;
          const remark = pointData.properties.remark;

          return (
            <POIPin
              key={remark.id}
              remark={remark}
              isSelected={remark.id === selectedRemarkId}
              onClick={remarkClickHandlers.get(remark.id)}
            />
          );
        })}
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
