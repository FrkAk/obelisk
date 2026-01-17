"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variantClasses = {
  primary: "bg-coral text-white hover:bg-coral/90 dark:bg-coral-dark",
  secondary: "glass text-coral dark:text-coral-dark",
  ghost: "bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-base rounded-xl",
  lg: "px-6 py-3 text-lg rounded-2xl",
};

export function GlassButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={clsx(
        "font-medium transition-all duration-200",
        "active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
