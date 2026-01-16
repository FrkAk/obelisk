import { create } from "zustand";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface SelectedPoi {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  categories: string[] | null;
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
    longitude: 11.576,
    latitude: 48.137,
    zoom: 15,
    pitch: 0,
    bearing: 0,
  },
  setViewState: (viewState) => set({ viewState }),
  flyTo: null,
  selectedPoi: null,
  setSelectedPoi: (poi) => set({ selectedPoi: poi }),
}));
