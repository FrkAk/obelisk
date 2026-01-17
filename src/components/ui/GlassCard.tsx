"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions, cardVariants } from "@/lib/ui/animations";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl" | "2xl";
  variant?: "regular" | "thin" | "thick";
  onClick?: () => void;
  interactive?: boolean;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const radiusClasses = {
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-[20px]",
  "2xl": "rounded-3xl",
};

const variantClasses = {
  regular: "glass",
  thin: "glass-thin",
  thick: "glass-thick",
};

/**
 * Premium glassmorphic card with depth and micro-interactions.
 *
 * Args:
 *     children: Content to render inside the card.
 *     padding: Padding size (none, sm, md, lg).
 *     radius: Border radius size (md, lg, xl, 2xl).
 *     variant: Glass intensity (regular, thin, thick).
 *     onClick: Optional click handler.
 *     interactive: Enable hover/press animations without onClick.
 */
export function GlassCard({
  children,
  className,
  padding = "md",
  radius = "xl",
  variant = "regular",
  onClick,
  interactive = false,
}: GlassCardProps) {
  const isInteractive = onClick !== undefined || interactive;

  const cardContent = (
    <div
      className={clsx(
        variantClasses[variant],
        paddingClasses[padding],
        radiusClasses[radius],
        className
      )}
    >
      {children}
    </div>
  );

  if (isInteractive) {
    return (
      <motion.div
        className={clsx(
          onClick && "cursor-pointer",
          "outline-none"
        )}
        variants={cardVariants}
        initial="idle"
        whileHover="hover"
        whileTap="pressed"
        transition={springTransitions.snappy}
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
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
