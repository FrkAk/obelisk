"use client";

import { useCallback, type ReactNode } from "react";
import { Compass, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/stores/map-store";
import { LocationButton } from "./location-button";
import { DiscoveryToggle } from "@/components/discovery/discovery-layer";
import { cn } from "@/lib/utils";

interface MapControlStackProps {
  className?: string;
}

interface ControlButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
  disabled?: boolean;
}

function ControlButton({ onClick, icon, label, className, disabled }: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-12 w-12 rounded-none",
        "hover:bg-black/5 dark:hover:bg-white/10",
        "transition-all duration-200",
        "active:scale-95",
        "ripple-container",
        className
      )}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function Divider() {
  return <div className="h-px w-8 mx-auto bg-black/10 dark:bg-white/10" />;
}

/**
 * Unified vertical control stack for map navigation (Apple Maps style).
 *
 * Args:
 *     className: Additional CSS classes.
 *
 * Returns:
 *     React component rendering a vertical stack of map controls.
 */
export function MapControlStack({ className }: MapControlStackProps) {
  const { viewState, setViewState } = useMapStore();

  const handleZoomIn = useCallback(() => {
    setViewState({ ...viewState, zoom: Math.min(viewState.zoom + 1, 20) });
  }, [viewState, setViewState]);

  const handleZoomOut = useCallback(() => {
    setViewState({ ...viewState, zoom: Math.max(viewState.zoom - 1, 1) });
  }, [viewState, setViewState]);

  const handleResetBearing = useCallback(() => {
    setViewState({ ...viewState, bearing: 0, pitch: 0 });
  }, [viewState, setViewState]);

  const showCompass = viewState.bearing !== 0 || viewState.pitch !== 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        "glass rounded-2xl",
        "border border-white/20",
        "shadow-elevated",
        "overflow-hidden",
        className
      )}
    >
      {showCompass && (
        <>
          <ControlButton
            onClick={handleResetBearing}
            icon={
              <Compass
                className="h-5 w-5 transition-transform duration-300"
                style={{ transform: `rotate(${-viewState.bearing}deg)` }}
              />
            }
            label="Reset compass"
            className="rounded-t-2xl"
          />
          <Divider />
        </>
      )}

      <ControlButton
        onClick={handleZoomIn}
        icon={<ZoomIn className="h-5 w-5" />}
        label="Zoom in"
        className={!showCompass ? "rounded-t-2xl" : ""}
      />
      <Divider />
      <ControlButton
        onClick={handleZoomOut}
        icon={<ZoomOut className="h-5 w-5" />}
        label="Zoom out"
      />
      <Divider />

      <div className="p-1.5">
        <DiscoveryToggle />
      </div>

      <Divider />

      <div className="p-1.5">
        <LocationButton />
      </div>
    </div>
  );
}
