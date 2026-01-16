import { create } from "zustand";

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  remarkId?: string;
  stopId?: string;
}

interface AudioState {
  currentTrack: AudioTrack | null;
  queue: AudioTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  setCurrentTrack: (track: AudioTrack | null) => void;
  setQueue: (queue: AudioTrack[]) => void;
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,

  setCurrentTrack: (track) => set({ currentTrack: track, currentTime: 0 }),

  setQueue: (queue) => set({ queue }),

  addToQueue: (track) =>
    set((state) => ({
      queue: [...state.queue, track],
    })),

  removeFromQueue: (trackId) =>
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== trackId),
    })),

  clearQueue: () => set({ queue: [], currentTrack: null, isPlaying: false }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1 || currentIndex === queue.length - 1) {
      set({ currentTrack: null, isPlaying: false });
      return;
    }

    set({ currentTrack: queue[currentIndex + 1], currentTime: 0 });
  },

  previous: () => {
    const { queue, currentTrack, currentTime } = get();
    if (!currentTrack) return;

    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex <= 0) {
      set({ currentTime: 0 });
      return;
    }

    set({ currentTrack: queue[currentIndex - 1], currentTime: 0 });
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
}));
