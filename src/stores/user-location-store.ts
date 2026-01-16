import { create } from "zustand";

type TrackingMode = "off" | "follow" | "followWithHeading";

interface UserLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  trackingMode: TrackingMode;
  isWatching: boolean;
  setPosition: (lat: number, lon: number, accuracy?: number, heading?: number | null) => void;
  setTrackingMode: (mode: TrackingMode) => void;
  cycleTrackingMode: () => void;
  setIsWatching: (watching: boolean) => void;
  clearPosition: () => void;
}

/**
 * Store for managing user location state and tracking mode.
 *
 * Returns:
 *     Zustand store with location state and control functions.
 */
export const useUserLocationStore = create<UserLocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  accuracy: null,
  heading: null,
  trackingMode: "off",
  isWatching: false,

  setPosition: (lat, lon, accuracy, heading) =>
    set({
      latitude: lat,
      longitude: lon,
      accuracy: accuracy ?? null,
      heading: heading ?? null,
    }),

  setTrackingMode: (mode) => set({ trackingMode: mode }),

  cycleTrackingMode: () => {
    const current = get().trackingMode;
    const next: TrackingMode =
      current === "off"
        ? "follow"
        : current === "follow"
          ? "followWithHeading"
          : "off";
    set({ trackingMode: next });
  },

  setIsWatching: (watching) => set({ isWatching: watching }),

  clearPosition: () =>
    set({
      latitude: null,
      longitude: null,
      accuracy: null,
      heading: null,
    }),
}));
