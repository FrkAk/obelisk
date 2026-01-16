"use client";

import { MapPin, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

interface StoryCardProps {
  poiId: string;
  className?: string;
}

export function StoryCard({ poiId, className }: StoryCardProps) {
  const utils = trpc.useUtils();

  const { data: poi, isLoading: poiLoading } = trpc.poi.getById.useQuery({
    id: poiId,
  });

  const { data: storyData, isLoading: storyLoading } = trpc.poi.getStory.useQuery(
    { poiId, storyType: "discovery" },
    { enabled: !!poi }
  );

  const { data: savedData } = trpc.poi.isSaved.useQuery(
    { poiId },
    { enabled: !!poi }
  );

  const saveMutation = trpc.poi.save.useMutation({
    onSuccess: () => {
      utils.poi.isSaved.invalidate({ poiId });
    },
  });

  const isLoading = poiLoading || storyLoading;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!poi || !storyData) {
    return null;
  }

  const handleSave = () => {
    saveMutation.mutate({ poiId });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            <span>{poi.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {poi.categories?.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>
        <CardTitle className="text-lg">{storyData.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed mb-4">
          {storyData.content}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {savedData?.saved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          {poi.wikipediaUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={poi.wikipediaUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Learn More
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
