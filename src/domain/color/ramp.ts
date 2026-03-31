import type { Palette, ScientificColor } from '@/domain/models';
import { createColorLabel, createId, scientificColorFromOklch } from '@/domain/color/convert';
import { evaluatePalette } from '@/domain/diagnostics/engine';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function easeInOut(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;
}

export function generateTonalRamp(baseColor: ScientificColor, steps = 11) {
  const base = baseColor.oklch;
  const center = (steps - 1) / 2;

  return Array.from({ length: steps }, (_, index) => {
    const normalized = steps === 1 ? 0.5 : index / (steps - 1);
    const eased = easeInOut(normalized);
    const lightness = clamp(0.12 + eased * 0.8, 0.06, 0.98);
    const distanceFromCenter = Math.abs(index - center) / Math.max(center, 1);
    const chromaScale = clamp(1 - distanceFromCenter * 0.72, 0.08, 1);
    const chroma = base.c * chromaScale;

    return scientificColorFromOklch(
      { l: lightness, c: chroma, h: base.h, alpha: baseColor.alpha },
      {
        id: createId('tone'),
        name: createColorLabel(index, 'Tone'),
        source: { kind: 'generated', detail: 'tonal-ramp' },
        tags: ['tone-ramp'],
      },
    );
  }).map((color, index) =>
    index === Math.round(center)
      ? {
          ...baseColor,
          id: color.id,
          name: color.name,
          tags: [...new Set([...baseColor.tags, 'tone-ramp'])],
        }
      : color,
  );
}

export function buildSequentialPaletteFromBase(baseColor: ScientificColor) {
  const colors = generateTonalRamp(baseColor, 9);
  const now = new Date().toISOString();
  const palette: Palette = {
    id: createId('palette'),
    name: `${baseColor.name} Ramp`,
    class: 'sequential',
    colors,
    baseColorId: baseColor.id,
    diagnostics: { score: 0, status: 'healthy', summary: '', quickFixes: [], items: [] },
    tags: ['generated', 'sequential'],
    notes: '',
    provenance: { source: 'base-color', reference: baseColor.hex },
    createdAt: now,
    updatedAt: now,
  };

  return { ...palette, diagnostics: evaluatePalette(palette) };
}
