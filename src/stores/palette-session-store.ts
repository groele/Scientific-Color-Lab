import { create } from 'zustand';
import { createPresetPalettes } from '@/data/presets';
import { generatePaletteFromBase } from '@/domain/color/palette';
import { scientificColorFromString } from '@/domain/color/convert';
import type { MatrixDensity, MatrixMode, Palette, PaletteClass, ScientificColor } from '@/domain/models';

const presets = createPresetPalettes();
const initialPalette = presets[0]!;

interface PaletteSessionState {
  presets: Palette[];
  selectedPresetId: string;
  activePalette: Palette;
  selectedColorId: string;
  paletteClass: PaletteClass;
  baseColorHex: string;
  matrixMode: MatrixMode;
  matrixDensity: MatrixDensity;
  applyPreset: (paletteId: string) => void;
  generateFromBase: (hex: string, kind?: PaletteClass) => void;
  replacePalette: (palette: Palette) => void;
  selectColor: (colorId: string) => void;
  setBaseColorHex: (hex: string) => void;
  setPaletteClass: (kind: PaletteClass) => void;
  setMatrixMode: (mode: MatrixMode) => void;
  setMatrixDensity: (density: MatrixDensity) => void;
  getSelectedColor: () => ScientificColor;
}

export const usePaletteSessionStore = create<PaletteSessionState>((set, get) => ({
  presets,
  selectedPresetId: initialPalette.id,
  activePalette: initialPalette,
  selectedColorId: initialPalette.colors[0]!.id,
  paletteClass: initialPalette.class,
  baseColorHex: initialPalette.colors[0]!.hex,
  matrixMode: 'hue-lightness',
  matrixDensity: 7,
  applyPreset: (paletteId) => {
    const preset = get().presets.find((entry) => entry.id === paletteId);
    if (!preset) {
      return;
    }

    set({
      selectedPresetId: preset.id,
      activePalette: preset,
      selectedColorId: preset.colors[0]!.id,
      paletteClass: preset.class,
      baseColorHex: preset.colors[0]!.hex,
    });
  },
  generateFromBase: (hex, kind) => {
    if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) {
      set({ baseColorHex: hex });
      return;
    }

    const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
    const baseColor = scientificColorFromString(normalizedHex, {
      name: 'Base color',
      source: { kind: 'manual', detail: 'base-input' },
      tags: ['base'],
    });
    const nextKind = kind ?? get().paletteClass;
    const palette = generatePaletteFromBase(baseColor, nextKind);

    set({
      activePalette: palette,
      selectedColorId: palette.colors[0]!.id,
      selectedPresetId: 'custom',
      paletteClass: nextKind,
      baseColorHex: baseColor.hex,
    });
  },
  replacePalette: (palette) =>
    set({
      selectedPresetId: 'custom',
      activePalette: palette,
      selectedColorId: palette.colors[0]?.id ?? '',
      paletteClass: palette.class,
      baseColorHex: palette.colors[0]?.hex ?? '#315d88',
    }),
  selectColor: (selectedColorId) => set({ selectedColorId }),
  setBaseColorHex: (baseColorHex) => set({ baseColorHex }),
  setPaletteClass: (paletteClass) => set({ paletteClass }),
  setMatrixMode: (matrixMode) => set({ matrixMode }),
  setMatrixDensity: (matrixDensity) => set({ matrixDensity }),
  getSelectedColor: () =>
    get().activePalette.colors.find((color) => color.id === get().selectedColorId) ?? get().activePalette.colors[0]!,
}));
