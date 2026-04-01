import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DiagnosticQuickFixId, PaletteDiagnostics } from '@/domain/models';

interface DiagnosticsPanelProps {
  diagnostics: PaletteDiagnostics;
  onQuickFix?: (fixId: DiagnosticQuickFixId) => void;
}

function statusIcon(status: PaletteDiagnostics['status']) {
  switch (status) {
    case 'high-risk':
      return ShieldAlert;
    case 'needs-attention':
      return AlertTriangle;
    case 'healthy':
    default:
      return CheckCircle2;
  }
}

function statusTone(status: PaletteDiagnostics['status']) {
  switch (status) {
    case 'high-risk':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    case 'needs-attention':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'healthy':
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
}

export function DiagnosticsPanel({ diagnostics, onQuickFix }: DiagnosticsPanelProps) {
  const { t } = useTranslation(['common', 'diagnostics']);
  const [expanded, setExpanded] = useState(diagnostics.status === 'high-risk');

  useEffect(() => {
    if (diagnostics.status === 'high-risk') {
      setExpanded(true);
    }
  }, [diagnostics.status]);

  const Icon = statusIcon(diagnostics.status);
  const topItems = useMemo(() => diagnostics.items.slice(0, 2), [diagnostics.items]);

  const diagnosticText = (item: PaletteDiagnostics['items'][number], field: 'title' | 'message' | 'suggestion') => {
    const fallback = field === 'title' ? item.title : field === 'message' ? item.message : item.suggestion ?? '';
    return t(`diagnostics:item.${item.code}.${field}`, { defaultValue: fallback });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t('common:diagnostics')}</CardTitle>
            <p className="mt-1 text-sm text-foreground/60">{t('diagnostics:assistantHint')}</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusTone(diagnostics.status)}`}>
            <Icon className="h-3.5 w-3.5" />
            {t(`diagnostics:status.${diagnostics.status}`)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="section-label">{t('diagnostics:score')}</div>
              <div className="mt-1 font-editorial text-2xl tracking-tight text-foreground">{diagnostics.score}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded((current) => !current)}>
              {expanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  {t('common:hide')}
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  {t('common:viewDetails')}
                </>
              )}
            </Button>
          </div>
          <p className="mt-3 text-sm text-foreground/68">
            {diagnostics.status === 'healthy'
              ? t('diagnostics:summary.healthy')
              : diagnostics.status === 'high-risk'
                ? t('diagnostics:summary.highRisk')
                : t('diagnostics:summary.attention')}
          </p>
        </div>

        {topItems.length ? (
          <div className="space-y-2">
            <div className="section-label">{t('diagnostics:topFindings')}</div>
            {topItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/80 bg-panel px-3 py-3">
                <div className="font-medium text-foreground">{diagnosticText(item, 'title')}</div>
                <p className="mt-1 text-sm text-foreground/68">{diagnosticText(item, 'message')}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            {t('diagnostics:responsible')}
          </div>
        )}

        {diagnostics.quickFixes.length ? (
          <div className="space-y-2">
            <div className="section-label">{t('diagnostics:quickFixes')}</div>
            <div className="grid gap-2">
              {diagnostics.quickFixes.slice(0, 4).map((fix) => (
                <button
                  key={fix.id}
                  type="button"
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-panel px-3 py-3 text-left transition hover:border-foreground/35"
                  onClick={() => onQuickFix?.(fix.id)}
                  disabled={!onQuickFix}
                >
                  <Wrench className="mt-0.5 h-4 w-4 text-foreground/55" />
                  <div>
                    <div className="font-medium text-foreground">{t(`diagnostics:fix.${fix.id}.label`)}</div>
                    <div className="mt-1 text-sm text-foreground/66">{t(`diagnostics:fix.${fix.id}.body`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {expanded && diagnostics.items.length ? (
          <div className="space-y-2">
            <div className="section-label">{t('common:viewDetails')}</div>
            {diagnostics.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/80 bg-panel p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" />
                  <div>
                    <div className="font-medium text-foreground">{diagnosticText(item, 'title')}</div>
                    <p className="mt-1 text-sm text-foreground/70">{diagnosticText(item, 'message')}</p>
                    {item.suggestion ? <p className="mt-1 text-xs text-foreground/55">{diagnosticText(item, 'suggestion')}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
