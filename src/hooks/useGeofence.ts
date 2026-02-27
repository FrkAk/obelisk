"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGeolocation } from "./useGeolocation";
import { haversineDistance } from "@/lib/geo/distance";
import type { Remark, GeofenceConfig, PoiWithCategory } from "@/types/api";
import { DEFAULT_GEOFENCE_CONFIG } from "@/types/api";

interface NotificationHistory {
  remarkId: string;
  timestamp: number;
}

export function useGeofence(
  remarks: (Remark & { poi: PoiWithCategory })[],
  config: GeofenceConfig = DEFAULT_GEOFENCE_CONFIG
) {
  const { location } = useGeolocation();
  const [triggeredRemark, setTriggeredRemark] = useState<
    (Remark & { poi: PoiWithCategory }) | null
  >(null);

  const notificationHistoryRef = useRef<NotificationHistory[]>([]);
  const sessionStartRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0);
  const dismissedRemarksRef = useRef<Set<string>>(new Set());
  const triggeredRemarkIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, []);

  const remarksWithDistance = useMemo(() => {
    if (!location || remarks.length === 0) return [];
    return remarks.map((remark) => ({
      ...remark,
      distance: haversineDistance(
        location.latitude,
        location.longitude,
        remark.poi.latitude,
        remark.poi.longitude
      ),
    }));
  }, [location, remarks]);

  const preloadedRemarks = useMemo(
    () =>
      remarksWithDistance
        .filter((r) => r.distance <= config.preloadRadius)
        .sort((a, b) => a.distance - b.distance),
    [remarksWithDistance, config.preloadRadius]
  );

  const queuedRemarks = useMemo(
    () => preloadedRemarks.filter((r) => r.distance <= config.queueRadius),
    [preloadedRemarks, config.queueRadius]
  );

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
    setTriggeredRemark(null);
  }, []);

  useEffect(() => {
    const triggerCandidates = queuedRemarks.filter(
      (r) => r.distance <= config.triggerRadius && canTriggerNotification(r.id)
    );

    if (triggerCandidates.length > 0 && !triggeredRemarkIdRef.current) {
      const closest = triggerCandidates[0];
      recordNotification(closest.id);
      triggeredRemarkIdRef.current = closest.id;
      queueMicrotask(() => setTriggeredRemark(closest));
    }
  }, [
    queuedRemarks,
    config.triggerRadius,
    canTriggerNotification,
    recordNotification,
  ]);

  return {
    triggeredRemark,
    preloadedRemarks,
    queuedRemarks,
    dismissNotification,
    location,
  };
}
