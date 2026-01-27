"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGeolocation } from "./useGeolocation";
import { haversineDistance } from "@/lib/geo/distance";
import type { Remark, Poi, GeofenceConfig } from "@/types";
import { DEFAULT_GEOFENCE_CONFIG } from "@/types";

interface GeofenceState {
  triggeredRemark: (Remark & { poi: Poi }) | null;
  preloadedRemarks: (Remark & { poi: Poi })[];
  queuedRemarks: (Remark & { poi: Poi })[];
}

interface NotificationHistory {
  remarkId: string;
  timestamp: number;
}

export function useGeofence(
  remarks: (Remark & { poi: Poi })[],
  config: GeofenceConfig = DEFAULT_GEOFENCE_CONFIG
) {
  const { location } = useGeolocation();
  const [state, setState] = useState<GeofenceState>({
    triggeredRemark: null,
    preloadedRemarks: [],
    queuedRemarks: [],
  });

  const notificationHistoryRef = useRef<NotificationHistory[]>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const lastTriggerTimeRef = useRef<number>(0);
  const dismissedRemarksRef = useRef<Set<string>>(new Set());
  const triggeredRemarkIdRef = useRef<string | null>(null);

  const cleanupOldHistory = useCallback(() => {
    const now = Date.now();
    notificationHistoryRef.current = notificationHistoryRef.current.filter(
      (entry) => now - entry.timestamp < config.sessionDurationMs
    );

    if (now - sessionStartRef.current > config.sessionDurationMs) {
      sessionStartRef.current = now;
      notificationHistoryRef.current = [];
      dismissedRemarksRef.current.clear();
    }
  }, [config.sessionDurationMs]);

  const canTriggerNotification = useCallback(
    (remarkId: string): boolean => {
      cleanupOldHistory();
      const now = Date.now();

      if (now - lastTriggerTimeRef.current < config.cooldownMs) {
        return false;
      }

      if (dismissedRemarksRef.current.has(remarkId)) {
        return false;
      }

      const sessionNotifications = notificationHistoryRef.current.length;
      if (sessionNotifications >= config.maxNotificationsPerSession) {
        return false;
      }

      const alreadyNotified = notificationHistoryRef.current.some(
        (entry) => entry.remarkId === remarkId
      );
      if (alreadyNotified) {
        return false;
      }

      return true;
    },
    [cleanupOldHistory, config.cooldownMs, config.maxNotificationsPerSession]
  );

  const recordNotification = useCallback((remarkId: string) => {
    const now = Date.now();
    notificationHistoryRef.current.push({ remarkId, timestamp: now });
    lastTriggerTimeRef.current = now;
  }, []);

  const dismissNotification = useCallback(() => {
    if (triggeredRemarkIdRef.current) {
      dismissedRemarksRef.current.add(triggeredRemarkIdRef.current);
    }
    triggeredRemarkIdRef.current = null;
    setState((prev) => ({ ...prev, triggeredRemark: null }));
  }, []);

  useEffect(() => {
    if (!location || remarks.length === 0) return;

    const remarksWithDistance = remarks.map((remark) => ({
      ...remark,
      distance: haversineDistance(
        location.latitude,
        location.longitude,
        remark.poi.latitude,
        remark.poi.longitude
      ),
    }));

    const preloaded = remarksWithDistance
      .filter((r) => r.distance <= config.preloadRadius)
      .sort((a, b) => a.distance - b.distance);

    const queued = preloaded.filter((r) => r.distance <= config.queueRadius);

    const triggerCandidates = queued.filter(
      (r) => r.distance <= config.triggerRadius && canTriggerNotification(r.id)
    );

    if (triggerCandidates.length > 0 && !triggeredRemarkIdRef.current) {
      const closest = triggerCandidates[0];
      recordNotification(closest.id);
      triggeredRemarkIdRef.current = closest.id;
      setState({
        triggeredRemark: closest,
        preloadedRemarks: preloaded,
        queuedRemarks: queued,
      });
    } else {
      setState((prev) => {
        if (
          prev.preloadedRemarks.length === preloaded.length &&
          prev.queuedRemarks.length === queued.length
        ) {
          return prev;
        }
        return {
          ...prev,
          preloadedRemarks: preloaded,
          queuedRemarks: queued,
        };
      });
    }
  }, [
    location,
    remarks,
    config.preloadRadius,
    config.queueRadius,
    config.triggerRadius,
    canTriggerNotification,
    recordNotification,
  ]);

  return {
    ...state,
    dismissNotification,
    location,
  };
}
