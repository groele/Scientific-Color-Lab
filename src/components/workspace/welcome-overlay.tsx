import { FlaskConical, FolderOpenDot, ImagePlus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { WelcomeAction } from '@/domain/models';

export function WelcomeOverlay({ onAction }: { onAction: (action: WelcomeAction) => void }) {
  const { t } = useTranslation(['common', 'workspace']);
  const actions: Array<{ id: WelcomeAction; title: string; description: string; icon: typeof FlaskConical }> = [
    {
      id: 'new-palette',
      title: t('workspace:welcomeNewPalette'),
      description: t('workspace:welcomeNewPaletteBody'),
      icon: FlaskConical,
    },
    {
      id: 'extract-image',
      title: t('workspace:welcomeImage'),
      description: t('workspace:welcomeImageBody'),
      icon: ImagePlus,
    },
    {
      id: 'open-library',
      title: t('workspace:welcomeTemplates'),
      description: t('workspace:welcomeTemplatesBody'),
      icon: Sparkles,
    },
    {
      id: 'open-recent',
      title: t('workspace:welcomeRecent'),
      description: t('workspace:welcomeRecentBody'),
      icon: FolderOpenDot,
    },
  ];

  return (
    <div className="rounded-[1.8rem] border border-border bg-panel p-6 shadow-panel">
      <div className="space-y-2">
        <div className="eyebrow">{t('common:appName')}</div>
        <h2 className="font-editorial text-3xl tracking-tight text-foreground">{t('workspace:welcomeTitle')}</h2>
        <p className="max-w-2xl text-sm text-foreground/70">{t('workspace:subtitle')}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              className="rounded-2xl border border-border/80 bg-muted/35 p-5 text-left transition hover:border-foreground/35 hover:bg-panel"
              onClick={() => onAction(action.id)}
            >
              <Icon className="h-6 w-6 text-accent" />
              <div className="mt-4 font-medium text-foreground">{action.title}</div>
              <p className="mt-2 text-sm text-foreground/65">{action.description}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => onAction('new-palette')}>
          {t('common:continue')}
        </Button>
      </div>
    </div>
  );
}
