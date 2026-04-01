import { converter, differenceCiede2000, wcagContrast } from 'culori';
import type {
  AnalyzerDetailLevel,
  AnalyzerWorkerRequest,
  DiagnosticItem,
  ImageAnalysisResult,
  ImageCluster,
  Palette,
  SuitabilityAssessment,
} from '@/domain/models';
import { paletteFromColors } from '@/domain/color/palette';
import { createId, scientificColorFromOklch } from '@/domain/color/convert';
import { buildPaletteDiagnostics, evaluatePalette } from '@/domain/diagnostics/engine';

interface LabPoint {
  l: number;
  a: number;
  b: number;
  count: number;
}

interface WeightedClusterPoint extends LabPoint {
  sourceCount: number;
  preserveLongTail: boolean;
}

interface EvaluatedCluster {
  point: WeightedClusterPoint;
  cluster: ImageCluster;
  preserveLongTail: boolean;
}

const toOklab = converter('oklab');
const toOklch = converter('oklch');
const deltaE = differenceCiede2000();
const editorialBackground = '#f6f5f1';
const darkBackground = '#131619';
const alphaThreshold = 32;
const lBins = 48;
const aBins = 40;
const bBins = 40;
const abWindow = 0.45;
const detailRetentionThreshold = 0.0025;
const summaryRetentionThreshold = 0.015;
const iterations = 16;
const modeDefaultClusters: Record<AnalyzerDetailLevel, number> = {
  compact: 8,
  balanced: 12,
  complete: 20,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function quantizeRangeIndex(value: number, minimum: number, maximum: number, bins: number) {
  const bounded = clamp(value, minimum, maximum);
  const ratio = (bounded - minimum) / (maximum - minimum);
  return Math.min(bins - 1, Math.max(0, Math.floor(ratio * bins)));
}

function quantizePoints(pixels: Uint8ClampedArray) {
  const histogram = new Map<string, { l: number; a: number; b: number; count: number }>();
  const processedPixels = pixels.length / 4;
  let opaquePixels = 0;

  for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 4) {
    const alpha = pixels[pixelIndex + 3] ?? 0;
    if (alpha < alphaThreshold) {
      continue;
    }

    const color = toOklab({
      mode: 'rgb',
      r: (pixels[pixelIndex] ?? 0) / 255,
      g: (pixels[pixelIndex + 1] ?? 0) / 255,
      b: (pixels[pixelIndex + 2] ?? 0) / 255,
      alpha: alpha / 255,
    });

    if (!color) {
      continue;
    }

    opaquePixels += 1;

    const lIndex = Math.min(lBins - 1, Math.max(0, Math.floor(clamp(color.l ?? 0, 0, 1) * lBins)));
    const aIndex = quantizeRangeIndex(color.a ?? 0, -abWindow, abWindow, aBins);
    const bIndex = quantizeRangeIndex(color.b ?? 0, -abWindow, abWindow, bBins);
    const key = `${lIndex}:${aIndex}:${bIndex}`;
    const bucket = histogram.get(key) ?? { l: 0, a: 0, b: 0, count: 0 };
    bucket.l += color.l ?? 0;
    bucket.a += clamp(color.a ?? 0, -abWindow, abWindow);
    bucket.b += clamp(color.b ?? 0, -abWindow, abWindow);
    bucket.count += 1;
    histogram.set(key, bucket);
  }

  const points: WeightedClusterPoint[] = Array.from(histogram.values())
    .map((bucket) => ({
      l: bucket.l / bucket.count,
      a: bucket.a / bucket.count,
      b: bucket.b / bucket.count,
      count: bucket.count,
      sourceCount: 1,
      preserveLongTail: false,
    }))
    .sort((left, right) => right.count - left.count);

  return {
    processedPixels,
    opaquePixels,
    histogramBins: histogram.size,
    points,
  };
}

function pointDistance(left: LabPoint, right: LabPoint) {
  return (left.l - right.l) ** 2 + (left.a - right.a) ** 2 + (left.b - right.b) ** 2;
}

