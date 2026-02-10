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

const DEFAULT_SNAP_POINTS = [0.35, 0.55, 0.85];

/**
 * Apple Maps-style bottom sheet with liquid glass and spring physics.
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
  initialSnap = 0,
}: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [containerHeight, setContainerHeight] = useState(0);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen && !prevIsOpen) {
    setCurrentSnap(initialSnap);
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  useEffect(() => {
    const updateHeight = () => {
      setContainerHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

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
              backgroundColor: `rgba(0, 0, 0, ${0.04 + elevationLevel * 0.04})`,
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
              "glass-liquid rounded-t-[28px] overflow-hidden"
            )}
            style={{
              boxShadow: isDragging
                ? "0 -12px 40px rgba(0, 0, 0, 0.15), 0 -4px 12px rgba(0, 0, 0, 0.08)"
                : `0 -${6 + elevationLevel * 6}px ${20 + elevationLevel * 20}px rgba(0, 0, 0, ${0.08 + elevationLevel * 0.06})`,
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
              className="flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <motion.div
                className="w-10 h-[5px] rounded-full"
                style={{
                  background: "linear-gradient(180deg, rgba(120, 120, 128, 0.4) 0%, rgba(120, 120, 128, 0.3) 100%)",
                }}
                whileHover={{ scaleX: 1.1 }}
                whileTap={{ scaleX: 0.95 }}
                transition={springTransitions.snappy}
              />
            </div>

            <div
              className="overflow-y-auto px-4 pb-safe overscroll-contain"
              style={{ height: `calc(100% - 32px)` }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
