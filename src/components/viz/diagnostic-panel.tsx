import type { PaletteDiagnostics } from '@/domain/models';
import { diagnosticsSummary } from '@/domain/diagnostics/engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DiagnosticPanel({ diagnostics }: { diagnostics: PaletteDiagnostics }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Diagnostics Engine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/60 p-4">
          <div className="section-label">Summary</div>
          <div className="mt-2 text-sm text-foreground/70">{diagnosticsSummary(diagnostics)}</div>
        </div>
        <div className="space-y-3">
          {diagnostics.items.length ? (
            diagnostics.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/80 bg-panel p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={item.severity === 'error' ? 'error' : item.severity === 'warning' ? 'warning' : 'default'}>
                    {item.severity}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                </div>
                <p className="text-sm text-foreground/68">{item.message}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              No warnings under the default scientific checks.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
