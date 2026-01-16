"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

const DEFAULT_CONFIG: SpringConfig = {
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const PRESETS = {
  default: DEFAULT_CONFIG,
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  wobbly: { stiffness: 180, damping: 12, mass: 1 },
  stiff: { stiffness: 400, damping: 40, mass: 1 },
  slow: { stiffness: 100, damping: 25, mass: 1 },
} as const;

type PresetName = keyof typeof PRESETS;

interface SpringState {
  value: number;
  velocity: number;
}

interface UseSpringAnimationOptions {
  initialValue?: number;
  config?: Partial<SpringConfig> | PresetName;
  onRest?: () => void;
}

interface UseSpringAnimationReturn {
  value: number;
  isAnimating: boolean;
  set: (target: number, initialVelocity?: number) => void;
  stop: () => void;
  setImmediate: (value: number) => void;
}

/**
 * Spring physics hook for gesture-driven animations.
 *
 * Args:
 *     options: Configuration options including initial value, spring config, and callbacks.
 *
 * Returns:
 *     Object with current value, animation state, and control methods.
 *
 * Example:
 *     const { value, set, isAnimating } = useSpringAnimation({ initialValue: 0 });
 *     set(100); // Animates to 100 with spring physics
 */
export function useSpringAnimation(
  options: UseSpringAnimationOptions = {}
): UseSpringAnimationReturn {
  const { initialValue = 0, config = "default", onRest } = options;

  const springConfig: SpringConfig = useMemo(
    () => typeof config === "string" ? PRESETS[config] : { ...DEFAULT_CONFIG, ...config },
    [config]
  );

  const [state, setState] = useState<SpringState>({
    value: initialValue,
    velocity: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);

  const targetRef = useRef(initialValue);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const onRestRef = useRef(onRest);

  useEffect(() => {
    onRestRef.current = onRest;
  }, [onRest]);

  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.064);
      lastTimeRef.current = timestamp;

      setState((prev) => {
        const { stiffness, damping, mass } = springConfig;
        const target = targetRef.current;

        const springForce = stiffness * (target - prev.value);
        const dampingForce = damping * prev.velocity;
        const acceleration = (springForce - dampingForce) / mass;

        const newVelocity = prev.velocity + acceleration * deltaTime;
        const newValue = prev.value + newVelocity * deltaTime;

        const isAtRest =
          Math.abs(target - newValue) < 0.01 && Math.abs(newVelocity) < 0.01;

        if (isAtRest) {
          setIsAnimating(false);
          onRestRef.current?.();
          return { value: target, velocity: 0 };
        }

        return { value: newValue, velocity: newVelocity };
      });

      frameRef.current = requestAnimationFrame(animate);
    },
    [springConfig]
  );

  const set = useCallback(
    (target: number, initialVelocity?: number) => {
      targetRef.current = target;
      lastTimeRef.current = 0;

      if (initialVelocity !== undefined) {
        setState((prev) => ({ ...prev, velocity: initialVelocity }));
      }

      if (!isAnimating) {
        setIsAnimating(true);
        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [isAnimating, animate]
  );

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setIsAnimating(false);
    lastTimeRef.current = 0;
  }, []);

  const setImmediate = useCallback((value: number) => {
    stop();
    targetRef.current = value;
    setState({ value, velocity: 0 });
  }, [stop]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    value: state.value,
    isAnimating,
    set,
    stop,
    setImmediate,
  };
}

export { PRESETS as springPresets };
export type { SpringConfig, UseSpringAnimationOptions, UseSpringAnimationReturn };