function pointHex(point: LabPoint) {
  const converted = toOklch({ mode: 'oklab', l: point.l, a: point.a, b: point.b });
  return scientificColorFromOklch({
    l: converted?.l ?? 0.5,
    c: converted?.c ?? 0.08,
    h: converted?.h ?? 0,
    alpha: 1,
  }).hex;
}

function pickInitialCentroids(points: WeightedClusterPoint[], k: number) {
  const centroids: WeightedClusterPoint[] = [];
  if (!points.length || k <= 0) {
    return centroids;
  }

  centroids.push(points[0]!);

  while (centroids.length < k) {
    let bestPoint = points[0]!;
    let bestDistance = -1;

    points.forEach((point) => {
      const minDistance = centroids.reduce((minimum, centroid) => Math.min(minimum, pointDistance(point, centroid)), Number.POSITIVE_INFINITY);
      const weightedDistance = minDistance * Math.sqrt(point.count);
      if (weightedDistance > bestDistance) {
        bestDistance = weightedDistance;
        bestPoint = point;
      }
    });

    centroids.push(bestPoint);
  }

  return centroids;
}

function weightedClusterPoints(points: WeightedClusterPoint[], k: number) {
  if (!points.length) {
    return [];
  }

  let centroids = pickInitialCentroids(points, Math.min(k, points.length));
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const groups = centroids.map(() => ({ l: 0, a: 0, b: 0, count: 0, sourceCount: 0 }));

    points.forEach((point) => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      centroids.forEach((centroid, index) => {
        const distance = pointDistance(point, centroid);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      groups[bestIndex]!.l += point.l * point.count;
      groups[bestIndex]!.a += point.a * point.count;
      groups[bestIndex]!.b += point.b * point.count;
      groups[bestIndex]!.count += point.count;
      groups[bestIndex]!.sourceCount += point.sourceCount;
    });

    centroids = groups
      .filter((group) => group.count > 0)
      .map((group) => ({
        l: group.l / group.count,
        a: group.a / group.count,
        b: group.b / group.count,
        count: group.count,
        sourceCount: group.sourceCount,
        preserveLongTail: false,
      }));
  }

  return centroids.sort((left, right) => right.count - left.count);
}

function assessSuitability(hex: string, oklch: { l?: number; c?: number; h?: number }): SuitabilityAssessment {
  const lightness = oklch.l ?? 0.5;
  const chroma = oklch.c ?? 0.08;
  const textContrastOnLight = wcagContrast(hex, editorialBackground);
  const textContrastOnDark = wcagContrast(hex, darkBackground);

  return {
    categorical: chroma >= 0.035 && chroma <= 0.2 && lightness >= 0.26 && lightness <= 0.82,
    gradientEndpoint: chroma >= 0.05 && (lightness <= 0.34 || lightness >= 0.72),
    background: chroma <= 0.03 && (lightness >= 0.9 || lightness <= 0.18),
    text: textContrastOnLight >= 4.5 || textContrastOnDark >= 4.5,
    accent: chroma >= 0.055 && lightness >= 0.24 && lightness <= 0.78,
  };
}

function usageFromAssessment(assessment: SuitabilityAssessment) {
  return Object.entries(assessment)
    .filter(([, value]) => value)
    .map(([key]) => key);
}

function createClusterColor(point: LabPoint, index: number) {
  const oklch = toOklch({ mode: 'oklab', l: point.l, a: point.a, b: point.b });
  const clusterColor = scientificColorFromOklch(
    {
      l: oklch?.l ?? 0.5,
      c: oklch?.c ?? 0.08,
      h: oklch?.h ?? index * 40,
      alpha: 1,
    },
    {
      id: createId('cluster'),
      name: `Cluster ${String(index + 1).padStart(2, '0')}`,
      source: { kind: 'image', detail: 'dominant-cluster' },
      tags: ['image-analysis'],
      usage: [],
      notes: '',
    },
  );
  const assessment = assessSuitability(clusterColor.hex, oklch ?? {});
  const usage = usageFromAssessment(assessment);

  return {
    color: {
      ...clusterColor,
      usage,
      notes: usage.length ? `Suitable for ${usage.join(', ')}.` : 'Needs reconstruction for scientific use.',
    },
    assessment,
  };
}

