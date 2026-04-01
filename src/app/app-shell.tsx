import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SystemStatusBar } from '@/app/system-status-bar';

export function AppShell({ children, bootstrapIssues }: { children?: React.ReactNode; bootstrapIssues?: string[] }) {
  const { t } = useTranslation(['common']);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1760px] flex-col px-4 py-5 lg:px-6">
      <header className="mb-5 flex flex-col gap-4 rounded-[1.6rem] border border-border/70 bg-white/72 px-5 py-4 shadow-panel backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="eyebrow">{t('common:shellBadge')}</div>
          <h1 className="font-editorial text-3xl tracking-tight text-foreground">{t('common:shellTitle')}</h1>
          <p className="max-w-3xl text-sm text-foreground/70">
            {t('common:shellSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/60">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1.5">
            <Download className="h-4 w-4" />
            {t('common:bilingualUi')}
          </span>
          <Button size="sm" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {t('common:top')}
          </Button>
        </div>
      </header>
      <SystemStatusBar bootstrapIssues={bootstrapIssues} />
      {children ?? <Outlet />}
    </div>
  );
}
