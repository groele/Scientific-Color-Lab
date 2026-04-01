import type { LanguageCode } from '@/domain/models';
import { enResources } from '@/i18n/resources-en';
import { zhCnResources } from '@/i18n/resources-zh-cn';

export const languageStorageKey = 'scientific-color-lab-language';

export function detectInitialLanguage(): LanguageCode {
  const stored = window.localStorage.getItem(languageStorageKey);
  if (stored === 'en' || stored === 'zh-CN') {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export const resources = {
  en: enResources,
  'zh-CN': zhCnResources,
} as const;
