"use client";

import { useEffect } from "react";
import { MapPin, Clock, Phone, Globe, ExternalLink } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StoryRevealCard } from "./story-reveal-card";
import { usePoiStory } from "@/hooks/use-poi-story";
import type { SelectedPoi } from "@/stores/map-store";

interface PoiDetailSheetProps {
  poi: SelectedPoi | null;
  onClose: () => void;
}

/**
 * Rich POI detail sheet with Obelisk Remarks story reveal.
 *
 * Args:
 *     poi: The selected POI to display.
 *     onClose: Callback when sheet should close.
 *
 * Returns:
 *     React component rendering POI details in a bottom sheet.
 */
export function PoiDetailSheet({ poi, onClose }: PoiDetailSheetProps) {
  const { story, isLoading, isRevealed, revealStory, resetStory } = usePoiStory({
    poiId: poi?.id ?? "",
    storyType: "discovery",
  });

  useEffect(() => {
    if (!poi) {
      resetStory();
    }
  }, [poi, resetStory]);

  if (!poi) return null;

  return (
    <BottomSheet
      isOpen={!!poi}
      onClose={onClose}
      initialSnap="half"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{poi.name}</h2>

          {/* Categories as pills */}
          {poi.categories && poi.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {poi.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Obelisk Remarks - Story Reveal Card */}
        <StoryRevealCard
          story={story}
          isLoading={isLoading}
          isRevealed={isRevealed}
          onReveal={revealStory}
        />

        {/* Description */}
        {poi.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {poi.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2">
          {poi.address && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{poi.address}</span>
            </div>
          )}

          {poi.openingHours && (
            <div className="flex items-start gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{poi.openingHours}</span>
            </div>
          )}

          {poi.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={`tel:${poi.phone}`}
                className="text-primary hover:underline"
              >
                {poi.phone}
              </a>
            </div>
          )}

          {poi.website && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={poi.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Visit website
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
