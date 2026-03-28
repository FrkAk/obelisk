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
      background: "var(--accent)",
      color: "white",
      fontFamily: "var(--font-ui)",
      boxShadow: disabled
        ? "none"
        : "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    secondary: {
      background: "transparent",
      color: "var(--accent)",
      fontFamily: "var(--font-ui)",
      border: "1px solid var(--accent)",
    },
    ghost: {
      background: "transparent",
      color: "var(--foreground)",
      fontFamily: "var(--font-ui)",
    },
    minimal: {
      background: "var(--glass-bg-thin)",
      backdropFilter: "blur(8px)",
      color: "var(--foreground)",
      fontFamily: "var(--font-ui)",
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
      whileHover={!disabled ? { scale: 1.005 } : undefined}
      whileTap={!disabled ? { scale: 0.985 } : undefined}
      transition={springTransitions.quick}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
