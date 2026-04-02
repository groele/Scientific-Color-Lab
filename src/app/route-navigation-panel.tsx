import { Download, FlaskConical, FolderArchive, ImageDown, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RouteNavigationPanel() {
  const { t } = useTranslation(['common']);
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
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
