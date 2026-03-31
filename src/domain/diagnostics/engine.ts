import {
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  filterGrayscale,
  formatHex,
  wcagContrast,
} from 'culori';
import type {
  DiagnosticItem,
  DiagnosticQuickFix,
  DiagnosticQuickFixId,
  DiagnosticThresholds,
  Palette,
  PaletteDiagnostics,
  PaletteDiagnosticsStatus,
  ScientificColor,
} from '@/domain/models';
import { colorDistance, normalizeHue, scientificColorFromString } from '@/domain/color/convert';

const defaultThresholds: DiagnosticThresholds = {
  categoricalDeltaE: 12,
  minimumContrast: 3,
  maxQualitativeColors: 8,
  maximumChroma: 0.19,
};

function addDiagnostic(items: DiagnosticItem[], diagnostic: Omit<DiagnosticItem, 'id'>) {
  items.push({ ...diagnostic, id: crypto.randomUUID() });
}

function diagnosticsStatus(score: number, items: DiagnosticItem[]): PaletteDiagnosticsStatus {
  if (items.some((item) => item.severity === 'error') || score < 68) {
    return 'high-risk';
  }

  if (items.some((item) => item.severity === 'warning') || score < 88) {
    return 'needs-attention';
  }

  return 'healthy';
}

function rankSeverity(severity: DiagnosticItem['severity']) {
  switch (severity) {
    case 'error':
      return 3;
    case 'warning':
      return 2;
    case 'info':
    default:
      return 1;
  }
}

function deriveQuickFixes(items: DiagnosticItem[]): DiagnosticQuickFix[] {
  const seen = new Set<DiagnosticQuickFixId>();
  const fixes: DiagnosticQuickFix[] = [];

  const register = (id: DiagnosticQuickFixId, relatedColorIds?: string[]) => {
    if (seen.has(id)) {
      return;
    }

    seen.add(id);
    fixes.push({ id, relatedColorIds });
  };

  const byCode = (code: DiagnosticItem['code']) => items.find((item) => item.code === code);

  const oversaturation = byCode('oversaturation-risk') ?? byCode('analyzer-oversaturated');
  if (oversaturation) {
    register('reduce-chroma', oversaturation.relatedColorIds);
  }

  const categorical = byCode('categorical-too-similar') ?? byCode('too-many-qualitative-colors');
  if (categorical) {
    register('increase-categorical-spacing', categorical.relatedColorIds);
  }

  const redGreen = byCode('red-green-conflict');
  if (redGreen) {
    register('replace-red-green-pair', redGreen.relatedColorIds);
  }

  const sequential = byCode('sequential-non-monotonic') ?? byCode('rainbow-risk');
  if (sequential) {
    register('rebuild-sequential-ramp', sequential.relatedColorIds);
  }

  const diverging = byCode('diverging-midpoint-chromatic');
  if (diverging) {
    register('rebalance-diverging-midpoint', diverging.relatedColorIds);
  }

  const cyclic = byCode('cyclic-endpoints-open');
  if (cyclic) {
    register('close-cyclic-endpoints', cyclic.relatedColorIds);
  }

  if (items.length > 0) {
    register('suggest-safer-template', items.flatMap((item) => item.relatedColorIds ?? []));
  }

  return fixes;
}

function createSummary(score: number, status: PaletteDiagnosticsStatus, items: DiagnosticItem[]) {
  const errors = items.filter((item) => item.severity === 'error').length;
  const warnings = items.filter((item) => item.severity === 'warning').length;

  if (status === 'healthy') {
    return `Healthy · score ${score}`;
  }

  if (status === 'high-risk') {
    return `${errors} high-risk issues · ${warnings} warnings · score ${score}`;
  }

  return `${warnings} warnings to review · score ${score}`;
}

export function buildPaletteDiagnostics(score: number, items: DiagnosticItem[]): PaletteDiagnostics {
  const sortedItems = [...items].sort((left, right) => rankSeverity(right.severity) - rankSeverity(left.severity));
  const status = diagnosticsStatus(score, sortedItems);
  return {
    score,
    status,
    summary: createSummary(score, status, sortedItems),
    quickFixes: deriveQuickFixes(sortedItems),
    items: sortedItems,
  };
}

function isRedHue(hue: number) {
  return hue <= 25 || hue >= 335;
}

function isGreenHue(hue: number) {
  return hue >= 95 && hue <= 155;
}

