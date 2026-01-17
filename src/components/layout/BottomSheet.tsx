"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import { clsx } from "clsx";
import { springTransitions, overlayVariants } from "@/lib/ui/animations";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
}

const DEFAULT_SNAP_POINTS = [0.25, 0.5, 0.9];

/**
 * Apple Maps-style bottom sheet with spring physics and snap points.
 *
 * Args:
 *     isOpen: Whether the sheet is visible.
 *     onClose: Callback when sheet should close.
 *     children: Content to render inside the sheet.
 *     snapPoints: Array of height percentages (0-1) for snap positions.
 *     initialSnap: Index of the initial snap point.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  initialSnap = 1,
}: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [containerHeight, setContainerHeight] = useState(0);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      setContainerHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
    }
  }, [isOpen, initialSnap]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    const currentY = containerHeight * (1 - snapPoints[currentSnap]);

    if (velocity > 500 || (offset > 100 && velocity > 0)) {
      if (currentSnap === 0) {
        onClose();
      } else {
        setCurrentSnap(Math.max(0, currentSnap - 1));
      }
    } else if (velocity < -500 || (offset < -100 && velocity < 0)) {
      setCurrentSnap(Math.min(snapPoints.length - 1, currentSnap + 1));
    } else {
      const newY = currentY + offset;
      const newSnapIndex = snapPoints.reduce((prev, curr, index) => {
        const prevDiff = Math.abs(containerHeight * (1 - snapPoints[prev]) - newY);
        const currDiff = Math.abs(containerHeight * (1 - curr) - newY);
        return currDiff < prevDiff ? index : prev;
      }, 0);
      setCurrentSnap(newSnapIndex);
    }
  };

  const sheetHeight = containerHeight * snapPoints[currentSnap];
  const elevationLevel = currentSnap / (snapPoints.length - 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${0.2 + elevationLevel * 0.15})`,
            }}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            ref={containerRef}
            className={clsx(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-[var(--glass-bg-thick)] backdrop-blur-[40px]",
              "rounded-t-[20px] overflow-hidden",
              "border border-[var(--glass-border)]",
              "border-t-[var(--glass-border-highlight)]"
            )}
            style={{
              boxShadow: isDragging
                ? "0 -8px 32px rgba(0, 0, 0, 0.2), 0 -2px 8px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 var(--glass-border-highlight)"
                : `0 -${4 + elevationLevel * 8}px ${16 + elevationLevel * 24}px rgba(0, 0, 0, ${0.1 + elevationLevel * 0.1}), inset 0 0.5px 0 var(--glass-border-highlight)`,
            }}
            initial={{ y: containerHeight }}
            animate={{ height: sheetHeight, y: 0 }}
            exit={{ y: containerHeight }}
            transition={springTransitions.smooth}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex justify-center pt-2 pb-1.5 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <motion.div
                className={clsx(
                  "w-9 h-[5px] rounded-full",
                  "bg-[#787880]/40 dark:bg-[#787880]/60"
                )}
                whileHover={{ scaleX: 1.1 }}
                whileTap={{ scaleX: 0.95 }}
                transition={springTransitions.snappy}
              />
            </div>

            <div
              className="overflow-y-auto px-4 pb-safe overscroll-contain"
              style={{ height: `calc(100% - 28px)` }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