function shouldPreserveLongTail(cluster: ImageCluster) {
  const maxContrast = Math.max(wcagContrast(cluster.color.hex, editorialBackground), wcagContrast(cluster.color.hex, darkBackground));
  return (
    cluster.percentage >= summaryRetentionThreshold ||
    (cluster.color.oklch.c >= 0.09 && cluster.percentage >= 0.004) ||
    (maxContrast >= 3 && cluster.percentage >= 0.004)
  );
}

function evaluatePoints(points: WeightedClusterPoint[], totalCount: number) {
  return points
    .slice()
    .sort((left, right) => right.count - left.count)
    .map((point, index): EvaluatedCluster => {
      const derived = createClusterColor(point, index);
      const cluster: ImageCluster = {
        id: createId('cluster'),
        color: derived.color,
        count: point.count,
        percentage: point.count / totalCount,
        merged: point.sourceCount > 1,
        assessment: derived.assessment,
      };
      const preserveLongTail = point.preserveLongTail || shouldPreserveLongTail(cluster);
      return {
        point: { ...point, preserveLongTail },
        cluster,
        preserveLongTail,
      };
    });
}

function mergeClusterPoints(points: WeightedClusterPoint[], threshold: number) {
  const sorted = points.slice().sort((left, right) => right.count - left.count);
  const merged: WeightedClusterPoint[] = [];

  sorted.forEach((point) => {
    const currentHex = pointHex(point);
    const existingIndex = merged.findIndex((candidate) => deltaE(pointHex(candidate), currentHex) < threshold);

    if (existingIndex >= 0) {
      const existing = merged[existingIndex]!;
      const totalCount = existing.count + point.count;
      merged[existingIndex] = {
        l: (existing.l * existing.count + point.l * point.count) / totalCount,
        a: (existing.a * existing.count + point.a * point.count) / totalCount,
        b: (existing.b * existing.count + point.b * point.count) / totalCount,
        count: totalCount,
        sourceCount: existing.sourceCount + point.sourceCount,
        preserveLongTail: existing.preserveLongTail || point.preserveLongTail,
      };
      return;
    }

    merged.push({ ...point });
  });

  return merged.sort((left, right) => right.count - left.count);
}

function retainClusters(clusters: EvaluatedCluster[], minimumPercentage: number) {
  const retained = clusters.filter((entry) => entry.cluster.percentage >= minimumPercentage || entry.preserveLongTail);
  return retained.length > 0 ? retained : clusters.slice(0, 1);
}

function clusterScientificScore(cluster: ImageCluster) {
  const assessment = cluster.assessment;
  const contrastSignal = Math.max(wcagContrast(cluster.color.hex, editorialBackground), wcagContrast(cluster.color.hex, darkBackground));
  let score = cluster.percentage * 100;

  if (assessment?.categorical) score += 7;
  if (assessment?.accent) score += 4;
  if (assessment?.gradientEndpoint) score += 3;
  if (assessment?.text) score += 2;
  if (assessment?.background) score -= 2;
  score += Math.min(cluster.color.oklch.c * 24, 4);
  score += Math.min(Math.max(contrastSignal - 3, 0), 3);

  return round(score, 3);
}

function isDistinctCandidate(candidate: ImageCluster, selected: ImageCluster[]) {
  return selected.every((entry) => deltaE(entry.color.hex, candidate.color.hex) >= 8);
}

