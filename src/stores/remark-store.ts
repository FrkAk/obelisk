"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RemarkStop {
  id: string;
  longitude: string;
  latitude: string;
  title: string;
  description?: string;
  audioUrl?: string;
  images?: string[];
}

export interface RemarkFormData {
  title: string;
  description?: string;
  coverImageUrl?: string;
  centerLongitude?: string;
  centerLatitude?: string;
  categories: string[];
}

export type WizardStep = "basic-info" | "map-stops" | "stop-details" | "review";

interface RemarkState {
  currentStep: WizardStep;
  formData: RemarkFormData;
  stops: RemarkStop[];
  activeStopId: string | null;
  remarkId: string | null;
  isDirty: boolean;
}

interface RemarkActions {
  setCurrentStep: (step: WizardStep) => void;
  setFormData: (data: Partial<RemarkFormData>) => void;
  addStop: (stop: RemarkStop) => void;
  updateStop: (id: string, data: Partial<RemarkStop>) => void;
  removeStop: (id: string) => void;
  reorderStops: (stopIds: string[]) => void;
  setActiveStopId: (id: string | null) => void;
  setRemarkId: (id: string | null) => void;
  reset: () => void;
  setIsDirty: (dirty: boolean) => void;
}

const initialState: RemarkState = {
  currentStep: "basic-info",
  formData: {
    title: "",
    description: "",
    coverImageUrl: "",
    centerLongitude: "",
    centerLatitude: "",
    categories: [],
  },
  stops: [],
  activeStopId: null,
  remarkId: null,
  isDirty: false,
};

export const useRemarkStore = create<RemarkState & RemarkActions>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
          isDirty: true,
        })),

      addStop: (stop) =>
        set((state) => ({
          stops: [...state.stops, stop],
          isDirty: true,
        })),

      updateStop: (id, data) =>
        set((state) => ({
          stops: state.stops.map((stop) =>
            stop.id === id ? { ...stop, ...data } : stop
          ),
          isDirty: true,
        })),

      removeStop: (id) =>
        set((state) => ({
          stops: state.stops.filter((stop) => stop.id !== id),
          activeStopId: state.activeStopId === id ? null : state.activeStopId,
          isDirty: true,
        })),

      reorderStops: (stopIds) =>
        set((state) => {
          const stopMap = new Map(state.stops.map((s) => [s.id, s]));
          const reordered = stopIds
            .map((id) => stopMap.get(id))
            .filter((s): s is RemarkStop => s !== undefined);
          return { stops: reordered, isDirty: true };
        }),

      setActiveStopId: (id) => set({ activeStopId: id }),

      setRemarkId: (id) => set({ remarkId: id }),

      reset: () => set(initialState),

      setIsDirty: (dirty) => set({ isDirty: dirty }),
    }),
    {
      name: "remark-draft",
      partialize: (state) => ({
        formData: state.formData,
        stops: state.stops,
        remarkId: state.remarkId,
        currentStep: state.currentStep,
      }),
    }
  )
);
