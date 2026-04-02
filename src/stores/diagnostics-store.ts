import { create } from 'zustand';
import type { DiagnosticThresholds, PersistedSettings } from '@/domain/models';
import { defaultDiagnosticThresholds } from '@/domain/diagnostics/engine';
import { scheduleSave } from '@/services/settings-runtime';

interface DiagnosticsState {
  thresholds: DiagnosticThresholds;
  hydrated: boolean;
  applySettings: (settings: PersistedSettings) => void;
  setThreshold: <K extends keyof DiagnosticThresholds>(key: K, value: DiagnosticThresholds[K]) => Promise<void>;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  thresholds: defaultDiagnosticThresholds,
  hydrated: false,
  applySettings: (settings) => set({ thresholds: settings.thresholds ?? defaultDiagnosticThresholds, hydrated: true }),
  setThreshold: async (key, value) => {
    const thresholds = { ...get().thresholds, [key]: value };
    set({ thresholds });
    scheduleSave({ thresholds });
  },
}));
