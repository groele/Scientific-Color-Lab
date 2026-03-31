import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/select';
import { useI18nStore } from '@/stores/i18n-store';

export function LanguageSwitcher() {
  const { t } = useTranslation(['common']);
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  return (
    <div className="space-y-2">
      <label className="section-label" htmlFor="language-switcher">
        {t('common:language')}
      </label>
      <Select id="language-switcher" value={language} onChange={(event) => void setLanguage(event.target.value as 'en' | 'zh-CN')}>
        <option value="en">{t('common:english')}</option>
        <option value="zh-CN">{t('common:chinese')}</option>
      </Select>
    </div>
  );
}
