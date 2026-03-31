import { create } from 'zustand';
import type { FigureType } from '@/domain/models';

interface GeneratorState {
  figureType: FigureType;
  setFigureType: (type: FigureType) => void;
}

export const useGeneratorStore = create<GeneratorState>((set) => ({
  figureType: 'line',
  setFigureType: (figureType) => set({ figureType }),
}));
