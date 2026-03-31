import { create } from 'zustand';
import type { AdjustmentHistoryEntry, Palette } from '@/domain/models';

interface HistoryState {
  entries: AdjustmentHistoryEntry[];
  past: Palette[];
  future: Palette[];
  record: (previousPalette: Palette, nextPalette: Palette, entry: AdjustmentHistoryEntry) => void;
  undo: (currentPalette: Palette) => Palette | null;
  redo: (currentPalette: Palette) => Palette | null;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  past: [],
  future: [],
  record: (previousPalette, _nextPalette, entry) =>
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, 48),
      past: [...state.past, previousPalette].slice(-24),
      future: [],
    })),
  undo: (currentPalette) => {
    const state = get();
    const previous = state.past[state.past.length - 1];
    if (!previous) {
      return null;
    }

    set({
      past: state.past.slice(0, -1),
      future: [currentPalette, ...state.future].slice(0, 24),
    });
    return previous;
  },
  redo: (currentPalette) => {
    const state = get();
    const next = state.future[0];
    if (!next) {
      return null;
    }

    set({
      past: [...state.past, currentPalette].slice(-24),
      future: state.future.slice(1),
    });
    return next;
  },
  reset: () => set({ entries: [], past: [], future: [] }),
}));
