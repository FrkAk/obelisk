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
  sm: "px-2 py-0.5 text-[12px] gap-1",
  md: "px-2.5 py-1 text-[13px] gap-1.5",
  lg: "px-3.5 py-1.5 text-[15px] gap-2",
};

/**
 * Glassmorphic pill/chip with optional accent color.
 *
 * Args:
 *     children: Content to display inside the pill.
 *     icon: Optional icon element to show before content.
 *     color: Accent color for text when inactive.
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

  const activeStyle: React.CSSProperties = {
    background: "var(--accent-subtle)",
    color: "var(--accent)",
  };

  const inactiveStyle: React.CSSProperties | undefined = color && !active
    ? { color }
    : undefined;

  const style = active ? activeStyle : inactiveStyle;

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
          !active && "glass-thin hover:bg-black/5 dark:hover:bg-white/5"
        )}
        style={style}
        onClick={onClick}
        whileTap={{ scale: 0.985 }}
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
        !active && "glass-thin"
      )}
      style={style}
    >
      {contentElement}
    </span>
  );
}
