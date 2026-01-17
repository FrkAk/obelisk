"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  title: string;
  teaser: string;
  content: string;
  wasGenerated?: boolean;
}

interface StoryRevealCardProps {
  story: Story | undefined;
  isLoading: boolean;
  isRevealed: boolean;
  onReveal: () => void;
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-3 rounded-full animate-mystery-shimmer",
        className
      )}
    />
  );
}

function UnrevealedPlaceholder() {
  return (
    <div className="space-y-3">
      <ShimmerBar className="w-3/4" />
      <ShimmerBar className="w-full" />
      <ShimmerBar className="w-5/6" />
      <ShimmerBar className="w-2/3" />
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 bg-amber-200/30 dark:bg-amber-400/20 rounded w-3/4" />
      <div className="h-3 bg-amber-200/20 dark:bg-amber-400/15 rounded w-full" />
      <div className="h-3 bg-amber-200/20 dark:bg-amber-400/15 rounded w-5/6" />
      <div className="h-3 bg-amber-200/20 dark:bg-amber-400/15 rounded w-4/5" />
    </div>
  );
}

function RevealedContent({ story }: { story: Story }) {
  return (
    <div className="space-y-3 animate-fade-scale-in">
      <h3 className="text-base font-semibold text-foreground">
        {story.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {story.teaser}
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {story.content}
      </p>
    </div>
  );
}

/**
 * Story reveal card with branded "Obelisk Remarks" header.
 *
 * Args:
 *     story: The story data to display (if revealed).
 *     isLoading: Whether the story is currently loading.
 *     isRevealed: Whether the user has clicked to reveal.
 *     onReveal: Callback when user clicks reveal button.
 *
 * Returns:
 *     React component rendering the story reveal card.
 */
export function StoryRevealCard({
  story,
  isLoading,
  isRevealed,
  onReveal,
}: StoryRevealCardProps) {
  return (
    <div
      className={cn(
        "glass-gold rounded-2xl p-4",
        "border border-amber-200/30 dark:border-amber-400/20",
        "shadow-gold"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-amber-400/20 dark:bg-amber-400/30">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          Obelisk Remarks
        </span>
      </div>

      {/* Content */}
      {!isRevealed ? (
        <div className="space-y-4">
          <UnrevealedPlaceholder />
          <Button
            onClick={onReveal}
            className={cn(
              "w-full",
              "bg-amber-500 hover:bg-amber-600",
              "text-white font-medium",
              "shadow-md hover:shadow-lg",
              "transition-all duration-200"
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Reveal the Story
          </Button>
        </div>
      ) : isLoading ? (
        <LoadingPlaceholder />
      ) : story ? (
        <RevealedContent story={story} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No story available for this location yet.
        </p>
      )}
    </div>
  );
}
