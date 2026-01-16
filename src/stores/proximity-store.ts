import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NearbyPoi {
  id: string;
  name: string;
  longitude: string;
  latitude: string;
  categories: string[] | null;
  distanceMeters: number;
  story: {
    id: string;
    title: string;
    teaser: string;
  } | null;
}

interface ProximityState {
  discoveryEnabled: boolean;
  currentNotification: NearbyPoi | null;
  shownPoiIds: Set<string>;
  poiCooldowns: Map<string, number>;
  lastQueryTime: number;
  setDiscoveryEnabled: (enabled: boolean) => void;
  setCurrentNotification: (poi: NearbyPoi | null) => void;
  markPoiShown: (poiId: string) => void;
  isPoiOnCooldown: (poiId: string) => boolean;
  clearShownPois: () => void;
  canQuery: () => boolean;
  recordQuery: () => void;
}

const COOLDOWN_DURATION_MS = 30 * 60 * 1000;
const QUERY_THROTTLE_MS = 10 * 1000;

export const useProximityStore = create<ProximityState>()(
  persist(
    (set, get) => ({
      discoveryEnabled: true,
      currentNotification: null,
      shownPoiIds: new Set<string>(),
      poiCooldowns: new Map<string, number>(),
      lastQueryTime: 0,

      setDiscoveryEnabled: (enabled) => set({ discoveryEnabled: enabled }),

      setCurrentNotification: (poi) => set({ currentNotification: poi }),

      markPoiShown: (poiId) => {
        const state = get();
        const newShownIds = new Set(state.shownPoiIds);
        newShownIds.add(poiId);

        const newCooldowns = new Map(state.poiCooldowns);
        newCooldowns.set(poiId, Date.now());

        set({ shownPoiIds: newShownIds, poiCooldowns: newCooldowns });
      },

      isPoiOnCooldown: (poiId) => {
        const cooldowns = get().poiCooldowns;
        const lastShown = cooldowns.get(poiId);
        if (!lastShown) return false;
        return Date.now() - lastShown < COOLDOWN_DURATION_MS;
      },

      clearShownPois: () =>
        set({
          shownPoiIds: new Set<string>(),
          poiCooldowns: new Map<string, number>(),
        }),

      canQuery: () => {
        const lastQuery = get().lastQueryTime;
        return Date.now() - lastQuery >= QUERY_THROTTLE_MS;
      },

      recordQuery: () => set({ lastQueryTime: Date.now() }),
    }),
    {
      name: "proximity-storage",
      partialize: (state) => ({
        discoveryEnabled: state.discoveryEnabled,
        shownPoiIds: Array.from(state.shownPoiIds),
        poiCooldowns: Array.from(state.poiCooldowns.entries()),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as {
          discoveryEnabled?: boolean;
          shownPoiIds?: string[];
          poiCooldowns?: [string, number][];
        };
        return {
          ...current,
          discoveryEnabled: persistedState?.discoveryEnabled ?? true,
          shownPoiIds: new Set(persistedState?.shownPoiIds ?? []),
          poiCooldowns: new Map(persistedState?.poiCooldowns ?? []),
        };
      },
    }
  )
);
