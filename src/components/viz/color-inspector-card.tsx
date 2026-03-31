import { useTranslation } from 'react-i18next';
import type { ScientificColor } from '@/domain/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyFormatMenu } from '@/components/viz/copy-format-menu';
import { MetadataTable } from '@/components/viz/metadata-table';

export function ColorInspectorCard({ color }: { color: ScientificColor }) {
  const { t } = useTranslation(['workspace']);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t('workspace:inspector')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border/80">
          <div className="h-28" style={{ background: color.hex }} />
          <div className="space-y-1 bg-panel px-4 py-3">
            <div className="font-editorial text-2xl tracking-tight">{color.name}</div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/55">{color.hex}</div>
          </div>
        </div>
        <CopyFormatMenu color={color} />
        <MetadataTable color={color} />
      </CardContent>
    </Card>
  );
}
