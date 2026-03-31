import { useTranslation } from 'react-i18next';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColorMatrix } from '@/domain/models';

interface ScientificMatrixPanelProps {
  matrix: ColorMatrix;
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  onInsert: (hex: string) => void;
}

export function ScientificMatrixPanel({ matrix, selectedColorId, onSelect, onInsert }: ScientificMatrixPanelProps) {
  const { t } = useTranslation(['workspace']);

  const axisLabel = (value: string) => {
    switch (value) {
      case 'Hue':
        return t('workspace:hue');
      case 'Chroma':
        return t('workspace:chroma');
      case 'Lightness':
        return t('workspace:lightness');
      default:
        return value;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:colorExtensionMatrix')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="section-label">
          {axisLabel(matrix.xAxis)} × {axisLabel(matrix.yAxis)}
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${matrix.density}, minmax(0, 1fr))` }}>
          {matrix.cells.flat().map((cell) => (
            <ColorSwatchButton
              key={cell.id}
              color={cell.color}
              compact
              selected={cell.color.id === selectedColorId}
              onSelect={() => onSelect(cell.color.id)}
              onInsert={() => onInsert(cell.color.hex)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
