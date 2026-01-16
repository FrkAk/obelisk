"use client";

import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioStore } from "@/stores/audio-store";
import { cn } from "@/lib/utils";

interface RemarkStopCardProps {
  id: string;
  remarkId: string;
  sequenceNumber: number;
  title: string;
  description?: string | null;
  audioUrl?: string | null;
  images?: string[] | null;
  isActive?: boolean;
  onClick?: () => void;
}

export function RemarkStopCard({
  id,
  remarkId,
  sequenceNumber,
  title,
  description,
  audioUrl,
  images,
  isActive,
  onClick,
}: RemarkStopCardProps) {
  const { currentTrack, isPlaying, setCurrentTrack, play, pause } = useAudioStore();

  const isCurrentlyPlaying = currentTrack?.stopId === id && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!audioUrl) return;

    if (currentTrack?.stopId === id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      setCurrentTrack({
        id: `stop-${id}`,
        title,
        url: audioUrl,
        remarkId,
        stopId: id,
      });
      play();
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        isActive && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="flex gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
          {sequenceNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {images && images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden"
                >
                  <Image
                    src={image}
                    alt={`${title} image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
              {images.length > 3 && (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                  +{images.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        {audioUrl && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={handlePlayClick}
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
