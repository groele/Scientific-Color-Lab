import type { LanguageCode } from '@/domain/models';
import { enResources } from '@/i18n/resources-en';
import type { zhCnResources } from '@/i18n/resources-zh-cn';

export const languageStorageKey = 'scientific-color-lab-language';

type ResourceBundle = typeof enResources | typeof zhCnResources;

const loadedLanguages = new Set<LanguageCode>(['en']);

export function detectInitialLanguage(): LanguageCode {
  try {
    const stored = window.localStorage.getItem(languageStorageKey);
    if (stored === 'en' || stored === 'zh-CN') {
      return stored;
    }
  } catch {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  }

  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export const resources: Partial<Record<LanguageCode, ResourceBundle>> = {
  en: enResources,
};

export async function loadLanguageResources(language: LanguageCode): Promise<ResourceBundle> {
  if (language === 'zh-CN') {
    const module = await import('@/i18n/resources-zh-cn');
    return module.zhCnResources;
  }

  return enResources;
}

export function hasLanguageResources(language: LanguageCode) {
  return loadedLanguages.has(language);
}

export async function ensureLanguageResources(
  i18nInstance: { hasResourceBundle: (lng: string, ns: string) => boolean; addResourceBundle: (lng: string, ns: string, resources: Record<string, unknown>, deep?: boolean, overwrite?: boolean) => void },
  language: LanguageCode,
) {
  if (loadedLanguages.has(language) && i18nInstance.hasResourceBundle(language, 'common')) {
    return;
  }

  const bundle = await loadLanguageResources(language);
  Object.entries(bundle).forEach(([namespace, namespaceBundle]) => {
    i18nInstance.addResourceBundle(language, namespace, namespaceBundle as Record<string, unknown>, true, true);
  });
  loadedLanguages.add(language);
}
