"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Bookmark,
  BookmarkCheck,
  Share2,
  Navigation,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniAudioPlayer } from "@/components/audio/mini-audio-player";
import { useMapStore } from "@/stores/map-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface StoryPresentationProps {
  poi: {
    id: string;
    name: string;
    longitude: string;
    latitude: string;
    categories: string[] | null;
    distanceMeters: number;
    story: {
      id: string;
      title: string;
      teaser: string;
    };
  };
  onClose?: () => void;
  className?: string;
}

/**
 * Full story presentation view with hero photo, metadata, content, and actions.
 *
 * Args:
 *     poi: POI data with story information.
 *     onClose: Callback when presentation is closed.
 *     className: Additional CSS classes.
 *
 * Returns:
 *     React component rendering the full story presentation.
 */
export function StoryPresentation({
  poi,
  onClose,
  className,
}: StoryPresentationProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { setViewState, viewState } = useMapStore();

  const utils = trpc.useUtils();
  const { data: storyDataRaw, isLoading } = trpc.poi.getStory.useQuery({
    poiId: poi.id,
    storyType: "discovery",
  });

  const storyData = storyDataRaw as (typeof storyDataRaw & {
    imageUrl?: string;
    audioUrl?: string;
  }) | undefined;

  const { data: savedData } = trpc.poi.isSaved.useQuery(
    { poiId: poi.id },
    { enabled: true }
  );

  const saveMutation = trpc.poi.save.useMutation({
    onSuccess: () => {
      utils.poi.isSaved.invalidate({ poiId: poi.id });
    },
  });

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleNavigate = () => {
    setViewState({
      ...viewState,
      latitude: parseFloat(poi.latitude),
      longitude: parseFloat(poi.longitude),
      zoom: 17,
    });
    onClose?.();
  };

  const handleSave = () => {
    saveMutation.mutate({ poiId: poi.id });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storyData?.title ?? poi.story.title,
          text: storyData?.content ?? poi.story.teaser,
          url: window.location.href,
        });
      } catch {
        // User cancelled sharing
      }
    }
  };

  const estimatedReadTime = storyData?.content
    ? Math.ceil(storyData.content.split(" ").length / 200)
    : 1;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Hero Image */}
      {storyData?.imageUrl && (
        <div className="relative -mx-4 -mt-4 mb-4 h-48 overflow-hidden rounded-t-3xl">
          <Image
            src={storyData.imageUrl}
            alt={storyData.title}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

          {/* Floating badges */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-white" />
              <span className="text-sm font-medium text-white">
                {formatDistance(poi.distanceMeters)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-white" />
              <span className="text-sm font-medium text-white">
                {estimatedReadTime} min read
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {!storyData?.imageUrl && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {formatDistance(poi.distanceMeters)}
              </span>
            </div>
          )}
          {poi.categories?.slice(0, 2).map((category) => (
            <Badge key={category} variant="secondary" className="rounded-full px-3">
              {category}
            </Badge>
          ))}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {storyData?.title ?? poi.story.title}
        </h2>
        <p className="text-base font-medium text-muted-foreground/80 mt-1">
          {poi.name}
        </p>
      </div>

      {/* Audio Player */}
      {storyData?.audioUrl && (
        <div className="mb-4">
          <MiniAudioPlayer
            audioUrl={storyData.audioUrl}
            title={`Listen to "${storyData.title}"`}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 mb-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded-full w-full animate-shimmer" />
            <div className="h-4 bg-muted rounded-full w-5/6 animate-shimmer" style={{ animationDelay: "0.1s" }} />
            <div className="h-4 bg-muted rounded-full w-4/6 animate-shimmer" style={{ animationDelay: "0.2s" }} />
            <div className="h-4 bg-muted rounded-full w-full animate-shimmer" style={{ animationDelay: "0.3s" }} />
            <div className="h-4 bg-muted rounded-full w-3/4 animate-shimmer" style={{ animationDelay: "0.4s" }} />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground leading-relaxed text-[15px]">
              {storyData?.content ?? poi.story.teaser}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className={cn(
            "h-12 rounded-xl",
            "border-2 transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {savedData?.saved ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          <span className="ml-2">{savedData?.saved ? "Saved" : "Save"}</span>
        </Button>

        <Button
          variant="outline"
          className={cn(
            "h-12 rounded-xl",
            "border-2 transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          <span className="ml-2">Share</span>
        </Button>

        <Button
          className={cn(
            "h-12 rounded-xl",
            "transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]"
          )}
          onClick={handleNavigate}
        >
          <Navigation className="h-4 w-4" />
          <span className="ml-2">Go</span>
        </Button>
      </div>
    </div>
  );
}
