import { create } from 'zustand';
import type { AnalyzerClusterLayer, AnalyzerOptions, ImageAnalysisResult } from '@/domain/models';
import { analyzePixelsWithWorker, loadImagePixels } from '@/lib/image-worker-client';

const defaultOptions: AnalyzerOptions = {
  detailLevel: 'balanced',
  maxColors: 16,
};

interface AnalyzerState {
  result: ImageAnalysisResult | null;
  previewUrl: string | null;
  sourceFile: File | null;
  isAnalyzing: boolean;
  error: string | null;
  options: AnalyzerOptions;
  clusterLayer: AnalyzerClusterLayer;
  selectedClusterId: string | null;
  selectedSuggestedColorId: string | null;
  analyzeFile: (file: File, preservePreview?: boolean) => Promise<void>;
  analyzeBlob: (blob: Blob, label?: string) => Promise<void>;
  setOptions: (options: Partial<AnalyzerOptions>) => Promise<void>;
  setClusterLayer: (layer: AnalyzerClusterLayer) => void;
  selectCluster: (clusterId: string | null) => void;
  selectSuggestedColor: (colorId: string | null) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

function clearPreviewUrl(previewUrl: string | null) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
}

function clustersForLayer(result: ImageAnalysisResult | null, layer: AnalyzerClusterLayer) {
  if (!result) {
    return [];
  }

  return layer === 'detail' ? result.detailClusters : result.mergedClusters;
}

export const useAnalyzerStore = create<AnalyzerState>((set, get) => ({
  result: null,
  previewUrl: null,
  sourceFile: null,
  isAnalyzing: false,
  error: null,
  options: defaultOptions,
  clusterLayer: 'summary',
  selectedClusterId: null,
  selectedSuggestedColorId: null,
  analyzeFile: async (file, preservePreview = false) => {
    const current = get();
    if (!preservePreview) {
      clearPreviewUrl(current.previewUrl);
    }

    set({
      isAnalyzing: true,
      error: null,
      sourceFile: file,
      previewUrl: preservePreview && current.previewUrl ? current.previewUrl : URL.createObjectURL(file),
      selectedClusterId: null,
      selectedSuggestedColorId: null,
    });

    try {
      const options = get().options;
      const image = await loadImagePixels(file, options);
      const result = await analyzePixelsWithWorker({
        imageId: crypto.randomUUID(),
        sourceWidth: image.sourceWidth,
        sourceHeight: image.sourceHeight,
        width: image.width,
        height: image.height,
        pixels: image.pixels,
        options,
      });

      const layerClusters = clustersForLayer(result, get().clusterLayer);
      set({
        result,
        isAnalyzing: false,
        selectedClusterId: layerClusters[0]?.id ?? null,
        selectedSuggestedColorId: result.suggestedPalette.colors[0]?.id ?? null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to analyze image.',
        isAnalyzing: false,
        result: null,
        selectedClusterId: null,
        selectedSuggestedColorId: null,
      });
    }
  },
  analyzeBlob: async (blob, label = 'pasted-image.png') => {
    const file = new File([blob], label, { type: blob.type || 'image/png' });
    await get().analyzeFile(file);
  },
  setOptions: async (nextOptions) => {
    const previous = get().options;
    const options = { ...previous, ...nextOptions };
    set({ options });

    const sourceFile = get().sourceFile;
    if (sourceFile && !get().isAnalyzing) {
      await get().analyzeFile(sourceFile, true);
    }
  },
  setClusterLayer: (clusterLayer) => {
    const result = get().result;
    const layerClusters = clustersForLayer(result, clusterLayer);
    set({
      clusterLayer,
      selectedClusterId: layerClusters[0]?.id ?? null,
      selectedSuggestedColorId: null,
    });
  },
  selectCluster: (selectedClusterId) =>
    set({
      selectedClusterId,
      selectedSuggestedColorId: selectedClusterId ? null : get().selectedSuggestedColorId,
    }),
  selectSuggestedColor: (selectedSuggestedColorId) =>
    set({
      selectedSuggestedColorId,
      selectedClusterId: selectedSuggestedColorId ? null : get().selectedClusterId,
    }),
  setError: (error) => set({ error }),
  clear: () => {
    clearPreviewUrl(get().previewUrl);
    set({
      result: null,
      previewUrl: null,
      sourceFile: null,
      error: null,
      isAnalyzing: false,
      selectedClusterId: null,
      selectedSuggestedColorId: null,
      clusterLayer: 'summary',
    });
  },
}));
