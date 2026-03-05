"use client";

import { memo } from "react";
import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { springTransitions } from "@/lib/ui/animations";

interface SearchPinProps {
  latitude: number;
  longitude: number;
}

/**
 * Animated teardrop pin marker shown at a search result location.
 *
 * @param latitude - Pin latitude.
 * @param longitude - Pin longitude.
 */
export const SearchPin = memo(function SearchPin({
  latitude,
  longitude,
}: SearchPinProps) {
  return (
    <Marker latitude={latitude} longitude={longitude} anchor="bottom">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={springTransitions.pinDrop}
      >
        <div
          style={{
            width: 28,
            height: 28,
            backgroundColor: "var(--accent)",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              backgroundColor: "white",
              borderRadius: "50%",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </motion.div>
    </Marker>
  );
});
