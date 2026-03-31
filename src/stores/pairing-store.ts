import { create } from 'zustand';
import { buildPairingRecommendationGroups } from '@/domain/pairing/engine';
import type { ColorToken, FigureContext, LanguageCode, PairingRecommendationGroup } from '@/domain/models';

interface PairingState {
  groups: PairingRecommendationGroup[];
  refresh: (baseColor: ColorToken, figureContext: FigureContext, language: LanguageCode) => void;
}

export const usePairingStore = create<PairingState>((set) => ({
  groups: [],
  refresh: (baseColor, figureContext, language) =>
    set({
      groups: buildPairingRecommendationGroups(baseColor, figureContext, language),
    }),
}));
