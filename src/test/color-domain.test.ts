import { describe, expect, it } from 'vitest';
import { generateColorMatrix } from '@/domain/color/matrix';
import { generatePaletteFromBase } from '@/domain/color/palette';
import { generateTonalRamp } from '@/domain/color/ramp';
import { scientificColorFromString } from '@/domain/color/convert';
import { evaluatePalette } from '@/domain/diagnostics/engine';

describe('color domain', () => {
  const base = scientificColorFromString('#315d88', {
    id: 'base',
    name: 'Base',
    source: { kind: 'manual' },
  });

  it('creates canonical color formats from a hex input', () => {
    expect(base.hex).toBe('#315d88');
    expect(base.rgb.r).toBeGreaterThan(0);
    expect(base.oklch.c).toBeGreaterThan(0);
    expect(base.cssColor).toContain('rgb');
  });

  it('builds a monotonic tonal ramp around the selected color', () => {
    const ramp = generateTonalRamp(base, 11);
    expect(ramp).toHaveLength(11);
    expect(ramp[5]?.hex).toBe(base.hex);
    expect(ramp[0]!.oklch.l).toBeLessThan(ramp[10]!.oklch.l);
  });

  it('builds a square scientific matrix centered on the selected color', () => {
    const matrix = generateColorMatrix(base, 'hue-lightness', 7);
    expect(matrix.cells).toHaveLength(7);
    expect(matrix.cells[3]?.[3]?.color.hex).toBe(base.hex);
  });

  it('keeps curated sequential palettes scientifically safe', () => {
    const palette = generatePaletteFromBase(base, 'sequential');
    const diagnostics = evaluatePalette(palette);
    expect(diagnostics.items.filter((item) => item.severity === 'error')).toHaveLength(0);
  });
});
