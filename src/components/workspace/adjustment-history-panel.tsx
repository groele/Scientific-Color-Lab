import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceHistory } from '@/hooks/use-workspace-history';

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
              <div className="font-medium text-foreground">{entry.colorId}</div>
              <div className="mt-1 font-mono text-xs text-foreground/60">
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
