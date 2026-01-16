"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Navigation, Navigation2, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserLocationStore } from "@/stores/user-location-store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Three-state location button (Apple Maps style).
 *
 * States:
 *   - off: Gray arrow icon, transparent background
 *   - follow: Blue filled background, white arrow
 *   - followWithHeading: Blue background, compass needle icon
 *
 * Returns:
 *     React component for location tracking control.
 */
export function LocationButton() {
  const { trackingMode, cycleTrackingMode } = useUserLocationStore();
  const { requestPosition, error } = useGeolocation();
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const lastErrorRef = useRef<GeolocationPositionError | null>(null);

  const handleClick = useCallback(() => {
    if (trackingMode === "off") {
      requestPosition();
    }
    setIsAnimating(true);
    cycleTrackingMode();
  }, [trackingMode, cycleTrackingMode, requestPosition]);

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      toast({
        title: "Location Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const isActive = trackingMode !== "off";
  const isHeadingMode = trackingMode === "followWithHeading";

  const Icon = isHeadingMode ? Navigation2 : isActive ? Navigation : Locate;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "h-9 w-9 rounded-lg transition-all duration-300",
        isActive
          ? "bg-[#007AFF] hover:bg-[#0066DD] text-white shadow-blue"
          : "hover:bg-black/5 dark:hover:bg-white/10",
        isAnimating && "animate-scale-bounce"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          isHeadingMode && "rotate-0",
          isActive && !isHeadingMode && "-rotate-45"
        )}
        fill={isActive ? "currentColor" : "none"}
      />
      <span className="sr-only">
        {trackingMode === "off"
          ? "Enable location tracking"
          : trackingMode === "follow"
            ? "Enable heading tracking"
            : "Disable location tracking"}
      </span>
    </Button>
  );
}
