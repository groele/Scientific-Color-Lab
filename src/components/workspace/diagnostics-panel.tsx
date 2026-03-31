import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaletteDiagnostics } from '@/domain/models';

export function DiagnosticsPanel({ diagnostics }: { diagnostics: PaletteDiagnostics }) {
  const { t } = useTranslation(['common', 'diagnostics']);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('common:diagnostics')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3">
          <div className="section-label">{t('diagnostics:score')}</div>
          <div className="mt-1 font-editorial text-3xl text-foreground">{diagnostics.score}</div>
        </div>
        {diagnostics.items.length ? (
          diagnostics.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/80 bg-panel p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" />
                <div>
                  <div className="font-medium text-foreground">{item.title}</div>
                  <p className="mt-1 text-sm text-foreground/70">{item.message}</p>
                  {item.suggestion ? <p className="mt-1 text-xs text-foreground/55">{item.suggestion}</p> : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-success/20 bg-panel p-3 text-sm text-foreground/75">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {t('diagnostics:responsible')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
