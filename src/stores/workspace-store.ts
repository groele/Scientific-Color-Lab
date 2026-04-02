import { create } from 'zustand';
import { generatePaletteFromBase, paletteFromColors } from '@/domain/color/palette';
import {
  applyAdjustmentDelta,
  createAdjustmentDelta,
  createAdjustmentHistoryEntry,
  createAdjustmentState,
  isZeroAdjustmentDelta,
} from '@/domain/color/adjustment';
import { evaluatePalette } from '@/domain/diagnostics/engine';
import { scientificColorFromString } from '@/domain/color/convert';
import type {
  AdjustmentState,
  ColorToken,
  CopyFormat,
  FigureContext,
  MatrixDensity,
  MatrixMode,
  Palette,
  PaletteClass,
  WorkspaceView,
} from '@/domain/models';
import { useHistoryStore } from '@/stores/history-store';

function initialPalette() {
  return createPaletteFromHexes('Scientific Starter', 'qualitative', ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']);
}

function reorder<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (!moved) {
    return items;
  }

  next.splice(to, 0, moved);
  return next;
}

function normalizePalette(palette: Palette): Palette {
  return {
    ...palette,
    diagnostics: evaluatePalette(palette),
    updatedAt: new Date().toISOString(),
  };
}

function replaceColorInPalette(palette: Palette, colorId: string, updater: (color: ColorToken) => ColorToken) {
  return normalizePalette({
    ...palette,
    colors: palette.colors.map((color) => (color.id === colorId ? updater(color) : color)),
  });
}

interface WorkspaceState {
  activeView: WorkspaceView;
  copyFormat: CopyFormat;
  currentPalette: Palette;
  selectedColorId: string;
  matrixMode: MatrixMode;
  matrixDensity: MatrixDensity;
  figureContext: FigureContext;
  adjustment: AdjustmentState;
  previousColor: ColorToken | null;
  setActiveView: (view: WorkspaceView) => void;
  setCopyFormat: (format: CopyFormat) => void;
  setMatrixMode: (mode: MatrixMode) => void;
  setMatrixDensity: (density: MatrixDensity) => void;
  setFigureType: (type: FigureContext['type']) => void;
  setFigureBackgroundMode: (mode: FigureContext['backgroundMode']) => void;
  setThinLinePreference: (value: boolean) => void;
  setCurrentPalette: (palette: Palette) => void;
  applyTemplatePalette: (palette: Palette) => void;
  generatePaletteFromBaseHex: (hex: string, paletteClass?: PaletteClass) => void;
  selectColor: (colorId: string) => void;
  setMainColor: (colorId: string) => void;
  renamePalette: (name: string) => void;
  setPaletteNotes: (notes: string) => void;
  setSelectedColorName: (name: string) => void;
  setSelectedColorTags: (tags: string[]) => void;
  setSelectedColorNotes: (notes: string) => void;
  addColorToPalette: (color: ColorToken) => void;
  insertColorsIntoPalette: (colors: ColorToken[]) => void;
  deleteColor: (colorId: string) => void;
  reorderColors: (from: number, to: number) => void;
  updateAdjustment: (adjustment: AdjustmentState) => void;
  undo: () => void;
  redo: () => void;
  getSelectedColor: () => ColorToken;
}

