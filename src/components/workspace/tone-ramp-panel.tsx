import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTonalRamp } from '@/domain/color/ramp';
import type { ColorToken } from '@/domain/models';

interface ToneRampPanelProps {
  baseColor: ColorToken;
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  onSetMainColor: (colorId: string) => void;
}

export function ToneRampPanel({ baseColor, selectedColorId, onSelect, onSetMainColor }: ToneRampPanelProps) {
  const { t } = useTranslation(['workspace']);
  const colors = useMemo(() => generateTonalRamp(baseColor, 11), [baseColor]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:toneRamp')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {colors.map((color) => (
            <ColorSwatchButton
              key={color.id}
              color={color}
              selected={selectedColorId === color.id}
              onSelect={() => onSelect(color.id)}
              onSetMainColor={() => onSetMainColor(color.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
