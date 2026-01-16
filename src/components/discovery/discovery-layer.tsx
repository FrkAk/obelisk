"use client";

import { useProximityDetection } from "@/hooks/use-proximity-detection";
import { useProximityStore } from "@/stores/proximity-store";
import { StoryNotification } from "./story-notification";
import { Button } from "@/components/ui/button";
import { Compass, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoveryLayerProps {
  className?: string;
}

export function DiscoveryLayer({ className }: DiscoveryLayerProps) {
  const {
    currentNotification,
    dismissNotification,
    expandNotification,
    permissionState,
    requestPosition,
    isGeneratingStory,
  } = useProximityDetection({
    radiusMeters: 200,
    enabled: true,
  });

  const { discoveryEnabled } = useProximityStore();

  return (
    <div className={cn("", className)}>
      {discoveryEnabled && permissionState === "prompt" && (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="glass rounded-xl border border-white/20 p-4 shadow-elevated">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Enable Location</h4>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Allow location access to discover stories about places near you.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={requestPosition}
                >
                  Enable Location
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {discoveryEnabled && permissionState === "denied" && (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="glass rounded-xl border border-white/20 p-4 shadow-elevated">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <MapPin className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Location Access Denied</h4>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Location access was denied. Please enable it in your browser settings to use discovery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {discoveryEnabled && isGeneratingStory && !currentNotification && (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="glass rounded-xl border border-white/20 p-4 shadow-elevated">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Discovering nearby story...</p>
                <p className="text-xs text-muted-foreground">Generating content for you</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentNotification && currentNotification.story && (
        <StoryNotification
          poi={{
            ...currentNotification,
            story: currentNotification.story,
          }}
          onDismiss={dismissNotification}
          onExpand={expandNotification}
        />
      )}
    </div>
  );
}

/**
 * Discovery mode toggle button.
 *
 * Returns:
 *     React component for toggling discovery mode.
 */
export function DiscoveryToggle() {
  const { discoveryEnabled, setDiscoveryEnabled } = useProximityStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-9 w-9 rounded-lg transition-all duration-300",
        discoveryEnabled
          ? "bg-primary text-primary-foreground shadow-blue hover:bg-primary/90"
          : "hover:bg-black/5 dark:hover:bg-white/10"
      )}
      onClick={() => setDiscoveryEnabled(!discoveryEnabled)}
      aria-label={discoveryEnabled ? "Disable discovery" : "Enable discovery"}
    >
      <Compass
        className={cn(
          "h-4 w-4 transition-all duration-300",
          discoveryEnabled ? "" : "opacity-60"
        )}
      />
      {discoveryEnabled && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
      )}
    </Button>
  );
}
