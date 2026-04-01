import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scientificColorFromString } from '@/domain/color/convert';
import { paletteFromColors } from '@/domain/color/palette';
import type { ImageAnalysisResult } from '@/domain/models';

const analyzerMocks = vi.hoisted(() => {
  class MockImageAnalysisClientError extends Error {
    code: 'decode-failure' | 'canvas-unavailable' | 'worker-failure' | 'stale-result-discarded';

    constructor(code: 'decode-failure' | 'canvas-unavailable' | 'worker-failure' | 'stale-result-discarded', message: string) {
      super(message);
      this.name = 'ImageAnalysisClientError';
      this.code = code;
    }
  }

  return {
    loadImagePixels: vi.fn(),
    analyzePixelsWithWorker: vi.fn(),
    ImageAnalysisClientError: MockImageAnalysisClientError,
  };
});

vi.mock('@/lib/image-worker-client', () => analyzerMocks);

import { useAnalyzerStore } from '@/stores/analyzer-store';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((resolver, rejecter) => {
    resolve = resolver;
    reject = rejecter;
  });

  return { promise, resolve, reject };
}

function sampleResult(imageId: string, hex: string): ImageAnalysisResult {
  const color = scientificColorFromString(hex, {
    id: `color-${imageId}`,
    name: `Color ${imageId}`,
    source: { kind: 'image', detail: 'test' },
    tags: ['test'],
    usage: ['categorical'],
    notes: '',
  });
  const cluster = {
    id: `cluster-${imageId}`,
    color,
    count: 10,
    percentage: 1,
    merged: false,
    assessment: {
      categorical: true,
      gradientEndpoint: true,
      background: false,
      text: true,
      accent: true,
    },
  };
  const palette = paletteFromColors(`Palette ${imageId}`, 'qualitative', [color], 'import');

  return {
    imageId,
    width: 1,
    height: 1,
    clusters: [cluster],
    percentages: [1],
    detailClusters: [cluster],
    mergedClusters: [cluster],
    suggestedPalette: palette,
    diagnostics: palette.diagnostics,
    stats: {
      processedPixels: 1,
      opaquePixels: 1,
      resizeScale: 1,
      histogramBins: 1,
      detailClusterCount: 1,
      summaryClusterCount: 1,
      droppedClusterCount: 0,
    },
  };
}

describe('analyzer store request freshness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const ids = ['request-a', 'image-a', 'request-b', 'image-b'];
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => ids.shift() ?? `request-${Math.random()}`) });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });

    analyzerMocks.loadImagePixels.mockResolvedValue({
      sourceWidth: 1,
      sourceHeight: 1,
      width: 1,
      height: 1,
      pixels: new ArrayBuffer(4),
    });

    useAnalyzerStore.setState({
      result: null,
      previewUrl: null,
      sourceFile: null,
      isAnalyzing: false,
      activeRequestId: null,
      analysisStatus: 'idle',
      notice: null,
      error: null,
      errorCode: null,
      options: { detailLevel: 'balanced', maxColors: 16 },
      clusterLayer: 'summary',
      selectedClusterId: null,
      selectedSuggestedColorId: null,
    });
  });

  it('keeps only the latest completed analysis result', async () => {
    const first = deferred<ImageAnalysisResult>();
    const second = deferred<ImageAnalysisResult>();

    analyzerMocks.analyzePixelsWithWorker.mockImplementation(({ requestId }: { requestId: string }) =>
      requestId === 'request-a' ? first.promise : second.promise,
    );

    const firstFile = new File(['first'], 'first.png', { type: 'image/png' });
    const secondFile = new File(['second'], 'second.png', { type: 'image/png' });

    const firstRun = useAnalyzerStore.getState().analyzeFile(firstFile);
    const secondRun = useAnalyzerStore.getState().analyzeFile(secondFile);

    second.resolve(sampleResult('second', '#2563EB'));
    await secondRun;

    first.resolve(sampleResult('first', '#EF4444'));
    await firstRun;

    const state = useAnalyzerStore.getState();
    expect(state.result?.imageId).toBe('second');
    expect(state.analysisStatus).toBe('updated');
    expect(state.notice).toBe('updated');
    expect(state.selectedClusterId).toBe('cluster-second');
  });
});
