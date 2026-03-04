/**
 * Refined spring animation configurations for Framer Motion.
 *
 * Higher damping, weighted feel — not bouncy. Matches iOS 26 Liquid Glass motion.
 */

import type { Transition, Variants } from "framer-motion";

export const springTransitions = {
  /** Buttons, quick feedback. */
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 38,
  } as Transition,

  /** Content transitions, general movement. */
  smooth: {
    type: "spring",
    stiffness: 200,
    damping: 30,
  } as Transition,

  /** Entries, reveals, fade-ins. */
  gentle: {
    type: "spring",
    stiffness: 150,
    damping: 28,
  } as Transition,

  /** Sheet transitions, liquid glass morphing. */
  liquid: {
    type: "spring",
    stiffness: 180,
    damping: 28,
    mass: 1.1,
  } as Transition,

  /** Micro-interactions, immediate response. */
  quick: {
    type: "spring",
    stiffness: 500,
    damping: 40,
  } as Transition,

  /** Floating elements entering view. */
  floatingEntry: {
    type: "spring",
    stiffness: 250,
    damping: 32,
    mass: 0.8,
  } as Transition,

  /** Tab swipe / horizontal content transitions. */
  tabSwipe: {
    type: "spring",
    stiffness: 300,
    damping: 34,
  } as Transition,
} as const;

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const notificationVariants: Variants = {
  initial: {
    y: 80,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: springTransitions.smooth,
  },
  exit: {
    y: 80,
    opacity: 0,
    transition: springTransitions.snappy,
  },
};

export const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
  },
  pressed: {
    scale: 0.985,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: springTransitions.quick,
  },
  hover: {
    scale: 1.005,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    transition: springTransitions.snappy,
  },
};

export const searchResultVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.25, delay: Math.min(i, 8) * 0.04 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Sheet corner radius values for progressive morphing. */
export const sheetCornerRadius = {
  floating: 28,
  mid: 20,
  full: 0,
} as const;
