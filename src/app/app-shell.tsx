import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import type { AppBootstrapState } from '@/domain/models';
import { SystemStatusBar } from '@/app/system-status-bar';

export function AppShell({ children, bootstrapState }: { children?: React.ReactNode; bootstrapState: AppBootstrapState }) {
  const { t } = useTranslation(['common']);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1760px] flex-col px-4 py-5 lg:px-6">
      <header className="mb-4 flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-white/72 px-5 py-3 shadow-panel backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="eyebrow">{t('common:shellBadge')}</div>
          <h1 className="truncate font-editorial text-xl tracking-tight text-foreground">{t('common:shellTitle')}</h1>
        </div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-foreground/45">{t('common:appName')}</div>
      </header>
      <SystemStatusBar bootstrapState={bootstrapState} />
      {children ?? <Outlet />}
    </div>
  );
}