function hasSequentialMonotonicLightness(colors: ScientificColor[]) {
  if (colors.length < 2) {
    return true;
  }

  const trend = colors[1]!.oklch.l >= colors[0]!.oklch.l ? 'ascending' : 'descending';
  return colors.every((color, index) => {
    if (index === 0) {
      return true;
    }

    const previous = colors[index - 1]!;
    return trend === 'ascending' ? color.oklch.l >= previous.oklch.l : color.oklch.l <= previous.oklch.l;
  });
}

function hueTravel(colors: ScientificColor[]) {
  return colors.slice(1).reduce((sum, color, index) => {
    const previous = colors[index]!;
    const raw = Math.abs(color.oklch.h - previous.oklch.h);
    const delta = raw > 180 ? 360 - raw : raw;
    return sum + delta;
  }, 0);
}

function buildSimulatedPalette(
  colors: ScientificColor[],
  mode: 'deuteranopia' | 'protanopia' | 'tritanopia' | 'grayscale',
) {
  return colors.map((color, index) => {
    const input = {
      mode: 'rgb' as const,
      r: color.rgb.r / 255,
      g: color.rgb.g / 255,
      b: color.rgb.b / 255,
    };
    const transformed =
      mode === 'deuteranopia'
        ? filterDeficiencyDeuter(1)(input)
        : mode === 'protanopia'
          ? filterDeficiencyProt(1)(input)
          : mode === 'tritanopia'
            ? filterDeficiencyTrit(1)(input)
            : filterGrayscale(1)(input);
    const hex = transformed ? formatHex(transformed) ?? color.hex : color.hex;

    return scientificColorFromString(hex, {
      id: `${color.id}-${mode}-${index}`,
      name: `${color.name} ${mode}`,
      source: { kind: 'generated', detail: mode },
      tags: [...color.tags, mode],
      usage: color.usage,
      notes: color.notes,
    });
  });
}

export function simulatePaletteCvd(colors: ScientificColor[], mode: 'deuteranopia' | 'protanopia' | 'tritanopia') {
  return buildSimulatedPalette(colors, mode);
}

export function simulateGrayscale(colors: ScientificColor[]) {
  return buildSimulatedPalette(colors, 'grayscale');
}

function checkContrast(colors: ScientificColor[], items: DiagnosticItem[], thresholds: DiagnosticThresholds) {
  const background = '#f6f5f1';
  colors.forEach((color) => {
    const contrast = wcagContrast(color.hex, background);
    if (contrast < thresholds.minimumContrast) {
      addDiagnostic(items, {
        code: 'low-interface-contrast',
        severity: 'warning',
        category: 'contrast',
        title: 'Low interface contrast',
        message: `${color.name} falls below ${thresholds.minimumContrast}:1 against the editorial canvas.`,
        suggestion: 'Raise lightness contrast or reserve this color for non-text accents.',
        relatedColorIds: [color.id],
      });
    }
  });
}

function checkCategoricalSimilarity(colors: ScientificColor[], items: DiagnosticItem[], thresholds: DiagnosticThresholds) {
  colors.forEach((color, index) => {
    colors.slice(index + 1).forEach((candidate) => {
      const delta = colorDistance(color, candidate);
      if (delta < thresholds.categoricalDeltaE) {
        addDiagnostic(items, {
          code: 'categorical-too-similar',
          severity: 'warning',
          category: 'categorical',
          title: 'Categorical colors are too similar',
          message: `${color.name} and ${candidate.name} are only ΔE ${delta.toFixed(1)} apart.`,
          suggestion: 'Increase hue distance or separate the pair more strongly in lightness/chroma.',
          relatedColorIds: [color.id, candidate.id],
        });
      }

      const redGreenConflict =
        ((isRedHue(color.oklch.h) && isGreenHue(candidate.oklch.h)) ||
          (isGreenHue(color.oklch.h) && isRedHue(candidate.oklch.h))) &&
        Math.abs(color.oklch.l - candidate.oklch.l) < 0.14;

      if (redGreenConflict) {
        addDiagnostic(items, {
          code: 'red-green-conflict',
          severity: 'warning',
          category: 'accessibility',
          title: 'Red/green conflict risk',
          message: `${color.name} and ${candidate.name} may collapse for common color-vision deficiencies.`,
          suggestion: 'Swap one side for a blue, violet, or neutral counterpoint.',
          relatedColorIds: [color.id, candidate.id],
        });
      }
    });
  });
}

