import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { SplitPanelLayout } from '@/components/ui/split-panel-layout';
import { RouteNavigationPanel } from '@/app/route-navigation-panel';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { SliderNumberField } from '@/components/ui/slider-number-field';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { useI18nStore } from '@/stores/i18n-store';
import { usePreferencesStore } from '@/stores/preferences-store';

export function SettingsPage() {
  const { t } = useTranslation(['common', 'settings']);
  const { canInstall, isInstalled, install } = usePwaInstall();
  const language = useI18nStore((state) => state.language);
  const copyFormat = usePreferencesStore((state) => state.copyFormat);
  const setCopyFormat = usePreferencesStore((state) => state.setCopyFormat);
  const backgroundMode = usePreferencesStore((state) => state.backgroundMode);
  const setBackgroundMode = usePreferencesStore((state) => state.setBackgroundMode);
  const showWelcome = usePreferencesStore((state) => state.showWelcome);
  const setShowWelcome = usePreferencesStore((state) => state.setShowWelcome);
  const thresholds = useDiagnosticsStore((state) => state.thresholds);
  const setThreshold = useDiagnosticsStore((state) => state.setThreshold);

  return (
    <SplitPanelLayout
      left={<RouteNavigationPanel canInstall={canInstall} isInstalled={isInstalled} onInstall={() => void install()} />}
      center={
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('settings:title')}</CardTitle>
            <p className="mt-1 text-sm text-foreground/65">{t('settings:subtitle')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <div className="section-label">{t('common:language')}</div>
              <LanguageSwitcher />
            </section>

            <section className="space-y-3">
              <div className="section-label">{t('settings:copyFormat')}</div>
              <Select value={copyFormat} onChange={(event) => void setCopyFormat(event.target.value as typeof copyFormat)}>
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
                <option value="lab">Lab</option>
                <option value="oklch">OKLCH</option>
                <option value="css">CSS</option>
              </Select>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="section-label">{t('settings:backgroundMode')}</div>
                <Select value={backgroundMode} onChange={(event) => void setBackgroundMode(event.target.value as 'light' | 'dark')}>
                  <option value="light">{t('common:light')}</option>
                  <option value="dark">{t('common:dark')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="section-label">{t('settings:welcomeOverlay')}</div>
                <Select value={showWelcome ? 'yes' : 'no'} onChange={(event) => void setShowWelcome(event.target.value === 'yes')}>
                  <option value="yes">{t('common:show')}</option>
                  <option value="no">{t('common:hide')}</option>
                </Select>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <div className="section-label">{t('settings:thresholds')}</div>
              </div>
              <SliderNumberField
                label={t('settings:minimumContrast')}
                value={thresholds.minimumContrast}
                min={1}
                max={7}
                step={0.1}
                onChange={(value) => void setThreshold('minimumContrast', value)}
                onNudge={(delta) => void setThreshold('minimumContrast', Math.min(7, Math.max(1, thresholds.minimumContrast + delta)))}
              />
              <SliderNumberField
                label={t('settings:categoricalDeltaE')}
                value={thresholds.categoricalDeltaE}
                min={4}
                max={24}
                step={0.5}
                onChange={(value) => void setThreshold('categoricalDeltaE', value)}
                onNudge={(delta) => void setThreshold('categoricalDeltaE', Math.min(24, Math.max(4, thresholds.categoricalDeltaE + delta)))}
              />
              <SliderNumberField
                label={t('settings:maximumChroma')}
                value={thresholds.maximumChroma}
                min={0.08}
                max={0.28}
                step={0.005}
                onChange={(value) => void setThreshold('maximumChroma', value)}
                onNudge={(delta) => void setThreshold('maximumChroma', Math.min(0.28, Math.max(0.08, thresholds.maximumChroma + delta)))}
              />
              <SliderNumberField
                label={t('settings:maxQualitativeColors')}
                value={thresholds.maxQualitativeColors}
                min={3}
                max={12}
                step={1}
                onChange={(value) => void setThreshold('maxQualitativeColors', Math.round(value))}
                onNudge={(delta) => void setThreshold('maxQualitativeColors', Math.min(12, Math.max(3, thresholds.maxQualitativeColors + delta)))}
              />
            </section>
          </CardContent>
        </Card>
      }
      right={
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('settings:settingsSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/70">
            <div>{t('common:language')}: {language === 'zh-CN' ? t('exports:languageChinese') : t('exports:languageEnglish')}</div>
            <div>{t('settings:copyFormat')}: {copyFormat.toUpperCase()}</div>
            <div>{t('settings:backgroundMode')}: {backgroundMode === 'light' ? t('common:light') : t('common:dark')}</div>
            <div>{t('settings:welcomeOverlay')}: {showWelcome ? t('common:show') : t('common:hide')}</div>
          </CardContent>
        </Card>
      }
    />
  );
}
