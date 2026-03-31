import { useEffect, useMemo } from 'react';
import { createConceptGradient, createCyclicGradient, createDivergingGradient, createPaletteGradient, createSequentialGradient } from '@/domain/color/gradients';
import { generateColorMatrix } from '@/domain/color/matrix';
import { generateTonalRamp } from '@/domain/color/ramp';
import { useI18nStore } from '@/stores/i18n-store';
import { usePairingStore } from '@/stores/pairing-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function usePaletteDerivations() {
  const currentPalette = useWorkspaceStore((state) => state.currentPalette);
  const selectedColor = useWorkspaceStore((state) => state.getSelectedColor());
  const matrixMode = useWorkspaceStore((state) => state.matrixMode);
  const matrixDensity = useWorkspaceStore((state) => state.matrixDensity);
  const figureContext = useWorkspaceStore((state) => state.figureContext);
  const language = useI18nStore((state) => state.language);
  const groups = usePairingStore((state) => state.groups);
  const refreshPairings = usePairingStore((state) => state.refresh);

  useEffect(() => {
    refreshPairings(selectedColor, figureContext, language);
  }, [figureContext, language, refreshPairings, selectedColor]);

  return useMemo(
    () => ({
      selectedColor,
      toneRamp: generateTonalRamp(selectedColor, 11),
      matrix: generateColorMatrix(selectedColor, matrixMode, matrixDensity),
      gradients: [
        createPaletteGradient(currentPalette),
        createSequentialGradient(selectedColor),
        createDivergingGradient(selectedColor),
        createCyclicGradient(selectedColor),
        createConceptGradient(selectedColor),
      ],
      diagnostics: currentPalette.diagnostics,
      pairingGroups: groups,
    }),
    [currentPalette, groups, matrixDensity, matrixMode, selectedColor],
  );
}
