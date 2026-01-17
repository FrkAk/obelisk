"use client";

import { useState, useEffect, useCallback } from "react";
import { Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProximityStore } from "@/stores/proximity-store";
import { cn } from "@/lib/utils";

const TOOLTIP_DISMISSED_KEY = "obelisk:discovery-tooltip-dismissed";
const TOOLTIP_DELAY_MS = 3000;

/**
 * Discovery mode toggle button with first-time tooltip.
 *
 * Returns:
 *     React component for toggling discovery mode.
 */
export function DiscoveryToggle() {
  const { discoveryEnabled, setDiscoveryEnabled } = useProximityStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (dismissed) {
      setTooltipDismissed(true);
      return;
    }

    setTooltipDismissed(false);
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, TOOLTIP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    setTooltipDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (showTooltip) {
      dismissTooltip();
    }
    setDiscoveryEnabled(!discoveryEnabled);
  }, [discoveryEnabled, setDiscoveryEnabled, showTooltip, dismissTooltip]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9 rounded-lg transition-all duration-300",
          discoveryEnabled
            ? "bg-primary text-primary-foreground shadow-blue hover:bg-primary/90"
            : "hover:bg-black/5 dark:hover:bg-white/10"
        )}
        onClick={handleToggle}
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

      {showTooltip && !tooltipDismissed && (
        <div
          className={cn(
            "absolute right-full mr-3 top-1/2 -translate-y-1/2",
            "glass-thick rounded-xl px-3 py-2.5 shadow-elevated",
            "border border-black/10 dark:border-white/20",
            "animate-fade-scale-in",
            "min-w-[180px] max-w-[220px]"
          )}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium">Discover Stories</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable to find stories about places near you
              </p>
            </div>
            <button
              onClick={dismissTooltip}
              className="shrink-0 p-0.5 -m-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss tooltip"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
            style={{
              width: 0,
              height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderLeft: "6px solid rgba(255, 255, 255, 0.9)",
            }}
          />
        </div>
      )}
    </div>
  );
}
