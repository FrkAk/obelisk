"use client";

import { MapContainer } from "@/components/map/MapContainer";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { StoryNotification } from "@/components/story/StoryNotification";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { POICard } from "@/components/poi/POICard";
import { useGeofence } from "@/hooks/useGeofence";
import { useNearbyRemarks } from "@/hooks/useNearbyRemarks";
import { useSearch } from "@/hooks/useSearch";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Remark, Poi } from "@/types";
import type { SearchResult, ExternalPOI, ViewportBounds } from "@/lib/search/types";
import { haversineDistance } from "@/lib/geo/distance";
import { springTransitions } from "@/lib/ui/animations";

type SheetMode = "story" | "search" | "poi" | null;

function remarkPoiToExternalPOI(poi: Poi): ExternalPOI {
  const tags = (poi.osmTags ?? {}) as Record<string, string>;
  return {
    id: poi.id,
    osmId: poi.osmId ?? 0,
    osmType: "node",
    name: poi.name,
    category: poi.category?.slug ?? "history",
    latitude: poi.latitude,
    longitude: poi.longitude,
    address: poi.address ?? undefined,
    openingHours: tags.opening_hours ?? undefined,
    phone: tags.phone ?? tags["contact:phone"] ?? undefined,
    website: tags.website ?? tags["contact:website"] ?? undefined,
    cuisine: tags.cuisine ?? undefined,
    hasWifi: tags.internet_access === "wlan" || tags.internet_access === "yes",
    hasOutdoorSeating: tags.outdoor_seating === "yes",
    imageUrl: poi.imageUrl ?? undefined,
    source: "overpass",
  };
}

interface ViewportCenter {
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [selectedRemark, setSelectedRemark] = useState<(Remark & { poi: Poi }) | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<ExternalPOI | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [viewportState, setViewportState] = useState<{
    center: ViewportCenter | null;
    bounds: ViewportBounds | null;
    zoom: number;
  }>({ center: null, bounds: null, zoom: 14 });
  const [generatingPoiId, setGeneratingPoiId] = useState<string | null>(null);
  const [isLookingUpPoi, setIsLookingUpPoi] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [hasMapMovedSinceSearch, setHasMapMovedSinceSearch] = useState(false);
  const [previousSheetMode, setPreviousSheetMode] = useState<SheetMode>(null);
  const [flyToLocation, setFlyToLocation] = useState<{ latitude: number; longitude: number; ts: number } | null>(null);

  const lastSearchQueryRef = useRef<string | null>(null);
  const regenerateCooldownsRef = useRef<Map<string, number>>(new Map());
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const REGENERATE_COOLDOWN_MS = 20000;

