import type { Palette, PaletteClass, ScientificColor } from '@/domain/models';
import { createColorLabel, createId, normalizeHue, scientificColorFromOklch } from '@/domain/color/convert';
import { generateTonalRamp } from '@/domain/color/ramp';
import { evaluatePalette } from '@/domain/diagnostics/engine';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function makePaletteSkeleton(
  name: string,
  kind: PaletteClass,
  baseColor: ScientificColor,
  colors: ScientificColor[],
  detail: string,
): Palette {
  const now = new Date().toISOString();
  const palette: Palette = {
    id: createId('palette'),
    name,
    class: kind,
    colors,
    baseColorId: baseColor.id,
    diagnostics: { score: 0, items: [] },
    tags: ['generated', kind],
    notes: '',
    provenance: { source: 'base-color', reference: detail },
    createdAt: now,
    updatedAt: now,
  };

  return { ...palette, diagnostics: evaluatePalette(palette) };
}

function buildQualitativePalette(baseColor: ScientificColor, count = 6) {
  const step = 360 / Math.max(count, 5);
  const angles = Array.from({ length: count }, (_, index) => normalizeHue(baseColor.oklch.h + step * index));

  return angles.map((angle, index) =>
    scientificColorFromOklch(
      {
        l: clamp(0.58 + Math.sin((index / count) * Math.PI * 1.4) * 0.08, 0.44, 0.76),
        c: clamp(baseColor.oklch.c * 0.8 + (index % 2 === 0 ? 0.03 : -0.015), 0.06, 0.18),
        h: angle,
        alpha: 1,
      },
      {
        id: createId('qual'),
        name: createColorLabel(index, 'Series'),
        source: { kind: 'generated', detail: 'qualitative' },
        tags: ['qualitative'],
      },
    ),
  );
}

function buildDivergingPalette(baseColor: ScientificColor) {
  const midpoint = scientificColorFromOklch(
    { l: 0.92, c: Math.max(0.01, baseColor.oklch.c * 0.08), h: baseColor.oklch.h, alpha: 1 },
    {
      id: createId('diverge'),
      name: 'Midpoint',
      source: { kind: 'generated', detail: 'diverging' },
      tags: ['diverging', 'neutral-midpoint'],
    },
  );

  const leftHue = normalizeHue(baseColor.oklch.h - 55);
  const rightHue = normalizeHue(baseColor.oklch.h + 130);
  const left = generateTonalRamp(
    scientificColorFromOklch(
      { l: 0.38, c: clamp(baseColor.oklch.c + 0.02, 0.07, 0.18), h: leftHue, alpha: 1 },
      {
        id: createId('diverge'),
        name: 'Cool anchor',
        source: { kind: 'generated', detail: 'diverging-left' },
        tags: ['diverging'],
      },
    ),
    4,
  );
  const right = generateTonalRamp(
    scientificColorFromOklch(
      { l: 0.42, c: clamp(baseColor.oklch.c + 0.03, 0.08, 0.19), h: rightHue, alpha: 1 },
      {
        id: createId('diverge'),
        name: 'Warm anchor',
        source: { kind: 'generated', detail: 'diverging-right' },
        tags: ['diverging'],
      },
    ),
    4,
  );

  return [...left.slice(0, 4), midpoint, ...right.slice(0, 4)];
}

function buildCyclicPalette(baseColor: ScientificColor) {
  return Array.from({ length: 8 }, (_, index) =>
    scientificColorFromOklch(
      {
        l: clamp(0.58 + Math.sin((index / 8) * Math.PI * 2) * 0.07, 0.42, 0.76),
        c: clamp(baseColor.oklch.c * 0.95 + Math.cos((index / 8) * Math.PI * 2) * 0.02, 0.05, 0.18),
        h: normalizeHue(baseColor.oklch.h + index * 45),
        alpha: 1,
      },
      {
        id: createId('cyclic'),
        name: createColorLabel(index, 'Phase'),
        source: { kind: 'generated', detail: 'cyclic' },
        tags: ['cyclic'],
      },
    ),
  ).concat(
    scientificColorFromOklch(
      {
        l: clamp(baseColor.oklch.l, 0.42, 0.76),
        c: clamp(baseColor.oklch.c, 0.05, 0.18),
        h: baseColor.oklch.h,
        alpha: 1,
      },
      {
        id: createId('cyclic'),
        name: 'Phase 09',
        source: { kind: 'generated', detail: 'cyclic-repeat' },
        tags: ['cyclic'],
      },
    ),
  );
}

function buildConceptPalette(baseColor: ScientificColor) {
  const neutrals = [0.08, 0.32, 0.63, 0.93].map((lightness, index) =>
    scientificColorFromOklch(
      { l: lightness, c: 0.012 + index * 0.002, h: 260, alpha: 1 },
      {
        id: createId('concept'),
        name: createColorLabel(index, 'Neutral'),
        source: { kind: 'generated', detail: 'concept-neutral' },
        tags: ['concept', 'neutral'],
      },
    ),
  );

  const accents = [0, 1, 2].map((index) =>
    scientificColorFromOklch(
      {
        l: clamp(0.36 + index * 0.18, 0.24, 0.82),
        c: clamp(baseColor.oklch.c + 0.03, 0.08, 0.18),
        h: baseColor.oklch.h,
        alpha: 1,
      },
      {
        id: createId('concept'),
        name: createColorLabel(index, 'Accent'),
        source: { kind: 'generated', detail: 'concept-accent' },
        tags: ['concept', 'accent'],
      },
    ),
  );

  return [...neutrals, ...accents];
}

export function generatePaletteFromBase(baseColor: ScientificColor, kind: PaletteClass) {
  switch (kind) {
    case 'qualitative':
      return makePaletteSkeleton('Qualitative Study Set', kind, baseColor, buildQualitativePalette(baseColor, 6), 'qualitative-base');
    case 'sequential':
      return makePaletteSkeleton('Sequential Study Ramp', kind, baseColor, generateTonalRamp(baseColor, 9), 'sequential-base');
    case 'diverging':
      return makePaletteSkeleton('Diverging Study Map', kind, baseColor, buildDivergingPalette(baseColor), 'diverging-base');
    case 'cyclic':
      return makePaletteSkeleton('Cyclic Study Loop', kind, baseColor, buildCyclicPalette(baseColor), 'cyclic-base');
    case 'concept':
      return makePaletteSkeleton('Concept Figure System', kind, baseColor, buildConceptPalette(baseColor), 'concept-base');
    default:
      return makePaletteSkeleton('Qualitative Study Set', 'qualitative', baseColor, buildQualitativePalette(baseColor, 6), 'default-base');
  }
}

export function paletteFromColors(
  name: string,
  kind: PaletteClass,
  colors: ScientificColor[],
  source: Palette['provenance']['source'],
): Palette {
  const now = new Date().toISOString();
  const palette: Palette = {
    id: createId('palette'),
    name,
    class: kind,
    colors,
    baseColorId: colors[0]?.id,
    diagnostics: { score: 0, items: [] },
    tags: [kind, source],
    notes: '',
    provenance: { source, reference: name },
    createdAt: now,
    updatedAt: now,
  };

  return { ...palette, diagnostics: evaluatePalette(palette) };
}
