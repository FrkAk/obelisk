"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions } from "@/lib/ui/animations";

interface GlassButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "minimal";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const sizeStyles = {
  sm: {
    padding: "px-3 py-1.5",
    fontSize: "text-[13px]",
    radius: "rounded-lg",
  },
  md: {
    padding: "px-4 py-2.5",
    fontSize: "text-[15px]",
    radius: "rounded-xl",
  },
  lg: {
    padding: "px-5 py-3",
    fontSize: "text-[17px]",
    radius: "rounded-2xl",
  },
};

/**
 * Premium glassmorphic button with soft gradient styling and micro-interactions.
 *
 * Args:
 *     children: Button content.
 *     variant: Visual style (primary, secondary, ghost, minimal).
 *     size: Size variant (sm, md, lg).
 *     fullWidth: Expand to fill container width.
 *     disabled: Whether button is disabled.
 *     onClick: Click handler.
 */
export function GlassButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  onClick,
  type = "button",
}: GlassButtonProps) {
  const sizeConfig = sizeStyles[size];

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #FF7A5C 0%, #E5593B 100%)",
      color: "white",
      boxShadow: disabled
        ? "none"
        : "0 4px 12px rgba(255, 107, 74, 0.25), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
    },
    secondary: {
      background: "var(--glass-bg-thin)",
      backdropFilter: "blur(8px)",
      color: "#FF6B4A",
      boxShadow: disabled
        ? "none"
        : "0 2px 6px rgba(0, 0, 0, 0.05), inset 0 0.5px 0 var(--glass-border-highlight)",
      border: "1px solid var(--glass-border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--foreground)",
    },
    minimal: {
      background: "var(--glass-bg-thin)",
      backdropFilter: "blur(8px)",
      color: "var(--foreground)",
      boxShadow: disabled
        ? "none"
        : "0 1px 4px rgba(0, 0, 0, 0.04)",
      border: "1px solid var(--glass-border)",
    },
  };

  return (
    <motion.button
      type={type}
      className={clsx(
        "font-semibold transition-colors duration-200 outline-none",
        sizeConfig.padding,
        sizeConfig.fontSize,
        sizeConfig.radius,
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={variantStyles[variant]}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      transition={springTransitions.quick}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
