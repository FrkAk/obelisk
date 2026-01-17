"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";

interface GlassPillProps {
  children: ReactNode;
  icon?: ReactNode;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-2.5 py-1 text-[12px] gap-1",
  md: "px-3 py-1.5 text-[13px] gap-1.5",
  lg: "px-4 py-2 text-[15px] gap-2",
};

/**
 * Glassmorphic pill/chip component with optional gradient color accent.
 *
 * Args:
 *     children: Content to display inside the pill.
 *     icon: Optional icon element to show before content.
 *     color: Accent color for text or active background gradient.
 *     active: Whether pill is in active/selected state.
 *     onClick: Optional click handler (makes pill a button).
 *     size: Size variant (sm, md, lg).
 */
export function GlassPill({
  children,
  icon,
  color,
  active = false,
  onClick,
  className,
  size = "md",
}: GlassPillProps) {
  const baseStyles = clsx(
    "inline-flex items-center rounded-full font-medium",
    "transition-colors duration-200",
    sizeClasses[size],
    onClick && "cursor-pointer",
    className
  );

  const contentElement = (
    <>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </>
  );

  if (onClick) {
    return (
      <motion.button
        className={clsx(
          baseStyles,
          active
            ? "text-white"
            : "glass-thin hover:bg-black/5 dark:hover:bg-white/5"
        )}
        style={
          active && color
            ? {
                background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})`,
                boxShadow: `0 2px 8px ${color}40`,
              }
            : color && !active
              ? { color }
              : undefined
        }
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        transition={springTransitions.quick}
      >
        {contentElement}
      </motion.button>
    );
  }

  return (
    <span
      className={clsx(
        baseStyles,
        active
          ? "text-white"
          : "glass-thin"
      )}
      style={
        active && color
          ? {
              background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})`,
              boxShadow: `0 2px 8px ${color}40`,
            }
          : color && !active
            ? { color }
            : undefined
      }
    >
      {contentElement}
    </span>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