const seedPalette = initialPalette();

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeView: 'swatches',
  copyFormat: 'hex',
  currentPalette: seedPalette,
  selectedColorId: seedPalette.colors[0]!.id,
  matrixMode: 'hue-lightness',
  matrixDensity: 7,
  figureContext: {
    type: 'line',
    backgroundMode: 'light',
    emphasizeThinLines: true,
  },
  adjustment: createAdjustmentState(seedPalette.colors[0]!),
  previousColor: null,
  setActiveView: (activeView) => set({ activeView }),
  setCopyFormat: (copyFormat) => set({ copyFormat }),
  setMatrixMode: (matrixMode) => set({ matrixMode }),
  setMatrixDensity: (matrixDensity) => set({ matrixDensity }),
  setFigureType: (type) => set((state) => ({ figureContext: { ...state.figureContext, type } })),
  setFigureBackgroundMode: (backgroundMode) =>
    set((state) => ({ figureContext: { ...state.figureContext, backgroundMode } })),
  setThinLinePreference: (emphasizeThinLines) =>
    set((state) => ({ figureContext: { ...state.figureContext, emphasizeThinLines } })),
  setCurrentPalette: (palette) => {
    const nextPalette = normalizePalette(palette);
    const selectedColor = nextPalette.colors.find((color) => color.id === nextPalette.baseColorId) ?? nextPalette.colors[0]!;
    set({
      currentPalette: nextPalette,
      selectedColorId: selectedColor.id,
      adjustment: createAdjustmentState(selectedColor),
      previousColor: null,
    });
  },
  applyTemplatePalette: (palette) => {
    const nextPalette = normalizePalette(palette);
    const selectedColor = nextPalette.colors[0]!;
    set({
      currentPalette: nextPalette,
      selectedColorId: selectedColor.id,
      adjustment: createAdjustmentState(selectedColor),
      previousColor: null,
      activeView: 'swatches',
    });
    useHistoryStore.getState().reset();
  },
  generatePaletteFromBaseHex: (hex, paletteClass = get().currentPalette.class) => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      return;
    }

    const base = scientificColorFromString(normalized, {
      name: 'Base Color',
      source: { kind: 'manual', detail: 'workspace-base-color' },
      tags: ['manual'],
      usage: ['base-color'],
      notes: '',
    });
    const palette = generatePaletteFromBase(base, paletteClass);
    get().applyTemplatePalette(palette);
  },
  selectColor: (selectedColorId) => {
    const color = get().currentPalette.colors.find((entry) => entry.id === selectedColorId);
    if (!color) {
      return;
    }

    set({
      selectedColorId,
      adjustment: createAdjustmentState(color),
      previousColor: null,
    });
  },
  setMainColor: (colorId) => {
    const palette = get().currentPalette;
    const index = palette.colors.findIndex((color) => color.id === colorId);
    if (index < 0) {
      return;
    }

    const nextColors = reorder(palette.colors, index, 0);
    const nextPalette = normalizePalette({
      ...palette,
      colors: nextColors,
      baseColorId: nextColors[0]?.id,
    });

    set({
      currentPalette: nextPalette,
      selectedColorId: colorId,
      adjustment: createAdjustmentState(nextColors[0]!),
    });
  },
  renamePalette: (name) =>
    set((state) => ({
      currentPalette: normalizePalette({ ...state.currentPalette, name }),
    })),
  setPaletteNotes: (notes) =>
    set((state) => ({
      currentPalette: normalizePalette({ ...state.currentPalette, notes }),
    })),
  setSelectedColorName: (name) =>
    set((state) => {
      const nextPalette = replaceColorInPalette(state.currentPalette, state.selectedColorId, (color) => ({
        ...color,
        name,
        copyLabel: name,
        updatedAt: new Date().toISOString(),
      }));
      const nextSelected = nextPalette.colors.find((color) => color.id === state.selectedColorId) ?? nextPalette.colors[0]!;
      return { currentPalette: nextPalette, adjustment: createAdjustmentState(nextSelected) };
    }),
  setSelectedColorTags: (tags) =>
    set((state) => ({
      currentPalette: replaceColorInPalette(state.currentPalette, state.selectedColorId, (color) => ({
        ...color,
        tags,
        updatedAt: new Date().toISOString(),
      })),
    })),
  setSelectedColorNotes: (notes) =>
    set((state) => ({
      currentPalette: replaceColorInPalette(state.currentPalette, state.selectedColorId, (color) => ({
        ...color,
        notes,
        updatedAt: new Date().toISOString(),
      })),
    })),
  addColorToPalette: (color) =>
    set((state) => ({
      currentPalette: normalizePalette({
        ...state.currentPalette,
        colors: [...state.currentPalette.colors, color],
      }),
    })),
  insertColorsIntoPalette: (colors) =>
    set((state) => ({
      currentPalette: normalizePalette({
        ...state.currentPalette,
        colors: [...state.currentPalette.colors, ...colors],
      }),
    })),
  deleteColor: (colorId) =>
    set((state) => {
      const nextColors = state.currentPalette.colors.filter((color) => color.id !== colorId);
      const nextPalette = normalizePalette({
        ...state.currentPalette,
        colors: nextColors.length ? nextColors : state.currentPalette.colors,
        baseColorId: nextColors[0]?.id ?? state.currentPalette.baseColorId,
      });
      const nextSelected = nextPalette.colors.find((color) => color.id === state.selectedColorId) ?? nextPalette.colors[0]!;
      return {
        currentPalette: nextPalette,
        selectedColorId: nextSelected.id,
        adjustment: createAdjustmentState(nextSelected),
      };
    }),
  reorderColors: (from, to) =>
    set((state) => {
      const nextPalette = normalizePalette({
        ...state.currentPalette,
        colors: reorder(state.currentPalette.colors, from, to),
      });
      return { currentPalette: nextPalette };
    }),
  updateAdjustment: (adjustment) =>
    set((state) => {
      const selectedColor = state.currentPalette.colors.find((color) => color.id === state.selectedColorId);
      if (!selectedColor) {
        return {};
      }

      const delta = createAdjustmentDelta(selectedColor, adjustment);
      if (isZeroAdjustmentDelta(delta)) {
        return {
          adjustment: {
            ...createAdjustmentState(selectedColor),
            locks: adjustment.locks,
          },
        };
      }

      const nextPalette = normalizePalette({
        ...state.currentPalette,
        colors: state.currentPalette.colors.map((color) => applyAdjustmentDelta(color, delta)),
      });
      const updatedAnchor =
        nextPalette.colors.find((color) => color.id === selectedColor.id) ?? nextPalette.colors[0]!;

      useHistoryStore.getState().record(
        state.currentPalette,
        nextPalette,
        createAdjustmentHistoryEntry(selectedColor, selectedColor, updatedAnchor, delta),
      );
      return {
        currentPalette: nextPalette,
        adjustment: {
          ...createAdjustmentState(updatedAnchor),
          locks: adjustment.locks,
        },
        previousColor: selectedColor,
      };
    }),
  undo: () => {
    const currentPalette = get().currentPalette;
    const previous = useHistoryStore.getState().undo(currentPalette);
    if (!previous) {
      return;
    }

    const nextSelected = previous.colors.find((color) => color.id === get().selectedColorId) ?? previous.colors[0]!;
    set({
      currentPalette: previous,
      selectedColorId: nextSelected.id,
      adjustment: createAdjustmentState(nextSelected),
      previousColor: null,
    });
  },
  redo: () => {
    const currentPalette = get().currentPalette;
    const next = useHistoryStore.getState().redo(currentPalette);
    if (!next) {
      return;
    }

    const nextSelected = next.colors.find((color) => color.id === get().selectedColorId) ?? next.colors[0]!;
    set({
      currentPalette: next,
      selectedColorId: nextSelected.id,
      adjustment: createAdjustmentState(nextSelected),
      previousColor: null,
    });
  },
  getSelectedColor: () =>
    get().currentPalette.colors.find((color) => color.id === get().selectedColorId) ?? get().currentPalette.colors[0]!,
}));

export function createPaletteFromHexes(name: string, paletteClass: PaletteClass, hexes: string[]) {
  return paletteFromColors(
    name,
    paletteClass,
    hexes.map((hex, index) =>
      scientificColorFromString(hex, {
        id: `palette-${index + 1}`,
        name: `${name} ${index + 1}`,
        source: { kind: 'manual', detail: 'hexes' },
        tags: ['manual'],
        usage: [],
        notes: '',
      }),
    ),
    'manual',
  );
}
