import { create } from 'zustand';
import type { DiagnosticThresholds } from '@/domain/models';
import { defaultDiagnosticThresholds } from '@/domain/diagnostics/engine';
import { settingsRepository } from '@/db/repositories';

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
    const current = await settingsRepository.load();
    await settingsRepository.save({
      copyFormat: current?.copyFormat ?? 'hex',
      thresholds,
    });
  },
}));