function buildSuggestedPalette(summaryClusters: ImageCluster[], detailClusters: ImageCluster[]): Palette {
  const selected: ImageCluster[] = [];
  const summaryCandidates = summaryClusters.slice().sort((left, right) => clusterScientificScore(right) - clusterScientificScore(left));

  summaryCandidates.forEach((candidate) => {
    if (selected.length >= 6) {
      return;
    }

    if (!isDistinctCandidate(candidate, selected)) {
      return;
    }

    selected.push(candidate);
  });

  const categoricalCount = selected.filter((cluster) => cluster.assessment?.categorical).length;
  if (categoricalCount < 3 || selected.length < 6) {
    const detailCandidates = detailClusters
      .slice()
      .sort((left, right) => clusterScientificScore(right) - clusterScientificScore(left))
      .filter((candidate) => candidate.assessment?.categorical || candidate.assessment?.accent || candidate.assessment?.gradientEndpoint);

    detailCandidates.forEach((candidate) => {
      if (selected.length >= 6) {
        return;
      }

      if (!isDistinctCandidate(candidate, selected)) {
        return;
      }

      selected.push(candidate);
    });
  }

  const paletteClusters = selected.length > 0 ? selected : summaryCandidates.slice(0, 6);
  const colors = paletteClusters.slice(0, 6).map((cluster) => cluster.color);
  const palette = paletteFromColors('Image-Derived Study Palette', 'qualitative', colors, 'image-analysis');

  return {
    ...palette,
    notes: 'Reconstructed from image clusters with dual-layer extraction and suitability-aware scientific filtering.',
  };
}

function createAnalyzerDiagnostics(
  rawClusters: ImageCluster[],
  detailClusters: EvaluatedCluster[],
  summaryClusters: EvaluatedCluster[],
): DiagnosticItem[] {
  const detailLayer = detailClusters.map((entry) => entry.cluster);
  const summaryLayer = summaryClusters.map((entry) => entry.cluster);
  const items: DiagnosticItem[] = [];
  const categoricalCount = summaryLayer.filter((cluster) => cluster.assessment?.categorical).length;
  const textSafeCount = summaryLayer.filter((cluster) => cluster.assessment?.text).length;
  const backgroundSafeCount = summaryLayer.filter((cluster) => cluster.assessment?.background).length;
  const oversaturated = summaryLayer.filter((cluster) => cluster.color.oklch.c > 0.19);
  const preservedLongTail = detailClusters.filter((entry) => entry.preserveLongTail && entry.cluster.percentage < summaryRetentionThreshold);
  const mergeReduction = detailLayer.length > 0 ? (detailLayer.length - summaryLayer.length) / detailLayer.length : 0;

  if (categoricalCount < 3) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-few-categorical',
      severity: 'warning',
      category: 'analyzer',
      title: 'Few clusters are suitable for categorical use',
      message: 'The image contains limited category-safe colors after perceptual consolidation.',
      suggestion: 'Use the reconstructed palette instead of the raw extraction for multi-series charts.',
    });
  }

  if (textSafeCount === 0) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-no-text-safe',
      severity: 'warning',
      category: 'analyzer',
      title: 'No cluster is strong for text use',
      message: 'Extracted colors are not safe enough for body text on common editorial backgrounds.',
      suggestion: 'Reserve these colors for accents and keep text near-neutral.',
    });
  }

  if (backgroundSafeCount === 0) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-no-background-safe',
      severity: 'info',
      category: 'analyzer',
      title: 'No cluster behaves like a restrained background color',
      message: 'The source image is color-forward and does not naturally provide quiet scaffold tones.',
      suggestion: 'Add a low-chroma neutral background if this palette is used in concept figures or slides.',
    });
  }

  if (oversaturated.length >= 2) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-oversaturated',
      severity: 'warning',
      category: 'analyzer',
      title: 'Several extracted colors are highly saturated',
      message: 'Directly using these clusters may feel too vivid for publication-oriented figures.',
      suggestion: 'Reduce chroma in the suggested palette before using it in manuscripts.',
      relatedColorIds: oversaturated.map((cluster) => cluster.color.id),
    });
  }

  if (rawClusters.length - detailLayer.length >= 2) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-merged-near-duplicates',
      severity: 'info',
      category: 'analyzer',
      title: 'Near-duplicate colors were consolidated',
      message: 'Closely related colors were collapsed to avoid redundant palette entries.',
      suggestion: 'Use the summary layer when you need a cleaner working palette.',
    });
  }

  if (detailLayer.length - summaryLayer.length >= 6) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-high-color-diversity',
      severity: 'info',
      category: 'analyzer',
      title: 'The source image has high color diversity',
      message: 'The detail layer retains many more colors than the summary layer because the image contains several distinct visual strata.',
      suggestion: 'Inspect the detail layer before discarding small accents or annotation colors.',
    });
  }

  if (mergeReduction >= 0.35) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-heavy-merge',
      severity: 'info',
      category: 'analyzer',
      title: 'Summary extraction merges aggressively',
      message: 'A large share of the detail layer was collapsed to keep the summary usable as a scientific palette.',
      suggestion: 'Switch to the detail view if you need to inspect secondary accents or long-tail colors.',
    });
  }

  if (preservedLongTail.length > 0) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-long-tail-preserved',
      severity: 'info',
      category: 'analyzer',
      title: 'Small but meaningful colors were preserved',
      message: 'Long-tail colors with high chroma or strong contrast survived filtering because they may carry annotations or critical emphasis.',
      suggestion: 'Review the preserved detail clusters before finalizing a reconstruction.',
      relatedColorIds: preservedLongTail.map((entry) => entry.cluster.color.id),
    });
  }

  return items;
}

