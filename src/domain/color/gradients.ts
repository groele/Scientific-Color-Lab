import type { GradientDefinition, Palette, ScientificColor } from '@/domain/models';
import { buildDivergingPair } from '@/domain/color/matrix';
import { createColorLabel, createId, scientificColorFromOklch } from '@/domain/color/convert';
import { generateTonalRamp } from '@/domain/color/ramp';

function buildGradientCss(colors: ScientificColor[]) {
  return `linear-gradient(90deg, ${colors.map((color) => color.hex).join(', ')})`;
}

export function createSequentialGradient(baseColor: ScientificColor): GradientDefinition {
  const stops = generateTonalRamp(baseColor, 9);
  return { id: createId('gradient'), label: 'Sequential Gradient', css: buildGradientCss(stops), stops, type: 'sequential-gradient' };
}

export function createDivergingGradient(baseColor: ScientificColor): GradientDefinition {
  const pair = buildDivergingPair(baseColor);
  const stops = [pair.left, pair.midpoint, pair.right];
  return { id: createId('gradient'), label: 'Diverging Gradient', css: buildGradientCss(stops), stops, type: 'diverging-gradient' };
}

export function createCyclicGradient(baseColor: ScientificColor): GradientDefinition {
  const loop = Array.from({ length: 9 }, (_, index) =>
    scientificColorFromOklch(
      {
        l: 0.58 + Math.sin((index / 8) * Math.PI * 2) * 0.06,
        c: Math.max(0.05, baseColor.oklch.c + Math.cos((index / 8) * Math.PI * 2) * 0.02),
        h: baseColor.oklch.h + index * 45,
        alpha: 1,
      },
      {
        id: createId('gradient'),
        name: createColorLabel(index, 'Cycle'),
        source: { kind: 'generated', detail: 'cyclic-gradient' },
        tags: ['cyclic', 'gradient'],
      },
    ),
  );

  return { id: createId('gradient'), label: 'Cyclic Gradient', css: buildGradientCss(loop), stops: loop, type: 'cyclic-colormap' };
}

export function createPaletteGradient(palette: Palette): GradientDefinition {
  return {
    id: createId('gradient'),
    label: `${palette.name} Gradient`,
    css: buildGradientCss(palette.colors),
    stops: palette.colors,
    type: 'palette',
  };
}

export function createConceptGradient(baseColor: ScientificColor): GradientDefinition {
  const samples = [
    scientificColorFromOklch(
      { l: 0.08, c: 0.012, h: 260, alpha: 1 },
      { id: createId('gradient'), name: 'Concept dark', source: { kind: 'generated', detail: 'concept-gradient' } },
    ),
    baseColor,
    scientificColorFromOklch(
      { l: 0.93, c: 0.018, h: baseColor.oklch.h, alpha: 1 },
      { id: createId('gradient'), name: 'Concept light', source: { kind: 'generated', detail: 'concept-gradient' } },
    ),
  ];

  return { id: createId('gradient'), label: 'Concept Figure Gradient', css: buildGradientCss(samples), stops: samples, type: 'concept-figure' };
}
