"use client";

import { type ReactNode } from "react";
import { clsx } from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl";
  onClick?: () => void;
}

const paddingClasses = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const radiusClasses = {
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
};

export function GlassCard({
  children,
  className,
  padding = "md",
  radius = "lg",
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={clsx(
        "glass",
        paddingClasses[padding],
        radiusClasses[radius],
        onClick && "cursor-pointer transition-transform active:scale-[0.98]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}
