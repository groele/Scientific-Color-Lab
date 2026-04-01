import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalErrorBoundary } from '@/app/global-error-boundary';
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
  const [bootstrapIssues, setBootstrapIssues] = useState<string[]>([]);
  const [bootstrapFailed, setBootstrapFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const results = await Promise.allSettled([hydrateDiagnostics(), hydratePreferences(), hydrateI18n()]);
      if (!active) {
        return;
      }

      const issues = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => (result.reason instanceof Error ? result.reason.message : 'Bootstrap failed.'));

      setBootstrapIssues(issues);
      setCopyFormat(usePreferencesStore.getState().copyFormat);
      setBootstrapped(true);
    };

    void bootstrap().catch((error) => {
      if (!active) {
        return;
      }

      setBootstrapIssues([error instanceof Error ? error.message : 'Bootstrap failed.']);
      setBootstrapFailed(true);
    });

    return () => {
      active = false;
    };
  }, [hydrateDiagnostics, hydrateI18n, hydratePreferences, setCopyFormat]);

  if (bootstrapFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-[1.75rem] border border-border/70 bg-panel px-6 py-6 shadow-panel">
          <div className="eyebrow">{t('common:shellBadge')}</div>
          <div className="mt-3 font-editorial text-2xl tracking-tight text-foreground">{t('common:unavailableTemporarily')}</div>
          <p className="mt-2 text-sm text-foreground/68">
            {bootstrapIssues[0] ?? t('common:storageUnavailable')}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="rounded-full border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground transition hover:border-foreground/35"
              onClick={() => window.location.reload()}
            >
              {t('common:retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <GlobalErrorBoundary title={t('common:unavailableTemporarily')} body={t('common:storageUnavailable')} retryLabel={t('common:retry')}>
        <AppRoutes bootstrapIssues={bootstrapIssues} />
      </GlobalErrorBoundary>
    </ToastProvider>
  );
}
