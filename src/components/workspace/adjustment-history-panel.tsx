import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceHistory } from '@/hooks/use-workspace-history';

function formatSigned(value: number, digits = 2) {
  const rounded = value.toFixed(digits);
  return value >= 0 ? `+${rounded}` : rounded;
}

export function AdjustmentHistoryPanel() {
  const { t } = useTranslation(['workspace']);
  const { entries } = useWorkspaceHistory();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:history')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length ? (
          entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border/80 bg-muted/35 p-3 text-sm">
              <div className="font-medium text-foreground">{t('workspace:paletteWideAdjustment')}</div>
              <div className="mt-1 text-xs text-foreground/60">
                {t('workspace:anchorColor')}: {entry.anchorColorName}
              </div>
              <div className="mt-1 font-mono text-xs text-foreground/60">
                ΔH {formatSigned(entry.delta.hue)} / ΔL {formatSigned(entry.delta.lightness)} / ΔC {formatSigned(entry.delta.chroma, 3)} / ΔA{' '}
                {formatSigned(entry.delta.alpha)}
              </div>
              <div className="mt-1 font-mono text-xs text-foreground/55">
                {entry.before.l} / {entry.before.c} / {entry.before.h} {'->'} {entry.after.l} / {entry.after.c} / {entry.after.h}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
            {t('workspace:noAdjustments')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
