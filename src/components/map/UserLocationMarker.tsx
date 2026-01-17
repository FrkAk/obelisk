"use client";

import { Marker } from "react-map-gl/maplibre";
import { motion } from "framer-motion";
import type { GeoLocation } from "@/types";
import { springTransitions } from "@/lib/ui/animations";

interface UserLocationMarkerProps {
  location: GeoLocation;
}

const LOCATION_BLUE = "#007AFF";

/**
 * Premium user location marker with three-ring design and heading indicator.
 *
 * Args:
 *     location: Current user geolocation with optional heading.
 */
export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <Marker
      latitude={location.latitude}
      longitude={location.longitude}
      anchor="center"
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            background: `radial-gradient(circle, ${LOCATION_BLUE}15 0%, transparent 70%)`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springTransitions.smooth}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: `${LOCATION_BLUE}20`,
          }}
          animate={{
            scale: [1, 2.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: [0, 0, 0.2, 1],
          }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: 24,
            height: 24,
            backgroundColor: `${LOCATION_BLUE}25`,
            border: `1.5px solid ${LOCATION_BLUE}40`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springTransitions.bouncy}
        />

        <motion.div
          className="relative rounded-full"
          style={{
            width: 14,
            height: 14,
            backgroundColor: LOCATION_BLUE,
            border: "2.5px solid white",
            boxShadow: `0 2px 8px ${LOCATION_BLUE}50, 0 1px 3px rgba(0, 0, 0, 0.2)`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springTransitions.bouncy, delay: 0.1 }}
        />

        {location.heading !== null && (
          <motion.div
            className="absolute"
            style={{
              width: 0,
              height: 0,
              top: -12,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderBottom: `10px solid ${LOCATION_BLUE}`,
              filter: `drop-shadow(0 1px 2px ${LOCATION_BLUE}40)`,
              transformOrigin: "center 19px",
              transform: `rotate(${location.heading}deg)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransitions.bouncy, delay: 0.2 }}
          />
        )}
      </div>
    </Marker>
  );
}
