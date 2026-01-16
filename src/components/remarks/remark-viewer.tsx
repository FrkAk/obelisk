"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Map, { NavigationControl, type MapRef } from "react-map-gl/maplibre";
import { ArrowLeft, Share2, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RemarkStopCard } from "./remark-stop-card";
import { RemarkSaveButton } from "./remark-save-button";
import { RemarkRating } from "./remark-rating";
import { StopMarker } from "./stop-marker";
import { StopRouteLayer } from "./stop-route-layer";
import { useToast } from "@/hooks/use-toast";
import "maplibre-gl/dist/maplibre-gl.css";

interface Stop {
  id: string;
  sequenceNumber: number;
  longitude: string;
  latitude: string;
  title: string;
  description?: string | null;
  audioUrl?: string | null;
  images?: string[] | null;
}

interface RemarkViewerProps {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  categories?: string[] | null;
  stops: Stop[];
}

export function RemarkViewer({
  id,
  title,
  description,
  coverImageUrl,
  categories,
  stops,
}: RemarkViewerProps) {
  const mapRef = useRef<MapRef>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [showStopsList, setShowStopsList] = useState(true);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const { toast } = useToast();

  const center = stops.length > 0
    ? {
        longitude: parseFloat(stops[0].longitude),
        latitude: parseFloat(stops[0].latitude),
      }
    : { longitude: 0, latitude: 51.5 };

  const [viewState, setViewState] = useState({
    longitude: center.longitude,
    latitude: center.latitude,
    zoom: 14,
  });

  const flyToStop = useCallback((stop: Stop) => {
    mapRef.current?.flyTo({
      center: [parseFloat(stop.longitude), parseFloat(stop.latitude)],
      zoom: 16,
      duration: 1000,
    });
    setActiveStopId(stop.id);
  }, []);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/remarks/${id}`;
    const shareData = {
      title,
      text: description ?? `Check out this remark: ${title}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareState("copied");
        toast({
          title: "Link copied",
          description: "The link has been copied to your clipboard.",
        });
        setTimeout(() => setShareState("idle"), 2000);
      } catch {
        toast({
          title: "Failed to copy",
          description: "Could not copy the link to clipboard.",
          variant: "destructive",
        });
      }
    }
  }, [id, title, description, toast]);

  useEffect(() => {
    if (stops.length > 0 && !activeStopId) {
      setActiveStopId(stops[0].id);
    }
  }, [stops, activeStopId]);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="relative h-1/2 w-full lg:h-full lg:w-2/3">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" />
          <StopRouteLayer stops={stops} />
          {stops.map((stop) => (
            <StopMarker
              key={stop.id}
              longitude={parseFloat(stop.longitude)}
              latitude={parseFloat(stop.latitude)}
              sequenceNumber={stop.sequenceNumber}
              isActive={activeStopId === stop.id}
              onClick={() => flyToStop(stop)}
            />
          ))}
        </Map>

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Link href="/remarks">
            <Button variant="secondary" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-2">
          <RemarkSaveButton remarkId={id} />
          <Button variant="secondary" size="icon" onClick={handleShare}>
            {shareState === "copied" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          variant="secondary"
          className="absolute bottom-4 left-4 lg:hidden"
          onClick={() => setShowStopsList(true)}
        >
          View Stops ({stops.length})
        </Button>
      </div>

      <div className="hidden lg:flex h-1/2 w-full flex-col lg:h-full lg:w-1/3 border-l">
        <div className="p-4 border-b">
          {coverImageUrl && (
            <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={coverImageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
          {categories && categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-3">
            <RemarkRating remarkId={id} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="mb-3 font-semibold">Stops ({stops.length})</h2>
          <div className="space-y-3">
            {stops.map((stop) => (
              <RemarkStopCard
                key={stop.id}
                id={stop.id}
                remarkId={id}
                sequenceNumber={stop.sequenceNumber}
                title={stop.title}
                description={stop.description}
                audioUrl={stop.audioUrl}
                images={stop.images}
                isActive={activeStopId === stop.id}
                onClick={() => flyToStop(stop)}
              />
            ))}
          </div>
        </div>
      </div>

      <Sheet open={showStopsList} onOpenChange={setShowStopsList}>
        <SheetContent side="bottom" className="h-[70vh] lg:hidden">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-full overflow-y-auto pb-8">
            {description && (
              <p className="mb-4 text-sm text-muted-foreground">{description}</p>
            )}
            <RemarkRating remarkId={id} className="mb-4" />
            <h2 className="mb-3 font-semibold">Stops ({stops.length})</h2>
            <div className="space-y-3">
              {stops.map((stop) => (
                <RemarkStopCard
                  key={stop.id}
                  id={stop.id}
                  remarkId={id}
                  sequenceNumber={stop.sequenceNumber}
                  title={stop.title}
                  description={stop.description}
                  audioUrl={stop.audioUrl}
                  images={stop.images}
                  isActive={activeStopId === stop.id}
                  onClick={() => {
                    flyToStop(stop);
                    setShowStopsList(false);
                  }}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
