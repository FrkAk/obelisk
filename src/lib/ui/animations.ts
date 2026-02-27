/**
 * iOS-style spring animation configurations for Framer Motion.
 *
 * These presets match Apple's HIG motion guidelines for responsive,
 * natural-feeling interactions.
 */

import type { Transition, Variants } from "framer-motion";

export const springTransitions = {
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 30,
  } as Transition,

  bouncy: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  } as Transition,

  smooth: {
    type: "spring",
    stiffness: 200,
    damping: 25,
  } as Transition,

  gentle: {
    type: "spring",
    stiffness: 150,
    damping: 20,
  } as Transition,

  quick: {
    type: "spring",
    stiffness: 500,
    damping: 35,
  } as Transition,

  liquid: {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 1.1,
  } as Transition,

  floatingEntry: {
    type: "spring",
    stiffness: 250,
    damping: 28,
    mass: 0.8,
  } as Transition,
} as const;

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const notificationVariants: Variants = {
  initial: {
    y: 100,
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springTransitions.bouncy,
  },
  exit: {
    y: 100,
    opacity: 0,
    scale: 0.95,
    transition: springTransitions.snappy,
  },
};

export const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  pressed: {
    scale: 0.98,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
    transition: springTransitions.quick,
  },
  hover: {
    scale: 1.01,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    transition: springTransitions.snappy,
  },
};

export const searchResultVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springTransitions.smooth, delay: Math.min(i, 10) * 0.04 },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