  const viewportDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { remarks, isLoading, location, hasRealLocation } = useNearbyRemarks({
    externalLocation: viewportState.center,
  });
  const { triggeredRemark, dismissNotification } = useGeofence(remarks);
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
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedRemark) {
      setCooldownRemaining(0);
      return;
    }

    const poiId = selectedRemark.poi.id;
    const lastRegenTime = regenerateCooldownsRef.current.get(poiId);

    if (!lastRegenTime) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const elapsed = Date.now() - lastRegenTime;
      const remaining = Math.max(0, Math.ceil((REGENERATE_COOLDOWN_MS - elapsed) / 1000));
      setCooldownRemaining(remaining);

      if (remaining === 0 && cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };

    updateCooldown();

    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    cooldownIntervalRef.current = setInterval(updateCooldown, 1000);

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [selectedRemark]);

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
    setSelectedPoi(null);
    setPreviousSheetMode(null);
  }, []);

  const handleViewportChange = useCallback(
    (center: { latitude: number; longitude: number }) => {
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
      viewportDebounceRef.current = setTimeout(() => {
        setViewportState((prev) => ({ ...prev, center }));
        if (lastSearchQueryRef.current) {
          setHasMapMovedSinceSearch(true);
        }
      }, 300);
    },
    []
  );

  const handleViewportUpdate = useCallback(
    (update: { center: { latitude: number; longitude: number }; bounds: ViewportBounds; zoom: number }) => {
      setViewportState({
        center: update.center,
        bounds: update.bounds,
        zoom: update.zoom,
      });
    },
    []
  );

  const handlePoiClick = useCallback(
    async (poi: { name: string; latitude: number; longitude: number; category?: string }) => {
      setIsLookingUpPoi(true);
      setSheetMode("poi");
      setSheetOpen(true);

      try {
        const response = await fetch("/api/poi/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: poi.name,
            latitude: poi.latitude,
            longitude: poi.longitude,
            category: poi.category,
          }),
        });

        if (!response.ok) {
          console.error("POI lookup failed");
          setSheetOpen(false);
          setSheetMode(null);
          return;
        }

        const data = await response.json();

        if (data.remark) {
          setSelectedRemark(data.remark);
          setSelectedPoi(null);
          setSheetMode("story");
        } else {
          setSelectedPoi(data.poi);
          setSelectedRemark(null);
        }
      } catch (error) {
        console.error("Error looking up POI:", error);
        setSheetOpen(false);
        setSheetMode(null);
      } finally {
        setIsLookingUpPoi(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    (query: string) => {
      const searchLocation = viewportState.center ?? (location ? { latitude: location.latitude, longitude: location.longitude } : null);
      if (!searchLocation) return;
      const viewport = viewportState.bounds ? {
        center: searchLocation,
        bounds: viewportState.bounds,
        zoom: viewportState.zoom,
      } : undefined;
      search(query, searchLocation, undefined, viewport);
      setLastSearchQuery(query);
      lastSearchQueryRef.current = query;
      setHasMapMovedSinceSearch(false);
      setSheetMode("search");
      setSheetOpen(true);
    },
    [viewportState, location, search]
  );

  const handleSearchClear = useCallback(() => {
    clearSearch();
    setLastSearchQuery(null);
    setHasMapMovedSinceSearch(false);
    lastSearchQueryRef.current = null;
    if (sheetMode === "search") {
      setSheetOpen(false);
      setSheetMode(null);
    }
  }, [clearSearch, sheetMode]);

  const handleSearchResultTap = useCallback((result: SearchResult) => {
    setPreviousSheetMode(sheetMode);
    if (result.type === "remark") {
      setSelectedRemark(result.remark);
      setSelectedPoi(null);
      setSheetMode("story");
      setFlyToLocation({
        latitude: result.remark.poi.latitude,
        longitude: result.remark.poi.longitude,
        ts: Date.now(),
      });
    } else {
      setSelectedPoi(result.poi);
      setSelectedRemark(result.nearbyRemark ?? null);
      setSheetMode(result.nearbyRemark ? "story" : "poi");
      setFlyToLocation({
        latitude: result.poi.latitude,
        longitude: result.poi.longitude,
        ts: Date.now(),
      });
    }
  }, [sheetMode]);

  const handleGenerateStoryForPoi = useCallback(async () => {
    if (!selectedPoi) return;

    setGeneratingPoiId(selectedPoi.id);

    try {
      const response = await fetch("/api/remarks/generate-for-poi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poi: selectedPoi }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to generate story:", error);
        return;
      }

      const data = await response.json();
      setSelectedRemark(data.remark);
    } catch (error) {
      console.error("Error generating story:", error);
    } finally {
      setGeneratingPoiId(null);
    }
  }, [selectedPoi]);

  const handleSearchThisArea = useCallback(() => {
    if (lastSearchQuery) {
      handleSearch(lastSearchQuery);
    }
  }, [lastSearchQuery, handleSearch]);

  const handleBackToResults = useCallback(() => {
    setSelectedRemark(null);
    setSelectedPoi(null);
    setSheetMode("search");
    setPreviousSheetMode(null);
  }, []);

  const isUsingViewport = !!(viewportState.center && hasRealLocation && location &&
    haversineDistance(viewportState.center.latitude, viewportState.center.longitude,
      location.latitude, location.longitude) > 200);

  const handleNavigateToPoi = useCallback(() => {
    const lat = selectedPoi?.latitude ?? selectedRemark?.poi.latitude;
    const lng = selectedPoi?.longitude ?? selectedRemark?.poi.longitude;
    const name = selectedPoi?.name ?? selectedRemark?.poi.name;
    if (!lat || !lng || !name) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`,
      "_blank"
    );
  }, [selectedPoi, selectedRemark]);

  const handleRegenerateStory = useCallback(async () => {
    if (!selectedRemark || isRegenerating || cooldownRemaining > 0) return;

    const poiId = selectedRemark.poi.id;
    const lastRegenTime = regenerateCooldownsRef.current.get(poiId);
    if (lastRegenTime && Date.now() - lastRegenTime < REGENERATE_COOLDOWN_MS) {
      return;
    }

    setIsRegenerating(true);

    try {
      const response = await fetch("/api/remarks/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarkId: selectedRemark.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to regenerate story:", error);
        return;
      }

      const data = await response.json();
      setSelectedRemark(data.remark);

      regenerateCooldownsRef.current.set(poiId, Date.now());
      setCooldownRemaining(REGENERATE_COOLDOWN_MS / 1000);
    } catch (error) {
      console.error("Error regenerating story:", error);
    } finally {
      setIsRegenerating(false);
    }
  }, [selectedRemark, isRegenerating, cooldownRemaining]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapContainer
        remarks={remarks}
        onPinClick={handlePinClick}
        onViewportChange={handleViewportChange}
        onViewportUpdate={handleViewportUpdate}
        onPoiClick={handlePoiClick}
        selectedRemarkId={selectedRemark?.id}
        isLoading={isLoading}
        userLocation={hasRealLocation ? location : null}
        flyToLocation={flyToLocation}
      />

      <div className="absolute top-safe-area left-4 right-4 z-20 pt-4">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleSearchClear}
          isLoading={isSearching}
          searchStage={searchStage}
          placeholder={hasRealLocation || viewportState.center ? "Ask Obelisk anything..." : "Getting location..."}
          isUsingViewport={isUsingViewport}
        />
      </div>

      <AnimatePresence>
        {lastSearchQuery && hasMapMovedSinceSearch && !isSearching && (
          <motion.div
            className="absolute left-1/2 z-15 pt-2"
            style={{ top: "calc(var(--safe-area-top, 0px) + 72px)" }}
            initial={{ opacity: 0, y: -10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -10, x: "-50%" }}
            transition={springTransitions.floatingEntry}
          >
            <button
              onClick={handleSearchThisArea}
              className="flex items-center gap-2 px-4 py-2 glass-floating rounded-full text-[13px] font-medium text-[var(--foreground)] shadow-lg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Search this area
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {triggeredRemark && !sheetOpen && (
        <StoryNotification
          remark={triggeredRemark}
          onTap={handleNotificationTap}
          onDismiss={dismissNotification}
        />
      )}

      <BottomSheet isOpen={sheetOpen} onClose={handleSheetClose}>
        {(sheetMode === "story" || sheetMode === "poi") && (
          isLookingUpPoi ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[var(--foreground-secondary)]">Looking up place...</p>
            </div>
          ) : (selectedPoi || selectedRemark) ? (
            <POICard
              poi={selectedPoi ?? remarkPoiToExternalPOI(selectedRemark!.poi)}
              remark={selectedRemark}
              onNavigate={handleNavigateToPoi}
              onGenerateStory={!selectedRemark ? handleGenerateStoryForPoi : undefined}
              onRegenerate={selectedRemark ? handleRegenerateStory : undefined}
              isGenerating={selectedPoi ? generatingPoiId === selectedPoi.id : false}
              isRegenerating={isRegenerating}
              cooldownRemaining={cooldownRemaining}
              autoGenerate={!selectedRemark}
              onBack={previousSheetMode === "search" ? handleBackToResults : undefined}
            />
          ) : null
        )}
        {sheetMode === "search" && (
          <SearchResults
            results={searchResults}
            conversationalResponse={conversationalResponse ?? undefined}
            isLoading={isSearching}
            onResultTap={handleSearchResultTap}
            generatingPoiId={generatingPoiId}
          />
        )}
      </BottomSheet>
    </main>
  );
}
