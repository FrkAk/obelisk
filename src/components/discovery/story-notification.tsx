"use client";

import { useState, useCallback, useRef } from "react";
import { X, ChevronUp, MapPin, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useGesture } from "@/hooks/use-gesture";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

interface StoryNotificationProps {
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
  onDismiss: () => void;
  onExpand: () => void;
}

/**
 * Discovery story notification card with gesture support.
 *
 * Args:
 *     poi: POI data with story information.
 *     onDismiss: Callback when notification is dismissed.
 *     onExpand: Callback when notification is expanded.
 *
 * Returns:
 *     React component rendering the story notification.
 */
export function StoryNotification({
  poi,
  onDismiss,
  onExpand,
}: StoryNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    onExpand();
  }, [onExpand]);

  const handleClose = useCallback(() => {
    setIsExpanded(false);
    onDismiss();
  }, [onDismiss]);

  const handleDismissWithAnimation = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const { handlers } = useGesture(
    {
      onSwipe: (direction, _velocity) => {
        if (direction === "down") {
          handleDismissWithAnimation();
        } else if (direction === "up") {
          handleExpand();
        }
      },
      onDrag: (state) => {
        if (state.deltaY > 0) {
          setDragOffset(Math.min(state.deltaY * 0.5, 100));
        } else {
          setDragOffset(Math.max(state.deltaY * 0.3, -30));
        }
      },
      onDragEnd: (state) => {
        if (state.deltaY > 60) {
          handleDismissWithAnimation();
        } else if (state.deltaY < -40) {
          handleExpand();
        } else {
          setDragOffset(0);
        }
      },
    },
    { axis: "y", threshold: 30, velocityThreshold: 0.4 }
  );

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "fixed bottom-6 left-4 right-4 z-40",
          "transition-all",
          dragOffset === 0 ? "duration-300" : "duration-0",
          isExpanded && "opacity-0 pointer-events-none scale-95",
          isDismissing && "opacity-0 translate-y-full"
        )}
        style={{
          transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined,
          opacity: isDismissing ? 0 : dragOffset > 0 ? 1 - dragOffset / 150 : 1,
        }}
        {...handlers}
      >
        <div
          className={cn(
            "glass-gold rounded-2xl",
            "border border-[rgba(255,214,10,0.2)]",
            "shadow-elevated overflow-hidden",
            "animate-discovery-appear",
            !isExpanded && !isDismissing && "animate-glow-pulse"
          )}
        >
          <div className="relative p-4">
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={handleExpand}
                className="flex-1 text-left group"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="font-medium text-primary">{formatDistance(poi.distanceMeters)}</span>
                  </div>
                  {poi.categories?.[0] && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                      {poi.categories[0]}
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200">
                  {poi.story.title}
                </h4>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2 leading-relaxed">
                  {poi.story.teaser}
                </p>
              </button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full",
                    "hover:bg-primary/10 hover:text-primary",
                    "transition-all duration-200",
                    "active:scale-90"
                  )}
                  onClick={handleExpand}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full",
                    "hover:bg-destructive/10 hover:text-destructive",
                    "transition-all duration-200",
                    "active:scale-90"
                  )}
                  onClick={handleDismissWithAnimation}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <div className="w-8 h-1 rounded-full bg-black/10 dark:bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <BottomSheet
        isOpen={isExpanded}
        onClose={handleClose}
        initialSnap="half"
      >
        <StoryCard poi={poi} onClose={handleClose} />
      </BottomSheet>
    </>
  );
}

interface StoryCardProps {
  poi: StoryNotificationProps["poi"];
  onClose: () => void;
}

function StoryCard({ poi, onClose }: StoryCardProps) {
  const utils = trpc.useUtils();
  const { data: storyData, isLoading } = trpc.poi.getStory.useQuery({
    poiId: poi.id,
    storyType: "discovery",
  });

  const { data: savedData } = trpc.poi.isSaved.useQuery(
    { poiId: poi.id },
    { enabled: true }
  );

  const saveMutation = trpc.poi.save.useMutation({
    onSuccess: () => {
      utils.poi.isSaved.invalidate({ poiId: poi.id });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ poiId: poi.id });
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">{formatDistance(poi.distanceMeters)}</span>
          </div>
          <div className="flex items-center gap-2">
            {poi.categories?.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="rounded-full px-3">
                {category}
              </Badge>
            ))}
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {storyData?.title ?? poi.story.title}
        </h2>
        <p className="text-base font-medium text-muted-foreground/80 mt-1">
          {poi.name}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded-full w-full animate-shimmer" />
            <div className="h-4 bg-muted rounded-full w-5/6 animate-shimmer" style={{ animationDelay: "0.1s" }} />
            <div className="h-4 bg-muted rounded-full w-4/6 animate-shimmer" style={{ animationDelay: "0.2s" }} />
            <div className="h-4 bg-muted rounded-full w-full animate-shimmer" style={{ animationDelay: "0.3s" }} />
            <div className="h-4 bg-muted rounded-full w-3/4 animate-shimmer" style={{ animationDelay: "0.4s" }} />
          </div>
        ) : (
          <p className="text-foreground leading-relaxed text-[15px]">
            {storyData?.content ?? poi.story.teaser}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {savedData?.saved ? (
            <>
              <BookmarkCheck className="h-4 w-4 text-primary" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
        <Button
          className="flex-1 h-12 rounded-xl transition-all duration-200 hover:scale-[1.02]"
          onClick={onClose}
        >
          Continue Exploring
        </Button>
      </div>
    </div>
  );
}
