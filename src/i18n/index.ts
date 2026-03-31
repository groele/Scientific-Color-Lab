import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { detectInitialLanguage, resources } from '@/i18n/resources';

void i18n.use(initReactI18next).init({
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  defaultNS: 'common',
  resources,
});

export { i18n };
