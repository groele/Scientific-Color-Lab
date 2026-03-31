import { FlaskConical, FolderOpenDot, ImagePlus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { WelcomeAction } from '@/domain/models';

export function WelcomeOverlay({ onAction }: { onAction: (action: WelcomeAction) => void }) {
  const { t, i18n } = useTranslation(['common', 'workspace']);
  const isZh = i18n.language === 'zh-CN';
  const actions: Array<{ id: WelcomeAction; title: string; description: string; icon: typeof FlaskConical }> = [
    {
      id: 'new-palette',
      title: t('workspace:welcomeNewPalette'),
      description: isZh ? '从一个科学基础色开始，快速生成克制的科研调色板。' : 'Start from a base scientific color and generate a restrained palette.',
      icon: FlaskConical,
    },
    {
      id: 'extract-image',
      title: t('workspace:welcomeImage'),
      description: isZh ? '上传图表、截图或机制图，并重构出更安全的科研配色。' : 'Upload a figure, screenshot, or mechanism diagram and reconstruct safer colors.',
      icon: ImagePlus,
    },
    {
      id: 'open-library',
      title: t('workspace:welcomeTemplates'),
      description: isZh ? '按图表类型、背景模式和学术用途浏览结构化模板。' : 'Browse structured templates by chart type, background, and academic use.',
      icon: Sparkles,
    },
    {
      id: 'open-recent',
      title: t('workspace:welcomeRecent'),
      description: isZh ? '恢复最近一次本地调色工作流。' : 'Restore the most recent local palette workflow.',
      icon: FolderOpenDot,
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[2rem] border border-border bg-panel p-6 shadow-panel">
        <div className="space-y-2">
          <div className="eyebrow">{t('common:appName')}</div>
          <h2 className="font-editorial text-4xl tracking-tight text-foreground">{t('workspace:welcomeTitle')}</h2>
          <p className="max-w-2xl text-sm text-foreground/70">
            {t('workspace:subtitle')}
          </p>
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
            {isZh ? '继续' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