function checkOversaturation(colors: ScientificColor[], items: DiagnosticItem[], thresholds: DiagnosticThresholds) {
  colors.forEach((color) => {
    if (color.oklch.c > thresholds.maximumChroma) {
      addDiagnostic(items, {
        code: 'oversaturation-risk',
        severity: 'warning',
        category: 'palette-risk',
        title: 'Oversaturation risk',
        message: `${color.name} is highly chromatic and may feel aggressive in restrained scientific layouts.`,
        suggestion: 'Reduce chroma slightly for manuscript and online-document contexts.',
        relatedColorIds: [color.id],
      });
    }
  });
}

function checkPaletteClassRules(palette: Palette, items: DiagnosticItem[], thresholds: DiagnosticThresholds) {
  if (palette.class === 'qualitative' && palette.colors.length > thresholds.maxQualitativeColors) {
    addDiagnostic(items, {
      code: 'too-many-qualitative-colors',
      severity: 'warning',
      category: 'palette-risk',
      title: 'Too many arbitrary categorical colors',
      message: 'Qualitative palettes should stay compact to preserve discriminability.',
      suggestion: 'Reduce the count or split categories into primary and secondary groups.',
      relatedColorIds: palette.colors.map((color) => color.id),
    });
  }

  if (palette.class === 'sequential' && !hasSequentialMonotonicLightness(palette.colors)) {
    addDiagnostic(items, {
      code: 'sequential-non-monotonic',
      severity: 'error',
      category: 'sequential',
      title: 'Sequential lightness is non-monotonic',
      message: 'The sequential palette should move in one lightness direction only.',
      suggestion: 'Rebuild the ramp with steady OKLCH lightness progression.',
      relatedColorIds: palette.colors.map((color) => color.id),
    });
  }

  const midpointIndex = Math.floor(palette.colors.length / 2);
  const midpoint = palette.colors[midpointIndex];
  if (palette.class === 'diverging' && midpoint && midpoint.oklch.c > 0.05) {
    addDiagnostic(items, {
      code: 'diverging-midpoint-chromatic',
      severity: 'warning',
      category: 'diverging',
      title: 'Diverging midpoint is too chromatic',
      message: 'Diverging maps should pass through a quieter midpoint to preserve structure.',
      suggestion: 'Reduce midpoint chroma toward a near-neutral bridge.',
      relatedColorIds: [midpoint.id],
    });
  }

  if (palette.class === 'cyclic') {
    const first = palette.colors[0];
    const last = palette.colors[palette.colors.length - 1];
    if (first && last && colorDistance(first, last) > 6) {
      addDiagnostic(items, {
        code: 'cyclic-endpoints-open',
        severity: 'warning',
        category: 'cyclic',
        title: 'Cyclic endpoints are not continuous',
        message: 'The first and last cyclic colors should be visually continuous.',
        suggestion: 'Align endpoint hue and lightness so the loop closes smoothly.',
        relatedColorIds: [first.id, last.id],
      });
    }
  }
}

function checkRainbowRisk(colors: ScientificColor[], items: DiagnosticItem[]) {
  const travel = hueTravel(colors);
  const hueExtremes = colors.map((color) => normalizeHue(color.oklch.h));
  const spread = Math.max(...hueExtremes) - Math.min(...hueExtremes);

  if (travel > 180 && spread > 180 && !hasSequentialMonotonicLightness(colors)) {
    addDiagnostic(items, {
      code: 'rainbow-risk',
      severity: 'error',
      category: 'palette-risk',
      title: 'Jet / rainbow-like behavior detected',
      message: 'Large hue swings with unstable lightness can mislead quantitative interpretation.',
      suggestion: 'Switch to a monotonic sequential map or a balanced diverging map with a structured midpoint.',
      relatedColorIds: colors.map((color) => color.id),
    });
  }
}

export function evaluatePalette(palette: Palette, thresholds: DiagnosticThresholds = defaultThresholds): PaletteDiagnostics {
  const items: DiagnosticItem[] = [];
  checkContrast(palette.colors, items, thresholds);
  checkCategoricalSimilarity(palette.colors, items, thresholds);
  checkOversaturation(palette.colors, items, thresholds);
  checkPaletteClassRules(palette, items, thresholds);
  checkRainbowRisk(palette.colors, items);

  const errorWeight = items.filter((item) => item.severity === 'error').length * 14;
  const warningWeight = items.filter((item) => item.severity === 'warning').length * 7;
  return buildPaletteDiagnostics(Math.max(25, 100 - errorWeight - warningWeight), items);
}

export function diagnosticsSummary(diagnostics: PaletteDiagnostics) {
  return diagnostics.summary;
}

export const defaultDiagnosticThresholds = defaultThresholds;
