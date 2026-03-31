import { create } from 'zustand';
import type { ImageAnalysisResult } from '@/domain/models';
import { analyzePixelsWithWorker, loadImagePixels } from '@/lib/image-worker-client';

interface AnalyzerState {
  result: ImageAnalysisResult | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  error: string | null;
  selectedClusterId: string | null;
  selectedSuggestedColorId: string | null;
  analyzeFile: (file: File) => Promise<void>;
  analyzeBlob: (blob: Blob, label?: string) => Promise<void>;
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

export const useAnalyzerStore = create<AnalyzerState>((set, get) => ({
  result: null,
  previewUrl: null,
  isAnalyzing: false,
  error: null,
  selectedClusterId: null,
  selectedSuggestedColorId: null,
  analyzeFile: async (file) => {
    clearPreviewUrl(get().previewUrl);

    set({
      isAnalyzing: true,
      error: null,
      previewUrl: URL.createObjectURL(file),
      selectedClusterId: null,
      selectedSuggestedColorId: null,
    });

    try {
      const image = await loadImagePixels(file);
      const result = await analyzePixelsWithWorker({
        imageId: crypto.randomUUID(),
        width: image.width,
        height: image.height,
        pixels: image.pixels,
      });

      set({
        result,
        isAnalyzing: false,
        selectedClusterId: result.mergedClusters[0]?.id ?? null,
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
      error: null,
      isAnalyzing: false,
      selectedClusterId: null,
      selectedSuggestedColorId: null,
    });
  },
}));
