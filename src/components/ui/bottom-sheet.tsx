"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type TouchEvent,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";

type SnapPoint = "peek" | "half" | "full";

interface SnapPointConfig {
  peek: number;
  half: number;
  full: number;
}

const DEFAULT_SNAP_POINTS: SnapPointConfig = {
  peek: 120,
  half: typeof window !== "undefined" ? window.innerHeight * 0.5 : 400,
  full: typeof window !== "undefined" ? window.innerHeight * 0.9 : 720,
};

const VELOCITY_THRESHOLD = 0.5;

interface BottomSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  initialSnap?: SnapPoint;
  snapPoints?: Partial<SnapPointConfig>;
  expandedHeader?: ReactNode;
  onSnapChange?: (snap: SnapPoint) => void;
  className?: string;
}

/**
 * iOS-style bottom sheet with drag gestures and snap points.
 *
 * Args:
 *     children: Content to render inside the sheet.
 *     isOpen: Whether the sheet is visible.
 *     onClose: Callback when sheet should close.
 *     initialSnap: Initial snap point position.
 *     snapPoints: Custom snap point heights.
 *     expandedHeader: Custom header shown when at full snap.
 *     onSnapChange: Callback when snap point changes.
 *     className: Additional CSS classes.
 *
 * Returns:
 *     React component rendering a draggable bottom sheet.
 */
export function BottomSheet({
  children,
  isOpen,
  onClose,
  initialSnap = "half",
  snapPoints: customSnapPoints,
  expandedHeader,
  onSnapChange,
  className,
}: BottomSheetProps) {
  const [currentHeight, setCurrentHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  const snapPointValues = useMemo(
    () => ({
      ...DEFAULT_SNAP_POINTS,
      ...customSnapPoints,
      half: typeof window !== "undefined" ? window.innerHeight * 0.5 : 400,
      full: typeof window !== "undefined" ? window.innerHeight * 0.9 : 720,
    }),
    [customSnapPoints]
  );

  const getSnapPointHeight = useCallback(
    (snap: SnapPoint) => snapPointValues[snap],
    [snapPointValues]
  );

  const snapToPoint = useCallback(
    (snap: SnapPoint) => {
      const targetHeight = getSnapPointHeight(snap);
      setCurrentHeight(targetHeight);
      setCurrentSnap(snap);
      onSnapChange?.(snap);
    },
    [getSnapPointHeight, onSnapChange]
  );

  const findNearestSnap = useCallback(
    (height: number, vel: number): SnapPoint => {
      const { peek, half, full } = snapPointValues;

      if (vel < -VELOCITY_THRESHOLD) {
        if (currentSnap === "full") return "half";
        if (currentSnap === "half") return "peek";
        return "peek";
      }

      if (vel > VELOCITY_THRESHOLD) {
        if (currentSnap === "peek") return "half";
        if (currentSnap === "half") return "full";
        return "full";
      }

      const distances: Record<SnapPoint, number> = {
        peek: Math.abs(height - peek),
        half: Math.abs(height - half),
        full: Math.abs(height - full),
      };

      const snapPoints: SnapPoint[] = ["peek", "half", "full"];
      return snapPoints.reduce((closest, current) =>
        distances[current] < distances[closest] ? current : closest
      );
    },
    [snapPointValues, currentSnap]
  );

  useEffect(() => {
    if (isOpen) {
      snapToPoint(initialSnap);
    } else {
      setCurrentHeight(0);
    }
  }, [isOpen, initialSnap, snapToPoint]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragStart = useCallback(
    (clientY: number) => {
      setIsDragging(true);
      dragStartY.current = clientY;
      dragStartHeight.current = currentHeight;
      lastY.current = clientY;
      lastTime.current = Date.now();
      velocity.current = 0;
    },
    [currentHeight]
  );

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = (lastY.current - clientY) / dt;
      }
      lastY.current = clientY;
      lastTime.current = now;

      const deltaY = dragStartY.current - clientY;
      const newHeight = Math.max(0, Math.min(snapPointValues.full, dragStartHeight.current + deltaY));
      setCurrentHeight(newHeight);
    },
    [isDragging, snapPointValues.full]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    if (currentHeight < snapPointValues.peek / 2) {
      onClose();
      return;
    }

    const nearestSnap = findNearestSnap(currentHeight, velocity.current);
    snapToPoint(nearestSnap);
  }, [isDragging, currentHeight, snapPointValues.peek, findNearestSnap, snapToPoint, onClose]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const backdropBlurIntensity = useMemo(() => {
    if (!isOpen || currentHeight <= snapPointValues.peek) return 0;
    const progress = (currentHeight - snapPointValues.peek) / (snapPointValues.full - snapPointValues.peek);
    return Math.min(progress * 8, 8);
  }, [isOpen, currentHeight, snapPointValues]);

  const backdropOpacity = useMemo(() => {
    if (!isOpen || currentHeight <= snapPointValues.peek) return 0;
    const progress = (currentHeight - snapPointValues.peek) / (snapPointValues.half - snapPointValues.peek);
    return Math.min(progress * 0.3, 0.3);
  }, [isOpen, currentHeight, snapPointValues]);

  const showExpandedHeader = currentSnap === "full" && expandedHeader;

  if (!isOpen && currentHeight === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          isOpen && currentHeight > snapPointValues.peek ? "" : "pointer-events-none"
        )}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
          backdropFilter: backdropBlurIntensity > 0 ? `blur(${backdropBlurIntensity}px)` : undefined,
          WebkitBackdropFilter: backdropBlurIntensity > 0 ? `blur(${backdropBlurIntensity}px)` : undefined,
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50",
          "glass-ultra rounded-t-3xl",
          "border-t border-white/20",
          "shadow-float",
          !isDragging && "transition-all duration-300",
          className
        )}
        style={{
          height: currentHeight,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transitionTimingFunction: isDragging ? "linear" : "var(--ease-spring)",
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-9 h-1 rounded-full bg-black/20 dark:bg-white/30" />
        </div>

        {/* Expanded Header */}
        {showExpandedHeader && (
          <div className="px-4 pb-2 animate-fade-scale-in">{expandedHeader}</div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </>
  );
}
