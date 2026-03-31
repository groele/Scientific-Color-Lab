import type { ColorMatrix, DivergingPair, MatrixDensity, MatrixMode, ScientificColor } from '@/domain/models';
import { createId, normalizeHue, scientificColorFromOklch } from '@/domain/color/convert';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function buildDivergingPair(baseColor: ScientificColor): DivergingPair {
  const left = scientificColorFromOklch(
    {
      l: clamp(baseColor.oklch.l - 0.15, 0.2, 0.7),
      c: clamp(baseColor.oklch.c + 0.03, 0.08, 0.19),
      h: normalizeHue(baseColor.oklch.h - 65),
      alpha: 1,
    },
    {
      id: createId('pair'),
      name: 'Cool endpoint',
      source: { kind: 'generated', detail: 'diverging-pair' },
      tags: ['diverging-pair'],
    },
  );

  const midpoint = scientificColorFromOklch(
    { l: 0.9, c: 0.015, h: baseColor.oklch.h, alpha: 1 },
    {
      id: createId('pair'),
      name: 'Soft midpoint',
      source: { kind: 'generated', detail: 'diverging-pair' },
      tags: ['diverging-pair'],
    },
  );

  const right = scientificColorFromOklch(
    {
      l: clamp(baseColor.oklch.l + 0.08, 0.34, 0.76),
      c: clamp(baseColor.oklch.c + 0.04, 0.08, 0.19),
      h: normalizeHue(baseColor.oklch.h + 135),
      alpha: 1,
    },
    {
      id: createId('pair'),
      name: 'Warm endpoint',
      source: { kind: 'generated', detail: 'diverging-pair' },
      tags: ['diverging-pair'],
    },
  );

  return { left, midpoint, right };
}

export function generateColorMatrix(baseColor: ScientificColor, mode: MatrixMode, density: MatrixDensity) {
  const center = Math.floor(density / 2);
  const hueStep = density === 5 ? 16 : density === 7 ? 12 : 9;
  const chromaStep = density === 5 ? 0.022 : density === 7 ? 0.018 : 0.014;
  const lightnessStep = density === 5 ? 0.09 : density === 7 ? 0.07 : 0.055;

  const cells = Array.from({ length: density }, (_, row) =>
    Array.from({ length: density }, (_, column) => {
      const xOffset = column - center;
      const yOffset = row - center;
      const lightness = clamp(baseColor.oklch.l - yOffset * lightnessStep, 0.05, 0.98);
      const hue = mode === 'hue-lightness' ? normalizeHue(baseColor.oklch.h + xOffset * hueStep) : baseColor.oklch.h;
      const chroma =
        mode === 'chroma-lightness'
          ? clamp(baseColor.oklch.c + xOffset * chromaStep, 0, 0.25)
          : clamp(baseColor.oklch.c * (1 - Math.abs(yOffset) * 0.06), 0.02, 0.2);

      const color = scientificColorFromOklch(
        { l: lightness, c: chroma, h: hue, alpha: baseColor.alpha },
        {
          id: createId('cell'),
          name: `Cell ${row + 1}.${column + 1}`,
          source: { kind: 'generated', detail: mode },
          tags: ['scientific-grid'],
        },
      );

      return {
        id: color.id,
        row,
        column,
        xValue: mode === 'hue-lightness' ? hue : chroma,
        yValue: lightness,
        clipped: color.gamutStatus === 'mapped',
        diagnostics: color.gamutStatus === 'mapped' ? ['Gamut mapped'] : [],
        color,
      };
    }),
  );

  const matrix: ColorMatrix = {
    id: createId('matrix'),
    baseColorId: baseColor.id,
    mode,
    density,
    xAxis: mode === 'hue-lightness' ? 'Hue' : 'Chroma',
    yAxis: 'Lightness',
    cells,
  };

  cells[center]![center] = { ...cells[center]![center]!, color: baseColor, clipped: baseColor.gamutStatus === 'mapped' };
  return matrix;
}
