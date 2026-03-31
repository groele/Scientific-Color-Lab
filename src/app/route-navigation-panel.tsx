import { Download, FlaskConical, FolderArchive, ImageDown, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useLibraryStore } from '@/stores/library-store';

interface RouteNavigationPanelProps {
  onInstall?: () => void;
  canInstall?: boolean;
  isInstalled?: boolean;
}

export function RouteNavigationPanel({ onInstall, canInstall = false, isInstalled = false }: RouteNavigationPanelProps) {
  const { t } = useTranslation(['common', 'workspace']);
  const projects = useLibraryStore((state) => state.projects);
  const latestProject = projects[0];
  const items = [
    { to: '/workspace', label: t('common:workspace'), icon: FlaskConical },
    { to: '/library', label: t('common:library'), icon: FolderArchive },
    { to: '/analyzer', label: t('common:analyzer'), icon: ImageDown },
    { to: '/exports', label: t('common:exports'), icon: Download },
    { to: '/settings', label: t('common:settings'), icon: Settings2 },
  ] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('common:navigation')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    isActive ? 'border-foreground bg-foreground text-background' : 'border-border bg-panel hover:bg-muted'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3">
          <div className="mb-3">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/45">{t('common:settings')}</div>
            <div className="mt-1 text-sm text-foreground/65">{t('common:navHint')}</div>
          </div>
          <div className="space-y-3">
            <LanguageSwitcher />
            <Button className="w-full" variant="outline" onClick={onInstall} disabled={!canInstall || isInstalled}>
              {isInstalled ? t('common:installed') : t('common:installPwa')}
            </Button>
            <div className="text-xs text-foreground/55">
              {isInstalled ? t('common:installHint') : canInstall ? t('common:installHint') : t('common:installUnavailable')}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-panel p-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/45">{t('common:recent')}</div>
          {latestProject ? (
            <div className="mt-2 space-y-1">
              <div className="font-medium text-foreground">{latestProject.name}</div>
              <div className="line-clamp-2 text-sm text-foreground/65">{latestProject.description?.trim() || t('common:recentProjectHint')}</div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-foreground/60">{t('workspace:noRecent')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
