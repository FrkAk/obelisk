"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface RemarkRatingProps {
  remarkId: string;
  showCount?: boolean;
  interactive?: boolean;
  className?: string;
}

export function RemarkRating({
  remarkId,
  showCount = true,
  interactive = true,
  className,
}: RemarkRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: averageData } = trpc.remark.getAverageRating.useQuery({ remarkId });
  const { data: userRatingData } = trpc.remark.getUserRating.useQuery(
    { remarkId },
    { enabled: interactive }
  );

  const rateMutation = trpc.remark.rate.useMutation({
    onSuccess: () => {
      utils.remark.getAverageRating.invalidate({ remarkId });
      utils.remark.getUserRating.invalidate({ remarkId });
    },
  });

  const averageRating = averageData?.average ?? 0;
  const ratingCount = averageData?.count ?? 0;
  const userRating = userRatingData?.rating ?? null;

  const displayRating = hoveredStar ?? userRating ?? Math.round(averageRating);

  const handleRate = (rating: number) => {
    if (!interactive) return;
    rateMutation.mutate({ remarkId, rating });
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            disabled={!interactive || rateMutation.isPending}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => handleRate(star)}
          >
            <Star
              className={cn(
                "h-4 w-4",
                star <= displayRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          </Button>
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {averageRating > 0 ? averageRating.toFixed(1) : "—"} ({ratingCount})
        </span>
      )}
    </div>
  );
}
