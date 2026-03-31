import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import type { PairingRecommendationGroup } from '@/domain/models';

interface PairingRecommendationPanelProps {
  groups: PairingRecommendationGroup[];
  onInsertColors: (hexes: string[]) => void;
}

export function PairingRecommendationPanel({ groups, onInsertColors }: PairingRecommendationPanelProps) {
  const { t } = useTranslation(['workspace', 'common']);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:colorPairingEngine')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-3 rounded-2xl border border-border/80 bg-muted/35 p-3">
            <div>
              <div className="font-medium text-foreground">{group.label}</div>
            </div>
            {group.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-panel p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{item.name}</div>
                    <p className="mt-1 text-sm text-foreground/65">{item.explanation}</p>
                    <div className="mt-1 text-xs text-foreground/55">{item.scenarioFit}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onInsertColors(item.colors.map((color) => color.hex))}>
                    {t('common:add')}
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {item.colors.map((color) => (
                    <ColorSwatchButton key={color.id} color={color} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
