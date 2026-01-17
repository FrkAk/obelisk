import { create } from "zustand";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants/map";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface SelectedPoi {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  categories: string[] | null;
  description?: string;
  address?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
  imageUrl?: string;
}

interface MapState {
  viewState: ViewState;
  setViewState: (viewState: ViewState) => void;
  flyTo: ((longitude: number, latitude: number, zoom?: number) => void) | null;
  selectedPoi: SelectedPoi | null;
  setSelectedPoi: (poi: SelectedPoi | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewState: {
    longitude: DEFAULT_MAP_CENTER.longitude,
    latitude: DEFAULT_MAP_CENTER.latitude,
    zoom: DEFAULT_MAP_ZOOM,
    pitch: 0,
    bearing: 0,
  },
  setViewState: (viewState) => set({ viewState }),
  flyTo: null,
  selectedPoi: null,
  setSelectedPoi: (poi) => set({ selectedPoi: poi }),
}));
