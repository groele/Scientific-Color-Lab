import { converter, differenceCiede2000, wcagContrast } from 'culori';
import type {
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

const toOklab = converter('oklab');
const toOklch = converter('oklch');
const deltaE = differenceCiede2000();
const editorialBackground = '#f6f5f1';
const darkBackground = '#131619';

function pickInitialCentroids(points: LabPoint[], k: number) {
  const centroids: LabPoint[] = [];
  if (!points.length) {
    return centroids;
  }

  centroids.push(points[0]!);
  while (centroids.length < k) {
    let bestPoint = points[0]!;
    let bestDistance = -1;

    points.forEach((point) => {
      const distance = centroids.reduce((minimum, centroid) => {
        const delta = (point.l - centroid.l) ** 2 + (point.a - centroid.a) ** 2 + (point.b - centroid.b) ** 2;
        return Math.min(minimum, delta);
      }, Number.POSITIVE_INFINITY);

      if (distance > bestDistance) {
        bestDistance = distance;
        bestPoint = point;
      }
    });

    centroids.push(bestPoint);
  }

  return centroids;
}

function clusterPoints(points: LabPoint[], k: number) {
  let centroids = pickInitialCentroids(points, k);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const groups = centroids.map(() => ({ l: 0, a: 0, b: 0, count: 0 }));

    points.forEach((point) => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      centroids.forEach((centroid, index) => {
        const distance = (point.l - centroid.l) ** 2 + (point.a - centroid.a) ** 2 + (point.b - centroid.b) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      groups[bestIndex]!.l += point.l * point.count;
      groups[bestIndex]!.a += point.a * point.count;
      groups[bestIndex]!.b += point.b * point.count;
      groups[bestIndex]!.count += point.count;
    });

    centroids = groups
      .filter((group) => group.count > 0)
      .map((group) => ({
        l: group.l / group.count,
        a: group.a / group.count,
        b: group.b / group.count,
        count: group.count,
      }));
  }

  return centroids;
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
  const hexCandidate = scientificColorFromOklch(
    { l: oklch?.l ?? 0.5, c: oklch?.c ?? 0.08, h: oklch?.h ?? index * 40, alpha: 1 },
    {
      id: createId('cluster'),
      name: `Cluster ${index + 1}`,
      source: { kind: 'image', detail: 'dominant-cluster' },
      tags: ['image-analysis'],
      usage: [],
      notes: '',
    },
  );
  const assessment = assessSuitability(hexCandidate.hex, oklch ?? {});

  return {
    color: {
      ...hexCandidate,
      usage: usageFromAssessment(assessment),
      notes: usageFromAssessment(assessment).length ? `Suitable for ${usageFromAssessment(assessment).join(', ')}.` : 'Needs reconstruction for scientific use.',
    },
    assessment,
  };
}

function mergeNearbyClusters(clusters: ImageCluster[]) {
  const merged: ImageCluster[] = [];
  clusters.forEach((cluster) => {
    const existing = merged.find((candidate) => deltaE(candidate.color.hex, cluster.color.hex) < 8);
    if (existing) {
      existing.count += cluster.count;
      existing.percentage += cluster.percentage;
      existing.merged = true;
      return;
    }

    merged.push({ ...cluster });
  });

  return merged.sort((left, right) => right.count - left.count);
}

function clusterScientificScore(cluster: ImageCluster) {
  const assessment = cluster.assessment;
  if (!assessment) {
    return cluster.percentage;
  }

  let score = cluster.percentage * 10;
  if (assessment.categorical) score += 5;
  if (assessment.accent) score += 3;
  if (assessment.gradientEndpoint) score += 2;
  if (assessment.background) score -= 1;
  return score;
}

function buildSuggestedPalette(clusters: ImageCluster[]): Palette {
  const colors = clusters
    .slice()
    .sort((left, right) => clusterScientificScore(right) - clusterScientificScore(left))
    .slice(0, 6)
    .map((cluster) => cluster.color);

  const palette = paletteFromColors('Image-Derived Study Palette', 'qualitative', colors, 'image-analysis');
  return {
    ...palette,
    notes: 'Reconstructed from image clusters with suitability-aware scientific filtering.',
  };
}

function createAnalyzerDiagnostics(clusters: ImageCluster[], mergedClusters: ImageCluster[]): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];
  const categoricalCount = mergedClusters.filter((cluster) => cluster.assessment?.categorical).length;
  const textSafeCount = mergedClusters.filter((cluster) => cluster.assessment?.text).length;
  const backgroundSafeCount = mergedClusters.filter((cluster) => cluster.assessment?.background).length;
  const oversaturated = mergedClusters.filter((cluster) => cluster.color.oklch.c > 0.19);

  if (categoricalCount < 3) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-few-categorical',
      severity: 'warning',
      category: 'analyzer',
      title: 'Few clusters are suitable for categorical use',
      message: 'The image contains limited category-safe colors after perceptual merging.',
      suggestion: 'Use the reconstructed palette instead of the raw image clusters for multi-series charts.',
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

  if (clusters.length - mergedClusters.length >= 2) {
    items.push({
      id: createId('diagnostic'),
      code: 'analyzer-merged-near-duplicates',
      severity: 'info',
      category: 'analyzer',
      title: 'Near-duplicate clusters were merged',
      message: 'Several extracted colors were perceptually close and have already been collapsed.',
      suggestion: 'Use the merged set to avoid redundant palette entries.',
    });
  }

  return items;
}

export function analyzePixels(request: AnalyzerWorkerRequest): ImageAnalysisResult {
  const pixels = new Uint8ClampedArray(request.pixels);
  const step = Math.max(1, Math.floor((pixels.length / 4) / 2400));
  const points: LabPoint[] = [];

  for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += step * 4) {
    const alpha = pixels[pixelIndex + 3] ?? 0;
    if (alpha < 32) {
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

    points.push({ l: color.l ?? 0, a: color.a ?? 0, b: color.b ?? 0, count: 1 });
  }

  const k = Math.min(8, Math.max(4, Math.round(Math.sqrt(points.length / 150))));
  const centroids = clusterPoints(points, k);
  const totalCount = centroids.reduce((sum, centroid) => sum + centroid.count, 0) || 1;

  const clusters: ImageCluster[] = centroids
    .map((centroid, index) => {
      const derived = createClusterColor(centroid, index);
      return {
        id: createId('cluster'),
        color: derived.color,
        count: centroid.count,
        percentage: centroid.count / totalCount,
        merged: false,
        assessment: derived.assessment,
      };
    })
    .sort((left, right) => right.count - left.count);

  const mergedClusters = mergeNearbyClusters(clusters);
  const suggestedPalette = buildSuggestedPalette(mergedClusters);
  const paletteDiagnostics = evaluatePalette(suggestedPalette);
  const analyzerDiagnostics = createAnalyzerDiagnostics(clusters, mergedClusters);
  const diagnostics = buildPaletteDiagnostics(
    Math.max(20, paletteDiagnostics.score - analyzerDiagnostics.filter((item) => item.severity === 'warning').length * 4),
    [...paletteDiagnostics.items, ...analyzerDiagnostics],
  );

  return {
    imageId: request.imageId,
    width: request.width,
    height: request.height,
    clusters,
    percentages: clusters.map((cluster) => cluster.percentage),
    mergedClusters,
    suggestedPalette: { ...suggestedPalette, diagnostics },
    diagnostics,
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
