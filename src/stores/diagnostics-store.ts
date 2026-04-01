import { create } from 'zustand';
import type { DiagnosticThresholds } from '@/domain/models';
import { defaultDiagnosticThresholds } from '@/domain/diagnostics/engine';
import { settingsRepository } from '@/db/repositories';

let persistTimer: number | null = null;

interface DiagnosticsState {
  thresholds: DiagnosticThresholds;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setThreshold: <K extends keyof DiagnosticThresholds>(key: K, value: DiagnosticThresholds[K]) => Promise<void>;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  thresholds: defaultDiagnosticThresholds,
  hydrated: false,
  hydrate: async () => {
    const settings = await settingsRepository.load();
    if (settings?.thresholds) {
      set({ thresholds: settings.thresholds, hydrated: true });
      return;
    }

    set({ hydrated: true });
  },
  setThreshold: async (key, value) => {
    const thresholds = { ...get().thresholds, [key]: value };
    set({ thresholds });
    if (persistTimer) {
      window.clearTimeout(persistTimer);
    }

    persistTimer = window.setTimeout(() => {
      void settingsRepository.save({ thresholds });
    }, 250);
  },
}));
