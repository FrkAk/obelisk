"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import { clsx } from "clsx";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
}

const DEFAULT_SNAP_POINTS = [0.25, 0.5, 0.9];

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

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            ref={containerRef}
            className={clsx(
              "fixed bottom-0 left-0 right-0 z-50",
              "glass glass-heavy rounded-t-3xl overflow-hidden"
            )}
            initial={{ y: containerHeight }}
            animate={{ height: sheetHeight, y: 0 }}
            exit={{ y: containerHeight }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-9 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <div
              className="overflow-y-auto px-4 pb-safe"
              style={{ height: `calc(100% - 24px)` }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
