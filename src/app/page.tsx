"use client";

import { MapContainer } from "@/components/map/MapContainer";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryNotification } from "@/components/story/StoryNotification";
import { DiscoverButton } from "@/components/map/DiscoverButton";
import { useGeofence } from "@/hooks/useGeofence";
import { useNearbyRemarks } from "@/hooks/useNearbyRemarks";
import { useDiscoverPois } from "@/hooks/useDiscoverPois";
import { useState, useCallback } from "react";
import type { Remark, Poi } from "@/types";

export default function Home() {
  const [selectedRemark, setSelectedRemark] = useState<(Remark & { poi: Poi }) | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { remarks, isLoading, location, hasRealLocation } = useNearbyRemarks();
  const { triggeredRemark, dismissNotification } = useGeofence(remarks);
  const { discover, status, progress, isDiscovering } = useDiscoverPois();

  const handlePinClick = useCallback((remark: Remark & { poi: Poi }) => {
    setSelectedRemark(remark);
    setSheetOpen(true);
  }, []);

  const handleNotificationTap = useCallback(() => {
    if (triggeredRemark) {
      setSelectedRemark(triggeredRemark);
      setSheetOpen(true);
      dismissNotification();
    }
  }, [triggeredRemark, dismissNotification]);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
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

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapContainer
        remarks={remarks}
        onPinClick={handlePinClick}
        selectedRemarkId={selectedRemark?.id}
        isLoading={isLoading}
        userLocation={hasRealLocation ? location : null}
      />

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

      <BottomSheet
        isOpen={sheetOpen}
        onClose={handleSheetClose}
      >
        {selectedRemark && (
          <StoryCard remark={selectedRemark} />
        )}
      </BottomSheet>
    </main>
  );
}
