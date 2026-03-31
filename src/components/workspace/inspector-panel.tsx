import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectorField } from '@/components/ui/inspector-field';
import { TagInput } from '@/components/ui/tag-input';
import { Textarea } from '@/components/ui/textarea';
import type { ColorToken, CopyFormat } from '@/domain/models';
import { useColorActions } from '@/hooks/use-color-actions';

interface InspectorPanelProps {
  color: ColorToken;
  onNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  minimal?: boolean;
}

export function InspectorPanel({ color, onNameChange, onNotesChange, onTagsChange, minimal = false }: InspectorPanelProps) {
  const { t } = useTranslation(['workspace']);
  const { copyByFormat, copyHex } = useColorActions();
  const formats: Array<{ label: string; format: CopyFormat; value: string }> = [
    { label: 'HEX', format: 'hex', value: color.hex },
    { label: 'RGB', format: 'rgb', value: `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}` },
    { label: 'HSL', format: 'hsl', value: `${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%` },
    { label: 'Lab', format: 'lab', value: `${color.lab.l} ${color.lab.a} ${color.lab.b}` },
    { label: 'OKLCH', format: 'oklch', value: `${color.oklch.l} ${color.oklch.c} ${color.oklch.h}` },
    { label: 'CSS', format: 'css', value: color.cssColor },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:inspector')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          className="h-24 w-full rounded-2xl border border-border/80 bg-panel transition hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{ backgroundColor: color.hex }}
          onClick={(event) => void copyHex(color, event.currentTarget)}
          title={color.hex}
        />
        <input
          className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-base font-medium text-foreground"
          value={color.name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        {minimal ? (
          <div className="rounded-xl border border-border/80 bg-muted/25 px-3 py-2 text-sm text-foreground/65">
            {t('workspace:copyHexHint')}
          </div>
        ) : (
          formats.map((entry) => (
            <InspectorField key={entry.label} label={entry.label} value={entry.value} onCopy={(anchor) => void copyByFormat(color, entry.format, anchor)} />
          ))
        )}
        <div className="space-y-2">
          <div className="section-label">{t('workspace:tags')}</div>
          <TagInput value={color.tags} onChange={onTagsChange} />
        </div>
        <div className="space-y-2">
          <div className="section-label">{t('workspace:notes')}</div>
          <Textarea className={minimal ? 'min-h-[112px]' : undefined} value={color.notes} onChange={(event) => onNotesChange(event.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}
