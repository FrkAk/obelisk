"use client";

import { MapContainer } from "@/components/map/MapContainer";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryNotification } from "@/components/story/StoryNotification";
import { DiscoverButton } from "@/components/map/DiscoverButton";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { useGeofence } from "@/hooks/useGeofence";
import { useNearbyRemarks } from "@/hooks/useNearbyRemarks";
import { useDiscoverPois } from "@/hooks/useDiscoverPois";
import { useSearch } from "@/hooks/useSearch";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Remark, Poi, CategorySlug } from "@/types";
import type { ObeliskResult, SearchResult } from "@/lib/search/types";

type SheetMode = "story" | "search" | null;

interface ViewportCenter {
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [selectedRemark, setSelectedRemark] = useState<(Remark & { poi: Poi }) | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [viewportCenter, setViewportCenter] = useState<ViewportCenter | null>(null);

  const viewportDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { remarks, isLoading, location, hasRealLocation } = useNearbyRemarks({
    externalLocation: viewportCenter,
  });
  const { triggeredRemark, dismissNotification } = useGeofence(remarks);
  const { discover, status, progress, isDiscovering } = useDiscoverPois();
  const {
    results: searchResults,
    conversationalResponse,
    isLoading: isSearching,
    searchStage,
    search,
    clear: clearSearch,
  } = useSearch({ radius: 2000 });

  useEffect(() => {
    return () => {
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
    };
  }, []);

  const handlePinClick = useCallback((remark: Remark & { poi: Poi }) => {
    setSelectedRemark(remark);
    setSheetMode("story");
    setSheetOpen(true);
  }, []);

  const handleNotificationTap = useCallback(() => {
    if (triggeredRemark) {
      setSelectedRemark(triggeredRemark);
      setSheetMode("story");
      setSheetOpen(true);
      dismissNotification();
    }
  }, [triggeredRemark, dismissNotification]);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setSheetMode(null);
    setSelectedRemark(null);
  }, []);

  const handleViewportChange = useCallback(
    (center: { latitude: number; longitude: number }) => {
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
      viewportDebounceRef.current = setTimeout(() => {
        setViewportCenter(center);
      }, 300);
    },
    []
  );

  const handlePoiClick = useCallback(
    (poi: { name: string; latitude: number; longitude: number; category?: string }) => {
      const searchLocation = viewportCenter ?? (location ? { latitude: location.latitude, longitude: location.longitude } : null);
      if (!searchLocation) return;

      search(poi.name, searchLocation);
      setSheetMode("search");
      setSheetOpen(true);
    },
    [viewportCenter, location, search]
  );

  const handleDiscover = useCallback(() => {
    const discoverLocation = viewportCenter ?? (hasRealLocation && location ? { latitude: location.latitude, longitude: location.longitude } : null);
    if (discoverLocation) {
      discover({
        lat: discoverLocation.latitude,
        lon: discoverLocation.longitude,
        radius: 2000,
        limit: 5,
      });
    }
  }, [discover, viewportCenter, location, hasRealLocation]);

  const handleSearch = useCallback(
    (query: string, category?: CategorySlug) => {
      const searchLocation = viewportCenter ?? (location ? { latitude: location.latitude, longitude: location.longitude } : null);
      if (!searchLocation) return;
      search(query, searchLocation, category);
      setSheetMode("search");
      setSheetOpen(true);
    },
    [viewportCenter, location, search]
  );

  const handleSearchClear = useCallback(() => {
    clearSearch();
    if (sheetMode === "search") {
      setSheetOpen(false);
      setSheetMode(null);
    }
  }, [clearSearch, sheetMode]);

  const handleSelectStory = useCallback((result: ObeliskResult) => {
    setSelectedRemark(result.remark);
    setSheetMode("story");
  }, []);

  const handleNavigate = useCallback((result: SearchResult) => {
    const lat = result.type === "remark" ? result.remark.poi.latitude : result.poi.latitude;
    const lng = result.type === "remark" ? result.remark.poi.longitude : result.poi.longitude;
    const name = result.type === "remark" ? result.remark.poi.name : result.poi.name;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`,
      "_blank"
    );
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapContainer
        remarks={remarks}
        onPinClick={handlePinClick}
        onViewportChange={handleViewportChange}
        onPoiClick={handlePoiClick}
        selectedRemarkId={selectedRemark?.id}
        isLoading={isLoading}
        userLocation={hasRealLocation ? location : null}
      />

      <div className="absolute top-safe-area left-4 right-4 z-20 pt-4">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleSearchClear}
          isLoading={isSearching}
          searchStage={searchStage}
          placeholder={hasRealLocation || viewportCenter ? "Ask Obelisk anything..." : "Getting location..."}
        />
      </div>

      <DiscoverButton
        onDiscover={handleDiscover}
        status={status}
        progress={progress}
        disabled={(!hasRealLocation && !viewportCenter) || isDiscovering}
      />

      {triggeredRemark && !sheetOpen && (
        <StoryNotification
          remark={triggeredRemark}
          onTap={handleNotificationTap}
          onDismiss={dismissNotification}
        />
      )}

      <BottomSheet isOpen={sheetOpen} onClose={handleSheetClose}>
        {sheetMode === "story" && selectedRemark && (
          <StoryCard
            remark={selectedRemark}
            onNavigate={() =>
              handleNavigate({
                type: "remark",
                remark: selectedRemark,
                distance: 0,
                score: 0,
              })
            }
          />
        )}
        {sheetMode === "search" && (
          <SearchResults
            results={searchResults}
            conversationalResponse={conversationalResponse ?? undefined}
            isLoading={isSearching}
            onNavigate={handleNavigate}
            onSelectStory={handleSelectStory}
          />
        )}
      </BottomSheet>
    </main>
  );
}
