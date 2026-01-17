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
} as const;

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  pressed: { scale: 0.97 },
  hover: { scale: 1.02 },
};

export const pinVariants: Variants = {
  initial: {
    scale: 0.6,
    opacity: 0,
    y: -30,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: springTransitions.bouncy,
  },
  selected: {
    scale: 1.15,
    transition: springTransitions.bouncy,
  },
  hover: {
    scale: 1.1,
    transition: springTransitions.snappy,
  },
};

export const sheetVariants: Variants = {
  hidden: {
    y: "100%",
    opacity: 0.5,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springTransitions.smooth,
  },
  exit: {
    y: "100%",
    opacity: 0.5,
    transition: { ...springTransitions.smooth, duration: 0.2 },
  },
};

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

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransitions.smooth,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.15 },
  },
};

export const discoverButtonVariants: Variants = {
  idle: {
    scale: 1,
  },
  pressed: {
    scale: 0.95,
    transition: springTransitions.quick,
  },
  hover: {
    scale: 1.05,
    transition: springTransitions.snappy,
  },
};
