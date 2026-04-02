import { useMemo } from 'react';
import type { GradientDefinition } from '@/domain/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { createConceptGradient, createCyclicGradient, createDivergingGradient, createPaletteGradient, createSequentialGradient } from '@/domain/color/gradients';
import type { ColorToken, Palette } from '@/domain/models';

interface GradientEditorPanelProps {
  palette: Palette;
  baseColor: ColorToken;
}

export function GradientEditorPanel({ palette, baseColor }: GradientEditorPanelProps) {
  const gradients = useMemo<GradientDefinition[]>(
    () => [
      createPaletteGradient(palette),
      createSequentialGradient(baseColor),
      createDivergingGradient(baseColor),
      createCyclicGradient(baseColor),
      createConceptGradient(baseColor),
    ],
    [baseColor, palette],
  );

  return (
    <div className="space-y-4">
      {gradients.map((gradient) => (
        <Card key={gradient.id}>
          <CardHeader className="pb-3">
            <CardTitle>{gradient.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-20 rounded-2xl border border-border/80" style={{ backgroundImage: gradient.css }} />
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
              {gradient.stops.map((color) => (
                <ColorSwatchButton key={color.id} color={color} compact />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
