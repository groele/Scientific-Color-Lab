import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AppRoutes } from '@/routes/app-routes';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { useI18nStore } from '@/stores/i18n-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function App() {
  const { t } = useTranslation(['common']);
  const hydrateDiagnostics = useDiagnosticsStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const hydrateI18n = useI18nStore((state) => state.hydrate);
  const setCopyFormat = useWorkspaceStore((state) => state.setCopyFormat);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      await Promise.allSettled([hydrateDiagnostics(), hydratePreferences(), hydrateI18n()]);
      if (!active) {
        return;
      }

      setCopyFormat(usePreferencesStore.getState().copyFormat);
      setBootstrapped(true);
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [hydrateDiagnostics, hydrateI18n, hydratePreferences, setCopyFormat]);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" data-testid="app-hydration">
        <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-panel px-6 py-5 text-center shadow-panel">
          <div className="eyebrow">{t('common:shellBadge')}</div>
          <div className="mt-3 font-editorial text-2xl tracking-tight text-foreground">{t('common:loadingWorkspace')}</div>
          <p className="mt-2 text-sm text-foreground/65">{t('common:shellSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}
