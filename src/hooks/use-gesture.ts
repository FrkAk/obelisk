"use client";

import { useCallback, useRef, useMemo } from "react";

type Direction = "up" | "down" | "left" | "right";

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  direction: Direction | null;
  isActive: boolean;
}

interface SwipeConfig {
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
  axis?: "x" | "y" | "both";
}

const DEFAULT_CONFIG: Required<SwipeConfig> = {
  threshold: 50,
  velocityThreshold: 0.3,
  preventScroll: false,
  axis: "both",
};

interface UseGestureHandlers {
  onSwipe?: (direction: Direction, velocity: number) => void;
  onDragStart?: (state: GestureState) => void;
  onDrag?: (state: GestureState) => void;
  onDragEnd?: (state: GestureState) => void;
}

interface UseGestureReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
  };
  state: GestureState;
}

/**
 * Unified swipe/drag gesture handling with velocity detection.
 *
 * Args:
 *     callbacks: Object containing gesture event handlers.
 *     config: Configuration for swipe detection thresholds and behavior.
 *
 * Returns:
 *     Object with event handlers to spread on the target element and current state.
 *
 * Example:
 *     const { handlers } = useGesture({
 *       onSwipe: (dir, vel) => console.log(`Swiped ${dir}`),
 *       onDrag: (state) => setOffset(state.deltaY),
 *     });
 *     return <div {...handlers}>Drag me</div>;
 */
export function useGesture(
  callbacks: UseGestureHandlers,
  config: SwipeConfig = {}
): UseGestureReturn {
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.threshold, config.velocityThreshold, config.preventScroll, config.axis]
  );

  const stateRef = useRef<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
    direction: null,
    isActive: false,
  });

  const lastPositionRef = useRef({ x: 0, y: 0, time: 0 });
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const updateVelocity = useCallback((currentX: number, currentY: number) => {
    const now = performance.now();
    const last = lastPositionRef.current;
    const dt = now - last.time;

    if (dt > 0) {
      stateRef.current.velocityX = (currentX - last.x) / dt;
      stateRef.current.velocityY = (currentY - last.y) / dt;
    }

    lastPositionRef.current = { x: currentX, y: currentY, time: now };
  }, []);

  const getDirection = useCallback(
    (deltaX: number, deltaY: number): Direction | null => {
      const { axis, threshold } = mergedConfig;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (axis === "x" && absX > threshold) {
        return deltaX > 0 ? "right" : "left";
      }

      if (axis === "y" && absY > threshold) {
        return deltaY > 0 ? "down" : "up";
      }

      if (axis === "both") {
        if (absX > absY && absX > threshold) {
          return deltaX > 0 ? "right" : "left";
        }
        if (absY > absX && absY > threshold) {
          return deltaY > 0 ? "down" : "up";
        }
      }

      return null;
    },
    [mergedConfig]
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      const state = stateRef.current;
      state.startX = clientX;
      state.startY = clientY;
      state.currentX = clientX;
      state.currentY = clientY;
      state.deltaX = 0;
      state.deltaY = 0;
      state.velocityX = 0;
      state.velocityY = 0;
      state.direction = null;
      state.isActive = true;

      lastPositionRef.current = { x: clientX, y: clientY, time: performance.now() };

      callbacksRef.current.onDragStart?.({ ...state });
    },
    []
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number, e?: React.TouchEvent) => {
      const state = stateRef.current;
      if (!state.isActive) return;

      state.currentX = clientX;
      state.currentY = clientY;
      state.deltaX = clientX - state.startX;
      state.deltaY = clientY - state.startY;

      updateVelocity(clientX, clientY);
      state.direction = getDirection(state.deltaX, state.deltaY);

      if (mergedConfig.preventScroll && e) {
        const { axis } = mergedConfig;
        const shouldPrevent =
          (axis === "y" && Math.abs(state.deltaY) > 10) ||
          (axis === "x" && Math.abs(state.deltaX) > 10) ||
          (axis === "both" && (Math.abs(state.deltaX) > 10 || Math.abs(state.deltaY) > 10));

        if (shouldPrevent) {
          e.preventDefault();
        }
      }

      callbacksRef.current.onDrag?.({ ...state });
    },
    [updateVelocity, getDirection, mergedConfig]
  );

  const handleEnd = useCallback(() => {
    const state = stateRef.current;
    if (!state.isActive) return;

    state.isActive = false;

    const { velocityThreshold } = mergedConfig;
    const velocity = Math.max(Math.abs(state.velocityX), Math.abs(state.velocityY));
    const direction = state.direction;

    if (direction && velocity > velocityThreshold) {
      callbacksRef.current.onSwipe?.(direction, velocity);
    }

    callbacksRef.current.onDragEnd?.({ ...state });
  }, [mergedConfig]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, e);
    },
    [handleMove]
  );

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        handleMove(moveEvent.clientX, moveEvent.clientY);
      };

      const handleMouseUp = () => {
        handleEnd();
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleStart, handleMove, handleEnd]
  );

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
    },
    state: stateRef.current,
  };
}

export type { GestureState, SwipeConfig, Direction, UseGestureHandlers, UseGestureReturn };
