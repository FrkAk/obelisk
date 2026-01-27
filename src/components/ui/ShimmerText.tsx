"use client";

import { clsx } from "clsx";

interface ShimmerTextProps {
  lines?: number;
  className?: string;
}

const LINE_WIDTHS = ["100%", "85%", "70%", "90%"];

/**
 * Animated shimmer placeholder for loading text content.
 *
 * Args:
 *     lines: Number of placeholder lines to display (default 3).
 *     className: Additional CSS classes.
 */
export function ShimmerText({ lines = 3, className }: ShimmerTextProps) {
  return (
    <div className={clsx("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="shimmer-text h-4"
          style={{
            width: LINE_WIDTHS[index % LINE_WIDTHS.length],
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
