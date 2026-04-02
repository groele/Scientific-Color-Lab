import { create } from 'zustand';
import type { LanguageCode, PersistedSettings, StartupSnapshot } from '@/domain/models';
import { i18n } from '@/i18n';
import { ensureLanguageResources, languageStorageKey } from '@/i18n/resources';
import { scheduleSave } from '@/services/settings-runtime';
import { markStorageDegraded } from '@/services/storage-status';

interface I18nState {
  language: LanguageCode;
  hydrated: boolean;
  fullHydrated: boolean;
  primeFromSnapshot: (snapshot: StartupSnapshot) => void;
  applySettings: (settings: PersistedSettings) => Promise<void>;
  setLanguage: (language: LanguageCode) => Promise<void>;
}

export const useI18nStore = create<I18nState>((set) => ({
  language: (i18n.language === 'zh-CN' ? 'zh-CN' : 'en') as LanguageCode,
  hydrated: false,
  fullHydrated: false,
  primeFromSnapshot: (snapshot) => {
    set({ language: snapshot.language, hydrated: true });
  },
  applySettings: async (settings) => {
    const language = settings.language;
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch (error) {
      markStorageDegraded(error instanceof Error ? error.message : 'Local language storage is unavailable.');
    }
    await ensureLanguageResources(i18n, language);
    await i18n.changeLanguage(language);
    set({ language, hydrated: true, fullHydrated: true });
  },
  setLanguage: async (language) => {
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch (error) {
      markStorageDegraded(error instanceof Error ? error.message : 'Local language storage is unavailable.');
    }
    scheduleSave({ language });
    await ensureLanguageResources(i18n, language);
    await i18n.changeLanguage(language);
    set({ language, hydrated: true, fullHydrated: true });
  },
}));
