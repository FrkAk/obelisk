"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import { springTransitions, overlayVariants, sheetCornerRadius } from "@/lib/ui/animations";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
}

const DEFAULT_SNAP_POINTS = [0.35, 0.55, 0.85];

const BOTTOM_GAPS = [12, 4, 0];
const CORNER_RADII = [sheetCornerRadius.floating, sheetCornerRadius.mid, sheetCornerRadius.full];

/**
 * iOS 26 Apple Maps-style floating bottom sheet with progressive corner morphing.
 *
 * @param isOpen - Whether the sheet is visible.
 * @param onClose - Callback when sheet should close.
 * @param children - Content to render inside the sheet.
 * @param snapPoints - Array of height percentages (0-1) for snap positions.
 * @param initialSnap - Index of the initial snap point.
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

  /**
   * Determines the next snap point based on drag velocity and offset.
   *
   * @param _event - The pointer event (unused).
   * @param info - Drag info with velocity and offset.
   */
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
  const bottomGap = BOTTOM_GAPS[currentSnap] ?? 0;
  const cornerRadius = CORNER_RADII[currentSnap] ?? 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${0.04 + elevationLevel * 0.04})`,
              pointerEvents: "none",
            }}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          <motion.div
            ref={containerRef}
            className="fixed z-50 glass-liquid overflow-hidden"
            initial={{
              y: containerHeight,
              bottom: BOTTOM_GAPS[0],
              left: BOTTOM_GAPS[0],
              right: BOTTOM_GAPS[0],
              borderRadius: CORNER_RADII[0],
            }}
            animate={{
              height: sheetHeight,
              y: 0,
              bottom: bottomGap,
              left: bottomGap,
              right: bottomGap,
              borderRadius: cornerRadius,
            }}
            exit={{ y: containerHeight }}
            transition={springTransitions.liquid}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{
              boxShadow: isDragging
                ? "0 -12px 40px rgba(0, 0, 0, 0.15), 0 -4px 12px rgba(0, 0, 0, 0.08)"
                : "var(--shadow-sheet-current)",
            }}
          >
            <div
              className="flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <motion.div
                className="w-8 h-1 rounded-full"
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
              style={{ height: "calc(100% - 32px)" }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
