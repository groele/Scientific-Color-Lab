import { create } from 'zustand';
import type { BackgroundMode, CopyFormat } from '@/domain/models';
import { settingsRepository } from '@/db/repositories';

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
    await settingsRepository.save({ copyFormat });
    set({ copyFormat });
  },
  setBackgroundMode: async (backgroundMode) => {
    await settingsRepository.save({ backgroundMode });
    set({ backgroundMode });
  },
  setShowWelcome: async (showWelcome) => {
    await settingsRepository.save({ showWelcome });
    set({ showWelcome });
  },
  setRecentProjectId: async (recentProjectId) => {
    await settingsRepository.save({ recentProjectId });
    set({ recentProjectId });
  },
}));
