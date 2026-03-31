import { colorDistance } from '@/domain/color/convert';
import { simulateGrayscale } from '@/domain/diagnostics/engine';
import type { Palette, TemplateDescriptor } from '@/domain/models';
import { templateToPalette } from '@/domain/templates/query-service';

export type ScientificTemplateLabelKey =
  | 'cvdSafer'
  | 'grayscaleReadable'
  | 'orderedRamp'
  | 'goodSequential'
  | 'goodDiverging'
  | 'goodCyclic'
  | 'lowMisuseRisk'
  | 'restrainedEditorial'
  | 'highContrast'
  | 'thinLineSafe'
  | 'denseScatterSafe'
  | 'presentationStrong'
  | 'darkBgHeatmap';

export interface ScientificTemplateMeta {
  labels: ScientificTemplateLabelKey[];
  score: number;
}

export function rankTemplateCatalog(templates: TemplateDescriptor[]) {
  return [...templates].sort((left, right) => {
    const scoreDelta = deriveScientificTemplateMeta(right).score - deriveScientificTemplateMeta(left).score;
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

function hasCategory(palette: Palette, category: Palette['diagnostics']['items'][number]['category']) {
  return palette.diagnostics.items.some((item) => item.category === category);
}

function hasSeverity(palette: Palette, severity: Palette['diagnostics']['items'][number]['severity']) {
  return palette.diagnostics.items.some((item) => item.severity === severity);
}

function minimumPairwiseDistance(palette: Palette) {
  let minimum = Number.POSITIVE_INFINITY;
  palette.colors.forEach((color, index) => {
    palette.colors.slice(index + 1).forEach((candidate) => {
      minimum = Math.min(minimum, colorDistance(color, candidate));
    });
  });

  return Number.isFinite(minimum) ? minimum : 0;
}

function isMonotonic(values: number[]) {
  if (values.length < 2) {
    return true;
  }

  const direction = values[1]! >= values[0]! ? 'ascending' : 'descending';
  return values.every((value, index) => {
    if (index === 0) {
      return true;
    }

    const previous = values[index - 1]!;
    return direction === 'ascending' ? value >= previous : value <= previous;
  });
}

function isGrayscaleReadable(palette: Palette) {
  const grayscale = simulateGrayscale(palette.colors);
  if (palette.class === 'qualitative') {
    return minimumPairwiseDistance({ ...palette, colors: grayscale }) >= 10;
  }

  if (palette.class === 'sequential') {
    return isMonotonic(grayscale.map((color) => color.oklch.l));
  }

  if (palette.class === 'diverging') {
    const midpoint = grayscale[Math.floor(grayscale.length / 2)];
    const first = grayscale[0];
    const last = grayscale[grayscale.length - 1];
    if (!midpoint || !first || !last) {
      return true;
    }

    return colorDistance(first, last) >= 12 && midpoint.oklch.l > Math.min(first.oklch.l, last.oklch.l);
  }

  if (palette.class === 'cyclic') {
    const first = grayscale[0];
    const last = grayscale[grayscale.length - 1];
    if (!first || !last) {
      return true;
    }

    return colorDistance(first, last) <= 6;
  }

  return true;
}

export function deriveScientificTemplateMeta(template: TemplateDescriptor): ScientificTemplateMeta {
  const palette = templateToPalette(template);
  const labels: ScientificTemplateLabelKey[] = [];

  const hasAccessibilityRisk = hasCategory(palette, 'accessibility');
  const hasPaletteRisk = hasCategory(palette, 'palette-risk');
  const hasSequentialRisk = hasCategory(palette, 'sequential');
  const hasDivergingRisk = hasCategory(palette, 'diverging');
  const hasCyclicRisk = hasCategory(palette, 'cyclic');
  const hasErrors = hasSeverity(palette, 'error');

  if (!hasAccessibilityRisk) {
    labels.push('cvdSafer');
  }

  if (isGrayscaleReadable(palette)) {
    labels.push('grayscaleReadable');
  }

  if (palette.class === 'sequential' && !hasSequentialRisk) {
    labels.push('orderedRamp', 'goodSequential');
  }

  if (palette.class === 'diverging' && !hasDivergingRisk) {
    labels.push('orderedRamp', 'goodDiverging');
  }

  if (palette.class === 'cyclic' && !hasCyclicRisk) {
    labels.push('orderedRamp', 'goodCyclic');
  }

  if (!hasPaletteRisk && !hasErrors) {
    labels.push('lowMisuseRisk');
  }

  if (template.tone === 'Editorial Minimal' || template.tone === 'Publication Clean' || template.tone === 'Scientific Neutral') {
    labels.push('restrainedEditorial');
  }

  if (
    template.tags.includes('high-contrast') ||
    template.structure === 'high-contrast-categorical' ||
    template.tone === 'Presentation Strong'
  ) {
    labels.push('highContrast');
  }

  if (
    template.chartType === 'line-plot' &&
    !hasAccessibilityRisk &&
    minimumPairwiseDistance(palette) >= 18
  ) {
    labels.push('thinLineSafe');
  }

  if (
    template.chartType === 'scatter-plot' &&
    !hasAccessibilityRisk &&
    minimumPairwiseDistance(palette) >= 15
  ) {
    labels.push('denseScatterSafe');
  }

  if (template.tone === 'Presentation Strong' && !hasErrors) {
    labels.push('presentationStrong');
  }

  if (
    template.backgroundMode === 'dark' &&
    template.chartType === 'heatmap' &&
    !hasAccessibilityRisk
  ) {
    labels.push('darkBgHeatmap');
  }

  const score =
    palette.diagnostics.score +
    labels.length * 2 -
    (hasAccessibilityRisk ? 4 : 0) -
    (hasPaletteRisk ? 6 : 0) -
    (hasErrors ? 8 : 0) +
    (labels.includes('highContrast') ? 3 : 0) +
    (labels.includes('thinLineSafe') ? 4 : 0) +
    (labels.includes('denseScatterSafe') ? 4 : 0) +
    (labels.includes('darkBgHeatmap') ? 3 : 0);

  return {
    labels: [...new Set(labels)],
    score,
  };
}
