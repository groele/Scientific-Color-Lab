import rawPresets from './palettes.v1.json';
import type { Palette, RawPresetPalette } from '@/domain/models';
import { evaluatePalette } from '@/domain/diagnostics/engine';
import { scientificColorFromString } from '@/domain/color/convert';

const presetData = rawPresets as RawPresetPalette[];

export function createPresetPalettes(): Palette[] {
  return presetData.map((preset) => {
    const colors = preset.colors.map((hex, index) =>
      scientificColorFromString(hex, {
        id: `${preset.id}-${index + 1}`,
        name: `${preset.name} ${index + 1}`,
        source: { kind: 'preset', detail: preset.id },
        tags: preset.tags,
      }),
    );

    const now = new Date().toISOString();
    const palette: Palette = {
      id: preset.id,
      name: preset.name,
      class: preset.class,
      colors,
      baseColorId: colors[0]?.id,
      diagnostics: { score: 0, items: [] },
      tags: preset.tags,
      notes: '',
      provenance: { source: 'preset', reference: preset.description },
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...palette,
      diagnostics: evaluatePalette(palette),
    };
  });
}
