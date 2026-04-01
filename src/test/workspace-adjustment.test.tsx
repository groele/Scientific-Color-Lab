import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@/i18n';
import { AdjustmentHistoryPanel } from '@/components/workspace/adjustment-history-panel';
import { shortestHueDelta } from '@/domain/color/adjustment';
import { scientificColorFromOklch, normalizeHue } from '@/domain/color/convert';
import { paletteFromColors } from '@/domain/color/palette';
import { useHistoryStore } from '@/stores/history-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

function buildPalette() {
  return paletteFromColors(
    'Adjustment Test Palette',
    'qualitative',
    [
      scientificColorFromOklch({ l: 0.62, c: 0.12, h: 235, alpha: 0.95 }, { name: 'Anchor Blue', tags: ['test'] }),
      scientificColorFromOklch({ l: 0.56, c: 0.11, h: 275, alpha: 0.9 }, { name: 'Support Violet', tags: ['test'] }),
      scientificColorFromOklch({ l: 0.68, c: 0.085, h: 170, alpha: 0.85 }, { name: 'Signal Teal', tags: ['test'] }),
    ],
    'manual',
  );
}

function snapshotPalette() {
  return useWorkspaceStore
    .getState()
    .currentPalette.colors.map((color) => ({
      id: color.id,
      hex: color.hex,
      l: color.oklch.l,
      c: color.oklch.c,
      h: color.oklch.h,
      alpha: color.alpha,
    }));
}

describe('workspace palette-wide adjustment', () => {
  beforeEach(() => {
    useHistoryStore.getState().reset();
    useWorkspaceStore.getState().setCurrentPalette(buildPalette());
  });

  it('applies hue, lightness, chroma, and alpha deltas across the whole palette', () => {
    const store = useWorkspaceStore.getState();
    const selected = store.getSelectedColor();
    const before = snapshotPalette();

    store.updateAdjustment({
      ...store.adjustment,
      hue: normalizeHue(selected.oklch.h + 18),
      lightness: selected.oklch.l + 0.04,
      chroma: selected.oklch.c + 0.015,
      alpha: selected.alpha - 0.2,
    });

    const after = snapshotPalette();
    const updatedSelected = useWorkspaceStore.getState().getSelectedColor();

    expect(after.map((color) => color.hex)).not.toEqual(before.map((color) => color.hex));
    after.forEach((color, index) => {
      expect(shortestHueDelta(before[index]!.h, color.h)).toBeCloseTo(18, 1);
      expect(color.l - before[index]!.l).toBeCloseTo(0.04, 2);
      expect(color.c - before[index]!.c).toBeCloseTo(0.015, 2);
      expect(color.alpha - before[index]!.alpha).toBeCloseTo(-0.2, 2);
    });

    expect(updatedSelected.oklch.h).toBeCloseTo(normalizeHue(selected.oklch.h + 18), 1);
    expect(updatedSelected.oklch.l).toBeCloseTo(selected.oklch.l + 0.04, 2);
    expect(updatedSelected.oklch.c).toBeCloseTo(selected.oklch.c + 0.015, 2);
    expect(updatedSelected.alpha).toBeCloseTo(selected.alpha - 0.2, 2);
  });

  it('respects locked dimensions while still adjusting unlocked ones across the palette', () => {
    const store = useWorkspaceStore.getState();
    const selected = store.getSelectedColor();
    const before = snapshotPalette();

    store.updateAdjustment({
      ...store.adjustment,
      hue: normalizeHue(selected.oklch.h + 42),
      lightness: selected.oklch.l + 0.03,
      chroma: selected.oklch.c + 0.01,
      locks: {
        ...store.adjustment.locks,
        hue: true,
      },
    });

    const after = snapshotPalette();
    after.forEach((color, index) => {
      expect(shortestHueDelta(before[index]!.h, color.h)).toBeCloseTo(0, 1);
      expect(color.l - before[index]!.l).toBeCloseTo(0.03, 2);
      expect(color.c - before[index]!.c).toBeCloseTo(0.01, 2);
    });
  });

  it('records palette-wide history and supports undo and redo', () => {
    const store = useWorkspaceStore.getState();
    const selected = store.getSelectedColor();
    const before = snapshotPalette();

    store.updateAdjustment({
      ...store.adjustment,
      hue: normalizeHue(selected.oklch.h - 24),
      lightness: selected.oklch.l - 0.03,
      alpha: selected.alpha - 0.1,
    });

    const after = snapshotPalette();
    const entry = useHistoryStore.getState().entries[0];

    expect(entry).toMatchObject({
      scope: 'palette',
      anchorColorId: selected.id,
      anchorColorName: selected.name,
    });
    expect(entry?.delta.hue).toBeCloseTo(-24, 1);
    expect(entry?.delta.lightness).toBeCloseTo(-0.03, 2);
    expect(entry?.delta.alpha).toBeCloseTo(-0.1, 2);

    useWorkspaceStore.getState().undo();
    expect(snapshotPalette()).toEqual(before);

    useWorkspaceStore.getState().redo();
    expect(snapshotPalette()).toEqual(after);
  });

  it('renders the history panel as a palette-wide adjustment entry', () => {
    const store = useWorkspaceStore.getState();
    const selected = store.getSelectedColor();

    store.updateAdjustment({
      ...store.adjustment,
      lightness: selected.oklch.l + 0.02,
    });

    render(<AdjustmentHistoryPanel />);

    expect(screen.getByText(/Palette-wide adjustment/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(selected.name))).toBeInTheDocument();
    expect(screen.getByText(/ΔH/i)).toBeInTheDocument();
  });
});
