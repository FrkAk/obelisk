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
import { useState, useCallback } from "react";
import type { Remark, Poi, CategorySlug } from "@/types";
import type { ObeliskResult, SearchResult } from "@/lib/search/types";

type SheetMode = "story" | "search" | null;

export default function Home() {
  const [selectedRemark, setSelectedRemark] = useState<(Remark & { poi: Poi }) | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  const { remarks, isLoading, location, hasRealLocation } = useNearbyRemarks();
  const { triggeredRemark, dismissNotification } = useGeofence(remarks);
  const { discover, status, progress, isDiscovering } = useDiscoverPois();
  const {
    results: searchResults,
    conversationalResponse,
    isLoading: isSearching,
    search,
    clear: clearSearch,
  } = useSearch({ radius: 2000 });

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

  const handleDiscover = useCallback(() => {
    if (location && hasRealLocation) {
      discover({
        lat: location.latitude,
        lon: location.longitude,
        radius: 2000,
        limit: 5,
      });
    }
  }, [discover, location, hasRealLocation]);

  const handleSearch = useCallback(
    (query: string, category?: CategorySlug) => {
      if (!location) return;
      search(query, { latitude: location.latitude, longitude: location.longitude }, category);
      setSheetMode("search");
      setSheetOpen(true);
    },
    [location, search]
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
        selectedRemarkId={selectedRemark?.id}
        isLoading={isLoading}
        userLocation={hasRealLocation ? location : null}
      />

      <div className="absolute top-safe-area left-4 right-4 z-20 pt-4">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleSearchClear}
          isLoading={isSearching}
          placeholder={hasRealLocation ? "Ask Obelisk anything..." : "Getting location..."}
        />
      </div>

      <DiscoverButton
        onDiscover={handleDiscover}
        status={status}
        progress={progress}
        disabled={!hasRealLocation || isDiscovering}
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