export function analyzePixels(request: AnalyzerWorkerRequest): ImageAnalysisResult {
  const pixels = new Uint8ClampedArray(request.pixels);
  const { processedPixels, opaquePixels, histogramBins, points } = quantizePoints(pixels);
  const requestedClusters = Math.min(modeDefaultClusters[request.options.detailLevel], request.options.maxColors);
  const centroidPoints = weightedClusterPoints(points, requestedClusters);
  const totalCount = centroidPoints.reduce((sum, centroid) => sum + centroid.count, 0) || 1;

  const rawClusters = evaluatePoints(centroidPoints, totalCount);
  const detailMergedPoints = mergeClusterPoints(
    rawClusters.map((entry) => entry.point),
    3.5,
  );
  const detailClusters = retainClusters(evaluatePoints(detailMergedPoints, totalCount), detailRetentionThreshold);
  const summaryMergedPoints = mergeClusterPoints(
    detailClusters.map((entry) => entry.point),
    7,
  );
  const mergedClusters = retainClusters(evaluatePoints(summaryMergedPoints, totalCount), summaryRetentionThreshold);
  const detailLayer = detailClusters.map((entry) => entry.cluster);
  const summaryLayer = mergedClusters.map((entry) => entry.cluster);
  const suggestedPalette = buildSuggestedPalette(summaryLayer, detailLayer);
  const paletteDiagnostics = evaluatePalette(suggestedPalette);
  const analyzerDiagnostics = createAnalyzerDiagnostics(rawClusters.map((entry) => entry.cluster), detailClusters, mergedClusters);
  const diagnostics = buildPaletteDiagnostics(
    Math.max(20, paletteDiagnostics.score - analyzerDiagnostics.filter((item) => item.severity === 'warning').length * 4),
    [...paletteDiagnostics.items, ...analyzerDiagnostics],
  );

  return {
    imageId: request.imageId,
    width: request.width,
    height: request.height,
    clusters: rawClusters.map((entry) => entry.cluster),
    percentages: summaryLayer.map((cluster) => cluster.percentage),
    detailClusters: detailLayer,
    mergedClusters: summaryLayer,
    suggestedPalette: { ...suggestedPalette, diagnostics },
    diagnostics,
    stats: {
      processedPixels,
      opaquePixels,
      resizeScale: round(request.width / Math.max(request.sourceWidth, 1), 4),
      histogramBins,
      detailClusterCount: detailLayer.length,
      summaryClusterCount: summaryLayer.length,
      droppedClusterCount: Math.max(0, rawClusters.length - detailLayer.length),
    },
  };
}

export function imageColorsToCsv(clusters: ImageCluster[]) {
  return ['name,hex,percentage,categorical,gradientEndpoint,background,text,accent']
    .concat(
      clusters.map(
        (cluster) =>
          `${cluster.color.name},${cluster.color.hex},${cluster.percentage},${cluster.assessment?.categorical ?? false},${cluster.assessment?.gradientEndpoint ?? false},${cluster.assessment?.background ?? false},${cluster.assessment?.text ?? false},${cluster.assessment?.accent ?? false}`,
      ),
    )
    .join('\n');
}
