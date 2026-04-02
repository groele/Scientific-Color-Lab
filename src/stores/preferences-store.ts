import { create } from 'zustand';
import type { BackgroundMode, CopyFormat, PersistedSettings, StartupSnapshot } from '@/domain/models';
import { scheduleSave } from '@/services/settings-runtime';

interface PreferencesState {
  copyFormat: CopyFormat;
  backgroundMode: BackgroundMode;
  showWelcome: boolean;
  recentProjectId?: string;
  hydrated: boolean;
  primeFromSnapshot: (snapshot: StartupSnapshot) => void;
  applySettings: (settings: PersistedSettings) => void;
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
  primeFromSnapshot: (snapshot) =>
    set({
      copyFormat: snapshot.copyFormat,
      backgroundMode: snapshot.backgroundMode,
      showWelcome: snapshot.showWelcome,
    }),
  applySettings: (settings) => {
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
    scheduleSave({ copyFormat });
  },
  setBackgroundMode: async (backgroundMode) => {
    set({ backgroundMode });
    scheduleSave({ backgroundMode });
  },
  setShowWelcome: async (showWelcome) => {
    set({ showWelcome });
    scheduleSave({ showWelcome });
  },
  setRecentProjectId: async (recentProjectId) => {
    set({ recentProjectId });
    scheduleSave({ recentProjectId });
  },
}));
