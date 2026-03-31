import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import type { Palette } from '@/domain/models';
import { simulateGrayscale, simulatePaletteCvd } from '@/domain/diagnostics/engine';

function Row({ title, colors }: { title: string; colors: Palette['colors'] }) {
  return (
    <div className="space-y-3">
      <div className="section-label">{title}</div>
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
        {colors.map((color) => (
          <ColorSwatchButton key={color.id} color={color} compact />
        ))}
      </div>
    </div>
  );
}

export function AccessibilityPanel({ palette }: { palette: Palette }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Accessibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row title="Original" colors={palette.colors} />
        <Row title="Grayscale" colors={simulateGrayscale(palette.colors)} />
        <Row title="Deuteranopia" colors={simulatePaletteCvd(palette.colors, 'deuteranopia')} />
        <Row title="Protanopia" colors={simulatePaletteCvd(palette.colors, 'protanopia')} />
        <Row title="Tritanopia" colors={simulatePaletteCvd(palette.colors, 'tritanopia')} />
      </CardContent>
    </Card>
  );
}
