import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppBootstrapState } from '@/domain/models';
import { GlobalErrorBoundary } from '@/app/global-error-boundary';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AppRoutes } from '@/routes/app-routes';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { useI18nStore } from '@/stores/i18n-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { loadFullSettings } from '@/services/settings-runtime';
import { getStorageStatus } from '@/services/storage-status';

export function App() {
  const { t } = useTranslation(['common']);
  const applyDiagnosticsSettings = useDiagnosticsStore((state) => state.applySettings);
  const applyPreferencesSettings = usePreferencesStore((state) => state.applySettings);
  const applyI18nSettings = useI18nStore((state) => state.applySettings);
  const setCopyFormat = useWorkspaceStore((state) => state.setCopyFormat);
  const initializedRef = useRef(false);
  const [bootstrapState, setBootstrapState] = useState<AppBootstrapState>({
    phase: 'shell-ready',
    issues: [],
    restoredFrom: 'snapshot',
    storageMode: getStorageStatus().degraded ? 'memory' : 'persistent',
  });

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    let active = true;
    let restoreCompleted = false;
    const restoringTimer = window.setTimeout(() => {
      if (!active || restoreCompleted) {
        return;
      }

      setBootstrapState((current) => (current.phase === 'shell-ready' ? { ...current, phase: 'restoring' } : current));
    }, 250);
    const degradeTimer = window.setTimeout(() => {
      if (!active || restoreCompleted) {
        return;
      }

      setBootstrapState((current) => ({
        ...current,
        phase: 'degraded',
        issues: current.issues.includes('restore-timeout') ? current.issues : [...current.issues, 'restore-timeout'],
      }));
    }, 4000);

    performance.mark('app-shell-visible');

    void (async () => {
      try {
        const settings = await loadFullSettings();
        if (!active) {
          return;
        }

        restoreCompleted = true;
        applyPreferencesSettings(settings);
        applyDiagnosticsSettings(settings);
        setCopyFormat(settings.copyFormat);
        performance.mark('full-restore-complete');
        performance.measure('app-full-restore', 'app-shell-visible', 'full-restore-complete');
        setBootstrapState({
          phase: 'ready',
          issues: [],
          restoredFrom: 'dexie',
          storageMode: getStorageStatus().degraded ? 'memory' : 'persistent',
        });
        void applyI18nSettings(settings).catch((error) => {
          if (!active) {
            return;
          }

          setBootstrapState((current) => ({
            ...current,
            phase: current.phase === 'failed' ? 'failed' : 'degraded',
            issues: current.issues.includes(error instanceof Error ? error.message : 'Language resources failed to load.')
              ? current.issues
              : [...current.issues, error instanceof Error ? error.message : 'Language resources failed to load.'],
          }));
        });
      } catch (error) {
        if (!active) {
          return;
        }

        restoreCompleted = true;
        setBootstrapState({
          phase: 'degraded',
          issues: [error instanceof Error ? error.message : 'Background restore failed.'],
          restoredFrom: 'memory',
          storageMode: 'memory',
        });
      }
    })();

    return () => {
      active = false;
      window.clearTimeout(restoringTimer);
      window.clearTimeout(degradeTimer);
    };
  }, [applyDiagnosticsSettings, applyI18nSettings, applyPreferencesSettings, setCopyFormat]);

  if (bootstrapState.phase === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-[1.75rem] border border-border/70 bg-panel px-6 py-6 shadow-panel">
          <div className="eyebrow">{t('common:shellBadge')}</div>
          <div className="mt-3 font-editorial text-2xl tracking-tight text-foreground">{t('common:unavailableTemporarily')}</div>
          <p className="mt-2 text-sm text-foreground/68">
            {bootstrapState.issues[0] ?? t('common:storageUnavailable')}
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

  return (
    <ToastProvider>
      <GlobalErrorBoundary title={t('common:unavailableTemporarily')} body={t('common:storageUnavailable')} retryLabel={t('common:retry')}>
        <AppRoutes bootstrapState={bootstrapState} />
      </GlobalErrorBoundary>
    </ToastProvider>
  );
}
