"use client";

import { MapContainer } from "@/components/map/MapContainer";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryNotification } from "@/components/story/StoryNotification";
import { DiscoverButton } from "@/components/map/DiscoverButton";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { POICard } from "@/components/poi/POICard";
import { useGeofence } from "@/hooks/useGeofence";
import { useNearbyRemarks } from "@/hooks/useNearbyRemarks";
import { useDiscoverPois } from "@/hooks/useDiscoverPois";
import { useSearch } from "@/hooks/useSearch";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Remark, Poi, CategorySlug } from "@/types";
import type { ObeliskResult, SearchResult, ExternalResult, ExternalPOI } from "@/lib/search/types";

type SheetMode = "story" | "search" | "poi" | null;

interface ViewportCenter {
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [selectedRemark, setSelectedRemark] = useState<(Remark & { poi: Poi }) | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<ExternalPOI | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [viewportCenter, setViewportCenter] = useState<ViewportCenter | null>(null);
  const [generatingPoiId, setGeneratingPoiId] = useState<string | null>(null);
  const [isLookingUpPoi, setIsLookingUpPoi] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const regenerateCooldownsRef = useRef<Map<string, number>>(new Map());
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const REGENERATE_COOLDOWN_MS = 20000;

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

  const handleGenerateStory = useCallback(async (result: ExternalResult) => {
    setGeneratingPoiId(result.poi.id);

    try {
      const response = await fetch("/api/remarks/generate-for-poi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poi: result.poi }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to generate story:", error);
        return;
      }

      const data = await response.json();
      setSelectedRemark(data.remark);
      setSheetMode("story");
    } catch (error) {
      console.error("Error generating story:", error);
    } finally {
      setGeneratingPoiId(null);
    }
  }, []);

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
      setSelectedPoi(null);
      setSheetMode("story");
    } catch (error) {
      console.error("Error generating story:", error);
    } finally {
      setGeneratingPoiId(null);
    }
  }, [selectedPoi]);

  const handleNavigateToPoi = useCallback(() => {
    if (!selectedPoi) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${selectedPoi.latitude},${selectedPoi.longitude}&destination_place_id=${encodeURIComponent(selectedPoi.name)}`,
      "_blank"
    );
  }, [selectedPoi]);

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
            onRegenerate={handleRegenerateStory}
            isRegenerating={isRegenerating}
            cooldownRemaining={cooldownRemaining}
          />
        )}
        {sheetMode === "poi" && (
          isLookingUpPoi ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[var(--foreground-secondary)]">Looking up place...</p>
            </div>
          ) : selectedPoi ? (
            <POICard
              poi={selectedPoi}
              onNavigate={handleNavigateToPoi}
              onGenerateStory={handleGenerateStoryForPoi}
              isGenerating={generatingPoiId === selectedPoi.id}
            />
          ) : null
        )}
        {sheetMode === "search" && (
          <SearchResults
            results={searchResults}
            conversationalResponse={conversationalResponse ?? undefined}
            isLoading={isSearching}
            onNavigate={handleNavigate}
            onSelectStory={handleSelectStory}
            onGenerateStory={handleGenerateStory}
            generatingPoiId={generatingPoiId}
          />
        )}
      </BottomSheet>
    </main>
  );
}
