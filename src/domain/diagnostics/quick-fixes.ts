import { generateTonalRamp } from '@/domain/color/ramp';
import { normalizeHue, scientificColorFromOklch } from '@/domain/color/convert';
import { evaluatePalette } from '@/domain/diagnostics/engine';
import { templateCatalog } from '@/data/templates/catalog';
import { rankTemplateCatalog } from '@/domain/templates/scientific-guidance';
import { templateToPalette } from '@/domain/templates/query-service';
import type { ColorToken, DiagnosticQuickFixId, Palette } from '@/domain/models';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function restyleColor(
  color: ColorToken,
  next: Partial<ColorToken['oklch']> & { alpha?: number },
  detail: string,
) {
  return scientificColorFromOklch(
    {
      l: next.l ?? color.oklch.l,
      c: next.c ?? color.oklch.c,
      h: next.h ?? color.oklch.h,
      alpha: next.alpha ?? color.alpha,
    },
    {
      id: color.id,
      name: color.name,
      source: { kind: 'generated', detail },
      tags: [...new Set([...color.tags, 'quick-fix'])],
      usage: color.usage,
      notes: color.notes,
    },
  );
}

function rebuildPalette(palette: Palette, colors: ColorToken[], note: string) {
  const nextPalette: Palette = {
    ...palette,
    colors,
    baseColorId: colors[0]?.id ?? palette.baseColorId,
    notes: palette.notes ? `${palette.notes}\n${note}`.trim() : note,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...nextPalette,
    diagnostics: evaluatePalette(nextPalette),
  };
}

function reduceChroma(palette: Palette) {
  return rebuildPalette(
    palette,
    palette.colors.map((color) =>
      restyleColor(
        color,
        {
          c: clamp(color.oklch.c * 0.84, 0.012, 0.18),
        },
        'diagnostic-reduce-chroma',
      ),
    ),
    'Reduced chroma to keep the palette calmer and more publication-ready.',
  );
}

function increaseCategoricalSpacing(palette: Palette) {
  const count = palette.colors.length || 1;
  const base = palette.colors[0];
  if (!base) {
    return palette;
  }

  const colors = palette.colors.map((color, index) =>
    restyleColor(
      color,
      {
        h: normalizeHue(base.oklch.h + (360 / Math.max(count, 5)) * index),
        l: clamp(0.44 + ((index % 3) * 0.12), 0.34, 0.78),
        c: clamp(0.08 + (index % 2 === 0 ? 0.055 : 0.035), 0.06, 0.18),
      },
      'diagnostic-increase-categorical-spacing',
    ),
  );

  return rebuildPalette(palette, colors, 'Rebuilt category spacing to improve discrimination in legends and dense plots.');
}

function replaceRedGreenPair(palette: Palette) {
  const colors = palette.colors.map((color, index) => {
    const hue = color.oklch.h;
    const isGreen = hue >= 95 && hue <= 155;
    if (!isGreen) {
      return color;
    }

    const replacementHue = index % 2 === 0 ? 220 : 285;
    return restyleColor(
      color,
      {
        h: replacementHue,
        c: clamp(color.oklch.c, 0.06, 0.16),
      },
      'diagnostic-replace-red-green-pair',
    );
  });

  return rebuildPalette(palette, colors, 'Shifted green hues toward blue-violet territory to reduce common CVD collapse.');
}

function rebuildSequentialRamp(palette: Palette) {
  const base = palette.colors[Math.floor(palette.colors.length / 2)] ?? palette.colors[0];
  if (!base) {
    return palette;
  }

  const colors = generateTonalRamp(base, palette.colors.length || 9).map((color, index) =>
    restyleColor(
      color,
      {},
      `diagnostic-rebuild-sequential-ramp-${index + 1}`,
    ),
  );

  return rebuildPalette(
    palette,
    colors,
    'Rebuilt the sequential ramp with monotonic lightness progression.',
  );
}

function rebalanceDivergingMidpoint(palette: Palette) {
  const midpointIndex = Math.floor(palette.colors.length / 2);
  const colors = palette.colors.map((color, index) =>
    index === midpointIndex
      ? restyleColor(
          color,
          {
            l: 0.92,
            c: 0.018,
          },
          'diagnostic-rebalance-diverging-midpoint',
        )
      : color,
  );

  return rebuildPalette(palette, colors, 'Softened the diverging midpoint to preserve centered structure.');
}

function closeCyclicEndpoints(palette: Palette) {
  const first = palette.colors[0];
  if (!first) {
    return palette;
  }

  const colors = palette.colors.map((color, index) =>
    index === palette.colors.length - 1
      ? restyleColor(
          color,
          {
            l: first.oklch.l,
            c: first.oklch.c,
            h: first.oklch.h,
          },
          'diagnostic-close-cyclic-endpoints',
        )
      : color,
  );

  return rebuildPalette(palette, colors, 'Aligned cyclic endpoints so the loop closes more smoothly.');
}

function suggestSaferTemplate(palette: Palette) {
  const candidates = rankTemplateCatalog(
    templateCatalog.filter((template) => {
      if (template.paletteClass !== palette.class) {
        return false;
      }

      return template.tags.includes('high-contrast') || template.tags.includes('ordered-ramp') || template.tags.includes('restrained-editorial');
    }),
  );

  if (!candidates[0]) {
    return palette;
  }

  const templatePalette = templateToPalette(candidates[0]);
  return {
    ...templatePalette,
    name: `${templatePalette.name}`,
    notes: `Applied safer template recommendation.\n${templatePalette.notes}`.trim(),
  };
}

export function applyDiagnosticQuickFix(palette: Palette, fixId: DiagnosticQuickFixId) {
  switch (fixId) {
    case 'reduce-chroma':
      return reduceChroma(palette);
    case 'increase-categorical-spacing':
      return increaseCategoricalSpacing(palette);
    case 'replace-red-green-pair':
      return replaceRedGreenPair(palette);
    case 'rebuild-sequential-ramp':
      return rebuildSequentialRamp(palette);
    case 'rebalance-diverging-midpoint':
      return rebalanceDivergingMidpoint(palette);
    case 'close-cyclic-endpoints':
      return closeCyclicEndpoints(palette);
    case 'suggest-safer-template':
      return suggestSaferTemplate(palette);
    default:
      return palette;
  }
}
