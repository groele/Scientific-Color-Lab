import { create } from 'zustand';
import type { LanguageCode } from '@/domain/models';
import { settingsRepository } from '@/db/repositories';
import { i18n } from '@/i18n';
import { ensureLanguageResources, languageStorageKey } from '@/i18n/resources';
import { markStorageDegraded } from '@/services/storage-status';

interface I18nState {
  language: LanguageCode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: LanguageCode) => Promise<void>;
}

export const useI18nStore = create<I18nState>((set) => ({
  language: (i18n.language === 'zh-CN' ? 'zh-CN' : 'en') as LanguageCode,
  hydrated: false,
  hydrate: async () => {
    const settings = await settingsRepository.load();
    const language = settings.language;
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch (error) {
      markStorageDegraded(error instanceof Error ? error.message : 'Local language storage is unavailable.');
    }
    await ensureLanguageResources(i18n, language);
    await i18n.changeLanguage(language);
    set({ language, hydrated: true });
  },
  setLanguage: async (language) => {
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch (error) {
      markStorageDegraded(error instanceof Error ? error.message : 'Local language storage is unavailable.');
    }
    await settingsRepository.save({ language });
    await ensureLanguageResources(i18n, language);
    await i18n.changeLanguage(language);
    set({ language });
  },
}));
