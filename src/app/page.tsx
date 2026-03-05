"use client";

import { MapContainer } from "@/components/map/MapContainer";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { RemarkNotification } from "@/components/remark/RemarkNotification";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { POICard } from "@/components/poi/POICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { useGeofence } from "@/hooks/useGeofence";
import { useNearbyRemarks } from "@/hooks/useNearbyRemarks";
import { useSearch, useAutocomplete } from "@/hooks/useSearch";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Remark, PoiWithCategory, SearchResult, ExternalPOI, ViewportBounds } from "@/types/api";
import { haversineDistance } from "@/lib/geo/distance";
import { springTransitions } from "@/lib/ui/animations";

type SheetMode = "remark" | "search" | "poi" | null;

/**
 * Converts a PoiWithCategory from a remark query into an ExternalPOI shape.
 *
 * Args:
 *     poi: POI with optional category data.
 *
 * Returns:
 *     ExternalPOI suitable for the POI card component.
 */
function remarkPoiToExternalPOI(poi: PoiWithCategory): ExternalPOI {
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

/**
 * Main map page orchestrating search, remarks, and POI discovery.
 */
export default function Home() {
  const [selectedRemark, setSelectedRemark] = useState<(Remark & { poi: PoiWithCategory }) | null>(null);
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
  const [searchPinLocation, setSearchPinLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const lastSearchQueryRef = useRef<string | null>(null);
  const regenerateCooldownsRef = useRef<Map<string, number>>(new Map());
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const REGENERATE_COOLDOWN_MS = 20000;

  const viewportDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { remarks, location, hasRealLocation } = useNearbyRemarks({
    externalLocation: viewportState.center,
  });
  const { triggeredRemark, dismissNotification } = useGeofence(remarks);
  const {
    results: searchResults,
    isLoading: isSearching,
    error: searchError,
    search,
    clear: clearSearch,
  } = useSearch({ radius: 2000 });

  const {
    suggestions,
    fetchSuggestions,
    clear: clearAutocomplete,
  } = useAutocomplete();

  useEffect(() => {
    if (searchError) setAppError("Search isn't working right now.");
  }, [searchError]);

  const autocompleteLocation = useMemo(
    () => viewportState.center ?? (location ? { latitude: location.latitude, longitude: location.longitude } : undefined),
    [viewportState.center, location]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      fetchSuggestions(value, autocompleteLocation ?? undefined);
    },
    [fetchSuggestions, autocompleteLocation]
  );

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

  const handleNotificationTap = useCallback(() => {
    if (triggeredRemark) {
      setSelectedRemark(triggeredRemark);
      setSheetMode("remark");
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
    setSearchPinLocation(null);
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
          setAppError("Couldn't load this place. Try again.");
          setSheetOpen(false);
          setSheetMode(null);
          return;
        }

        const data = await response.json();

        if (data.remark) {
          setSelectedRemark(data.remark);
          setSelectedPoi(null);
          setSheetMode("remark");
        } else {
          setSelectedPoi(data.poi);
          setSelectedRemark(null);
        }
      } catch {
        setAppError("Couldn't load this place. Try again.");
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
      clearAutocomplete();
      search(query, searchLocation, undefined, viewport);
      setLastSearchQuery(query);
      lastSearchQueryRef.current = query;
      setHasMapMovedSinceSearch(false);
      setSheetMode("search");
      setSheetOpen(true);
    },
    [viewportState, location, search, clearAutocomplete]
  );

  const handleSuggestionSelect = useCallback(
    (name: string) => {
      clearAutocomplete();
      handleSearch(name);
    },
    [clearAutocomplete, handleSearch]
  );

  const handleSearchClear = useCallback(() => {
    clearAutocomplete();
    clearSearch();
    setLastSearchQuery(null);
    setHasMapMovedSinceSearch(false);
    lastSearchQueryRef.current = null;
    setSearchPinLocation(null);
    if (sheetMode === "search") {
      setSheetOpen(false);
      setSheetMode(null);
    }
  }, [clearAutocomplete, clearSearch, sheetMode]);

  const handleSearchResultTap = useCallback((result: SearchResult) => {
    setPreviousSheetMode(sheetMode);

    if (result.remark) {
      setSelectedRemark(result.remark);
      setSelectedPoi(null);
      setSheetMode("remark");
    } else {
      const externalPoi: ExternalPOI = {
        id: result.id,
        osmId: result.osmId ?? 0,
        osmType: "node",
        name: result.name,
        category: result.category,
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.address,
        cuisine: result.cuisine,
        hasWifi: result.hasWifi,
        hasOutdoorSeating: result.hasOutdoorSeating,
        source: "overpass",
      };
      setSelectedPoi(externalPoi);
      setSelectedRemark(null);
      setSheetMode("poi");
    }

    setFlyToLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      ts: Date.now(),
    });
    setSearchPinLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
  }, [sheetMode]);

  const handleGenerateRemarkForPoi = useCallback(async () => {
    if (!selectedPoi) return;

    setGeneratingPoiId(selectedPoi.id);

    try {
      const response = await fetch("/api/remarks/generate-for-poi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poi: selectedPoi }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          setAppError("Our storyteller is resting. Try again in a moment.");
        } else if (response.status === 429) {
          setAppError("Too many requests. Please slow down.");
        } else {
          setAppError("Couldn't generate a remark right now.");
        }
        return;
      }

      const data = await response.json();
      setSelectedRemark(data.remark);
    } catch {
      setAppError("Couldn't generate a remark right now.");
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

  const handleRegenerateRemark = useCallback(async () => {
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
        if (response.status === 503) {
          setAppError("Our storyteller is resting. Try again in a moment.");
        } else if (response.status === 429) {
          setAppError("Too many requests. Please slow down.");
        } else {
          setAppError("Couldn't refresh this remark.");
        }
        return;
      }

      const data = await response.json();
      setSelectedRemark(data.remark);

      regenerateCooldownsRef.current.set(poiId, Date.now());
      setCooldownRemaining(REGENERATE_COOLDOWN_MS / 1000);
    } catch {
      setAppError("Couldn't refresh this remark.");
    } finally {
      setIsRegenerating(false);
    }
  }, [selectedRemark, isRegenerating, cooldownRemaining]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapContainer
        onViewportChange={handleViewportChange}
        onViewportUpdate={handleViewportUpdate}
        onPoiClick={handlePoiClick}
        onMapClick={sheetOpen ? handleSheetClose : undefined}
        userLocation={hasRealLocation ? location : null}
        flyToLocation={flyToLocation}
        searchPinLocation={searchPinLocation}
      />

      <div className="absolute top-safe-area left-4 right-4 z-20 pt-4">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleSearchClear}
          onInputChange={handleInputChange}
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
          isLoading={isSearching}
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
              className="flex items-center gap-2 px-4 py-2 glass-floating rounded-full text-[13px] font-medium text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Look around here
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {triggeredRemark && !sheetOpen && (
        <RemarkNotification
          remark={triggeredRemark}
          onTap={handleNotificationTap}
          onDismiss={dismissNotification}
        />
      )}

      <ErrorToast message={appError} onClose={() => setAppError(null)} />

      <BottomSheet isOpen={sheetOpen} onClose={handleSheetClose}>
        {(sheetMode === "remark" || sheetMode === "poi") && (
          isLookingUpPoi ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <LoadingState
                phrases={[
                  "Looking up this place...",
                  "Finding what we know...",
                  "Almost there...",
                ]}
              />
            </div>
          ) : (selectedPoi || selectedRemark) ? (
            <POICard
              poi={selectedPoi ?? remarkPoiToExternalPOI(selectedRemark!.poi)}
              remark={selectedRemark}
              onNavigate={handleNavigateToPoi}
              onGenerateRemark={!selectedRemark ? handleGenerateRemarkForPoi : undefined}
              onRegenerate={selectedRemark ? handleRegenerateRemark : undefined}
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
            isLoading={isSearching}
            onResultTap={handleSearchResultTap}
          />
        )}
      </BottomSheet>
    </main>
  );
}
