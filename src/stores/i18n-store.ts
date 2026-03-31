import { create } from 'zustand';
import type { LanguageCode } from '@/domain/models';
import { settingsRepository } from '@/db/repositories';
import { i18n } from '@/i18n';
import { languageStorageKey } from '@/i18n/resources';

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
    window.localStorage.setItem(languageStorageKey, language);
    await i18n.changeLanguage(language);
    set({ language, hydrated: true });
  },
  setLanguage: async (language) => {
    window.localStorage.setItem(languageStorageKey, language);
    await settingsRepository.save({ language });
    await i18n.changeLanguage(language);
    set({ language });
  },
}));
