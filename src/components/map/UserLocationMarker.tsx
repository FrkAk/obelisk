"use client";

import { Marker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import type { GeoLocation } from "@/types/api";
import { springTransitions } from "@/lib/ui/animations";

interface UserLocationMarkerProps {
  location: GeoLocation;
}

const LOCATION_BLUE = "#007AFF";

/**
 * Apple-style user location marker with subtle pulse animation.
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
            width: 64,
            height: 64,
            background: `radial-gradient(circle, ${LOCATION_BLUE}12 0%, transparent 70%)`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springTransitions.smooth}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: 32,
            height: 32,
            backgroundColor: `${LOCATION_BLUE}15`,
          }}
          animate={{
            scale: [1, 2.2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: [0, 0, 0.2, 1],
          }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: 20,
            height: 20,
            backgroundColor: `${LOCATION_BLUE}20`,
            border: `1px solid ${LOCATION_BLUE}30`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springTransitions.bouncy}
        />

        <motion.div
          className="relative rounded-full"
          style={{
            width: 12,
            height: 12,
            backgroundColor: LOCATION_BLUE,
            border: "2px solid white",
            boxShadow: `0 2px 6px ${LOCATION_BLUE}50, 0 1px 2px rgba(0, 0, 0, 0.15)`,
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
              top: -10,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: `8px solid ${LOCATION_BLUE}`,
              filter: `drop-shadow(0 1px 2px ${LOCATION_BLUE}30)`,
              transformOrigin: "center 16px",
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
