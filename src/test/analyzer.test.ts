import { describe, expect, it } from 'vitest';
import { analyzePixels } from '@/domain/analyzer/extraction';

describe('image analyzer', () => {
  it('extracts dominant clusters from RGBA pixels', () => {
    const pixels = new Uint8ClampedArray([
      49, 93, 136, 255,
      49, 93, 136, 255,
      168, 113, 67, 255,
      168, 113, 67, 255,
      17, 18, 19, 255,
      17, 18, 19, 255,
      234, 236, 234, 255,
      234, 236, 234, 255,
    ]);

    const result = analyzePixels({
      imageId: 'fixture-image',
      width: 4,
      height: 2,
      pixels: pixels.buffer,
    });

    expect(result.mergedClusters.length).toBeGreaterThan(0);
    expect(result.suggestedPalette.colors.length).toBeGreaterThan(0);
    expect(result.mergedClusters.some((cluster) => cluster.assessment?.categorical)).toBe(true);
    expect(result.diagnostics.items.length).toBeGreaterThan(0);
  });
});
