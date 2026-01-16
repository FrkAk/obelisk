import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "pulse" | "shimmer";
}

/**
 * Skeleton loading placeholder component.
 *
 * Args:
 *     variant: Animation variant - "pulse" (default) or "shimmer".
 *     className: Additional CSS classes.
 *
 * Returns:
 *     React component rendering a skeleton placeholder.
 */
function Skeleton({ className, variant = "pulse", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === "pulse" && "animate-pulse",
        variant === "shimmer" && "relative overflow-hidden",
        className
      )}
      {...props}
    >
      {variant === "shimmer" && (
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  );
}

/**
 * Text skeleton for paragraph content.
 */
function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="shimmer"
          className="h-4 rounded-full"
          style={{
            width: i === lines - 1 ? "60%" : i % 2 === 0 ? "100%" : "85%",
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton for content cards.
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton variant="shimmer" className="h-32 w-full rounded-xl" />
      <Skeleton variant="shimmer" className="h-4 w-3/4 rounded-full" />
      <Skeleton variant="shimmer" className="h-4 w-1/2 rounded-full" />
    </div>
  );
}

/**
 * Search result skeleton.
 */
function SkeletonSearchResult({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      <Skeleton variant="shimmer" className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="shimmer" className="h-4 w-3/4 rounded-full" />
        <Skeleton variant="shimmer" className="h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Map loading skeleton.
 */
function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full h-full bg-muted",
        "flex items-center justify-center",
        className
      )}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-muted-foreground/10 animate-pulse" />
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonSearchResult, SkeletonMap };
