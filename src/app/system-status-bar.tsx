import { RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { AppBootstrapState } from '@/domain/models';
import { usePwaRuntimeStatus } from '@/services/pwa-runtime-service';
import { useStorageStatus } from '@/services/storage-status';

export function SystemStatusBar({ bootstrapState }: { bootstrapState: AppBootstrapState }) {
  const { t } = useTranslation(['common']);
  const { degraded, message } = useStorageStatus();
  const { needRefresh, applyUpdate, offlineReady } = usePwaRuntimeStatus();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const shouldShowRestore = bootstrapState.phase === 'restoring';
  const shouldShowDegraded = degraded || bootstrapState.phase === 'degraded';

  if (!shouldShowRestore && !shouldShowDegraded && !needRefresh && !offlineReady && online) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-panel px-4 py-3 text-sm text-foreground/72 shadow-panel">
      <span className="section-label">{t('common:systemStatus')}</span>
      <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/35 px-3 py-1">
        {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        {online ? t('common:online') : t('common:offline')}
      </span>
      {shouldShowRestore ? (
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-800">{t('common:loadingWorkspace')}</span>
      ) : null}
      {shouldShowDegraded ? (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
          {message ?? bootstrapState.issues[0] ?? t('common:storageUnavailable')}
        </span>
      ) : null}
      {offlineReady ? (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
          {t('common:installed')}
        </span>
      ) : null}
      {needRefresh && applyUpdate ? (
        <Button size="sm" variant="outline" onClick={() => void applyUpdate()}>
          <RefreshCcw className="mr-2 h-3.5 w-3.5" />
          {t('common:refreshToUpdate')}
        </Button>
      ) : null}
    </div>
  );
}
