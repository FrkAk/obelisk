"use client";

import { type ReactNode } from "react";
import { clsx } from "clsx";

interface GlassPillProps {
  children: ReactNode;
  icon?: ReactNode;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GlassPill({
  children,
  icon,
  color,
  active = false,
  onClick,
  className,
}: GlassPillProps) {
  const Component = onClick ? "button" : "span";

  return (
    <Component
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        "transition-all duration-200",
        active
          ? "bg-coral text-white dark:bg-coral-dark"
          : "glass hover:bg-black/5 dark:hover:bg-white/5",
        onClick && "cursor-pointer active:scale-[0.96]",
        className
      )}
      onClick={onClick}
      style={color && !active ? { color } : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </Component>
  );
}
