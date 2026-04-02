import { beforeEach, describe, expect, it, vi } from 'vitest';

const settingsMocks = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  clearStorageDegraded: vi.fn(),
  markStorageDegraded: vi.fn(),
}));

vi.mock('@/db/repositories', () => ({
  defaultSettings: {
    language: 'en',
    copyFormat: 'hex',
    thresholds: {
      categoricalDeltaE: 10,
      minimumContrast: 3,
      maxQualitativeColors: 7,
      maximumChroma: 0.22,
    },
    backgroundMode: 'light',
    showWelcome: true,
  },
  settingsRepository: {
    load: settingsMocks.load,
    save: settingsMocks.save,
  },
}));

vi.mock('@/services/storage-status', () => ({
  clearStorageDegraded: settingsMocks.clearStorageDegraded,
  markStorageDegraded: settingsMocks.markStorageDegraded,
}));

import {
  clearStartupSnapshot,
  flush,
  getSettingsRuntimeState,
  loadStartupSnapshot,
  saveStartupSnapshot,
  scheduleSave,
} from '@/services/settings-runtime';

describe('settings-runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    clearStartupSnapshot();
  });

  it('stores and restores startup snapshot with active view metadata', () => {
    saveStartupSnapshot(
      {
        language: 'en',
        backgroundMode: 'dark',
        copyFormat: 'rgb',
        showWelcome: false,
      },
      '/workspace?view=pairing',
      'pairing',
    );

    expect(loadStartupSnapshot()).toMatchObject({
      language: 'en',
      backgroundMode: 'dark',
      copyFormat: 'rgb',
      showWelcome: false,
      lastWorkspaceRoute: '/workspace?view=pairing',
      activeView: 'pairing',
    });
  });

  it('merges queued settings saves and exposes save status', async () => {
    settingsMocks.save.mockResolvedValue({
      language: 'en',
      copyFormat: 'rgb',
      thresholds: {
        categoricalDeltaE: 10,
        minimumContrast: 3,
        maxQualitativeColors: 7,
        maximumChroma: 0.22,
      },
      backgroundMode: 'dark',
      showWelcome: true,
    });

    scheduleSave({ copyFormat: 'rgb' });
    scheduleSave({ backgroundMode: 'dark' });

    expect(getSettingsRuntimeState().saveStatus).toBe('saving');

    await flush();

    expect(settingsMocks.save).toHaveBeenCalledWith({ copyFormat: 'rgb', backgroundMode: 'dark' });
    expect(getSettingsRuntimeState().saveStatus).toBe('saved');
  });
});
