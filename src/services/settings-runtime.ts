import { useSyncExternalStore } from 'react';
import type { PersistedSettings, StartupSnapshot, WorkspaceView } from '@/domain/models';
import { defaultSettings, settingsRepository } from '@/db/repositories';
import { clearStorageDegraded, markStorageDegraded } from '@/services/storage-status';

const startupSnapshotKey = 'scientific-color-lab-startup-snapshot';
const startupSnapshotVersion = 1;
const settingsSaveDebounceMs = 300;
const settingsSavedMessageDurationMs = 1200;

let queuedPatch: Partial<PersistedSettings> = {};
let saveTimer: number | null = null;
let flushChain = Promise.resolve<PersistedSettings>({ ...defaultSettings });
let saveStateResetTimer: number | null = null;

type SettingsSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SettingsRuntimeState {
  saveStatus: SettingsSaveStatus;
  message: string | null;
}

let runtimeState: SettingsRuntimeState = {
  saveStatus: 'idle',
  message: null,
};
const runtimeListeners = new Set<() => void>();

function emitRuntimeState() {
  runtimeListeners.forEach((listener) => listener());
}

function setRuntimeState(next: SettingsRuntimeState) {
  runtimeState = next;
  emitRuntimeState();
}

function scheduleSaveStateReset() {
  if (saveStateResetTimer) {
    window.clearTimeout(saveStateResetTimer);
  }

  saveStateResetTimer = window.setTimeout(() => {
    setRuntimeState({ saveStatus: 'idle', message: null });
  }, settingsSavedMessageDurationMs);
}

function snapshotFromSettings(source: Partial<PersistedSettings>, existing?: StartupSnapshot | null): StartupSnapshot {
  return {
    version: startupSnapshotVersion,
    language: source.language ?? existing?.language ?? defaultSettings.language,
    backgroundMode: source.backgroundMode ?? existing?.backgroundMode ?? defaultSettings.backgroundMode,
    copyFormat: source.copyFormat ?? existing?.copyFormat ?? defaultSettings.copyFormat,
    showWelcome: source.showWelcome ?? existing?.showWelcome ?? defaultSettings.showWelcome,
    lastWorkspaceRoute: existing?.lastWorkspaceRoute,
    activeView: existing?.activeView,
    updatedAt: new Date().toISOString(),
  };
}

function persistSnapshot(snapshot: StartupSnapshot) {
  try {
    window.localStorage.setItem(startupSnapshotKey, JSON.stringify(snapshot));
  } catch (error) {
    markStorageDegraded(error instanceof Error ? error.message : 'Unable to persist startup snapshot.');
  }
}

export function loadStartupSnapshot(): StartupSnapshot | null {
  try {
    const raw = window.localStorage.getItem(startupSnapshotKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StartupSnapshot>;
    if (parsed.version !== startupSnapshotVersion) {
      window.localStorage.removeItem(startupSnapshotKey);
      return null;
    }

    if (
      (parsed.language !== 'en' && parsed.language !== 'zh-CN') ||
      (parsed.backgroundMode !== 'light' && parsed.backgroundMode !== 'dark') ||
      !parsed.copyFormat ||
      typeof parsed.showWelcome !== 'boolean'
    ) {
      window.localStorage.removeItem(startupSnapshotKey);
      return null;
    }

    return {
      version: startupSnapshotVersion,
      language: parsed.language,
      backgroundMode: parsed.backgroundMode,
      copyFormat: parsed.copyFormat,
      showWelcome: parsed.showWelcome,
      lastWorkspaceRoute: parsed.lastWorkspaceRoute,
      activeView: parsed.activeView,
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
    };
  } catch (error) {
    markStorageDegraded(error instanceof Error ? error.message : 'Unable to read startup snapshot.');
    return null;
  }
}

export function saveStartupSnapshot(source: Partial<PersistedSettings>, lastWorkspaceRoute?: string, activeView?: WorkspaceView) {
  const current = loadStartupSnapshot();
  const snapshot = snapshotFromSettings(source, current);
  if (lastWorkspaceRoute !== undefined) {
    snapshot.lastWorkspaceRoute = lastWorkspaceRoute;
  }
  if (activeView !== undefined) {
    snapshot.activeView = activeView;
  }
  persistSnapshot(snapshot);
  return snapshot;
}

export function clearStartupSnapshot() {
  try {
    window.localStorage.removeItem(startupSnapshotKey);
  } catch (error) {
    markStorageDegraded(error instanceof Error ? error.message : 'Unable to clear startup snapshot.');
  }
}

export async function loadFullSettings() {
  const settings = await settingsRepository.load();
  saveStartupSnapshot(settings);
  clearStorageDegraded();
  return settings;
}

export function scheduleSave(partial: Partial<PersistedSettings>) {
  queuedPatch = { ...queuedPatch, ...partial };
  saveStartupSnapshot(queuedPatch);
  setRuntimeState({ saveStatus: 'saving', message: null });
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    void flush();
  }, settingsSaveDebounceMs);
}

export function flush() {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }

  if (!Object.keys(queuedPatch).length) {
    return flushChain;
  }

  const patch = queuedPatch;
  queuedPatch = {};
  flushChain = flushChain
    .catch(() => ({ ...defaultSettings }))
    .then(async () => {
      try {
        const settings = await settingsRepository.save(patch);
        saveStartupSnapshot(settings);
        setRuntimeState({ saveStatus: 'saved', message: null });
        scheduleSaveStateReset();
        return settings;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save settings.';
        setRuntimeState({ saveStatus: 'error', message });
        throw error;
      }
    });

  return flushChain;
}

export function subscribeToSettingsRuntime(listener: () => void) {
  runtimeListeners.add(listener);
  return () => {
    runtimeListeners.delete(listener);
  };
}

export function getSettingsRuntimeState() {
  return runtimeState;
}

export function useSettingsRuntimeState() {
  return useSyncExternalStore(subscribeToSettingsRuntime, getSettingsRuntimeState, getSettingsRuntimeState);
}
