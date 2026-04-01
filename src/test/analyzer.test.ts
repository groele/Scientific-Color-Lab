import { describe, expect, it } from 'vitest';
import { analyzePixels } from '@/domain/analyzer/extraction';

function buildPixels() {
  const swatches: Array<[number, number, number, number]> = [];
  const push = (count: number, rgba: [number, number, number, number]) => {
    for (let index = 0; index < count; index += 1) {
      swatches.push(rgba);
    }
  };

  push(32, [49, 93, 136, 255]);
  push(24, [168, 113, 67, 255]);
  push(16, [17, 18, 19, 255]);
  push(12, [234, 236, 234, 255]);
  push(8, [34, 133, 122, 255]);
  push(6, [191, 76, 166, 255]);
  push(1, [240, 204, 68, 255]);
  push(1, [136, 207, 86, 255]);
  push(4, [240, 240, 240, 0]);

  return new Uint8ClampedArray(swatches.flat());
}

describe('image analyzer', () => {
  it('extracts both summary and detail layers from RGBA pixels', () => {
    const pixels = buildPixels();

    const result = analyzePixels({
      requestId: 'fixture-request',
      imageId: 'fixture-image',
      sourceWidth: 26,
      sourceHeight: 4,
      width: 26,
      height: 4,
      pixels: pixels.buffer,
      options: {
        detailLevel: 'balanced',
        maxColors: 16,
      },
    });

    expect(result.detailClusters.length).toBeGreaterThan(0);
    expect(result.mergedClusters.length).toBeGreaterThan(0);
    expect(result.detailClusters.length).toBeGreaterThanOrEqual(result.mergedClusters.length);
    expect(result.suggestedPalette.colors.length).toBeGreaterThan(0);
    expect(result.stats.detailClusterCount).toBe(result.detailClusters.length);
    expect(result.stats.summaryClusterCount).toBe(result.mergedClusters.length);
    expect(result.stats.opaquePixels).toBe(100);
    expect(result.detailClusters.some((cluster) => cluster.assessment?.categorical)).toBe(true);
    expect(result.diagnostics.items.length).toBeGreaterThan(0);
  });

  it('retains long-tail accent colors in the detail layer', () => {
    const pixels = buildPixels();

    const result = analyzePixels({
      requestId: 'long-tail-request',
      imageId: 'long-tail-image',
      sourceWidth: 26,
      sourceHeight: 4,
      width: 26,
      height: 4,
      pixels: pixels.buffer,
      options: {
        detailLevel: 'complete',
        maxColors: 24,
      },
    });

    expect(
      result.detailClusters.some((cluster) => cluster.percentage < 0.05 && cluster.color.oklch.c >= 0.09),
    ).toBe(true);
    expect(
      result.diagnostics.items.some(
        (item) => item.code === 'analyzer-long-tail-preserved' || item.code === 'analyzer-high-color-diversity',
      ),
    ).toBe(true);
  });

  it('respects the maxColors ceiling for richer extraction modes', () => {
    const pixels = buildPixels();

    const compactResult = analyzePixels({
      requestId: 'compact-request',
      imageId: 'compact-image',
      sourceWidth: 26,
      sourceHeight: 4,
      width: 26,
      height: 4,
      pixels: pixels.buffer.slice(0),
      options: {
        detailLevel: 'complete',
        maxColors: 8,
      },
    });

    const completeResult = analyzePixels({
      requestId: 'complete-request',
      imageId: 'complete-image',
      sourceWidth: 26,
      sourceHeight: 4,
      width: 26,
      height: 4,
      pixels: pixels.buffer.slice(0),
      options: {
        detailLevel: 'complete',
        maxColors: 24,
      },
    });

    expect(compactResult.detailClusters.length).toBeLessThanOrEqual(8);
    expect(completeResult.detailClusters.length).toBeLessThanOrEqual(20);
    expect(completeResult.detailClusters.length).toBeGreaterThanOrEqual(compactResult.detailClusters.length);
  });
});
