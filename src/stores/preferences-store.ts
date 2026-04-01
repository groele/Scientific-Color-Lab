import { create } from 'zustand';
import type { BackgroundMode, CopyFormat } from '@/domain/models';
import { settingsRepository } from '@/db/repositories';

let persistTimer: number | null = null;

function schedulePreferenceSave(nextPartial: {
  copyFormat?: CopyFormat;
  backgroundMode?: BackgroundMode;
  showWelcome?: boolean;
  recentProjectId?: string;
}) {
  if (persistTimer) {
    window.clearTimeout(persistTimer);
  }

  persistTimer = window.setTimeout(() => {
    void settingsRepository.save(nextPartial);
  }, 250);
}

interface PreferencesState {
  copyFormat: CopyFormat;
  backgroundMode: BackgroundMode;
  showWelcome: boolean;
  recentProjectId?: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setCopyFormat: (copyFormat: CopyFormat) => Promise<void>;
  setBackgroundMode: (backgroundMode: BackgroundMode) => Promise<void>;
  setShowWelcome: (showWelcome: boolean) => Promise<void>;
  setRecentProjectId: (recentProjectId?: string) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  copyFormat: 'hex',
  backgroundMode: 'light',
  showWelcome: true,
  recentProjectId: undefined,
  hydrated: false,
  hydrate: async () => {
    const settings = await settingsRepository.load();
    set({
      copyFormat: settings.copyFormat,
      backgroundMode: settings.backgroundMode,
      showWelcome: settings.showWelcome,
      recentProjectId: settings.recentProjectId,
      hydrated: true,
    });
  },
  setCopyFormat: async (copyFormat) => {
    set({ copyFormat });
    schedulePreferenceSave({ copyFormat });
  },
  setBackgroundMode: async (backgroundMode) => {
    set({ backgroundMode });
    schedulePreferenceSave({ backgroundMode });
  },
  setShowWelcome: async (showWelcome) => {
    set({ showWelcome });
    schedulePreferenceSave({ showWelcome });
  },
  setRecentProjectId: async (recentProjectId) => {
    set({ recentProjectId });
    schedulePreferenceSave({ recentProjectId });
  },
}));
