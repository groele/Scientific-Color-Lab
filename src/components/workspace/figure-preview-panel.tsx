import { BarPreview, ConceptFigurePreview, CyclicMapPreview, DivergingMapPreview, LinePlotPreview, ScatterPreview, SequentialMapPreview } from '@/components/viz/chart-previews';
import type { Palette } from '@/domain/models';

export function FigurePreviewPanel({ palette }: { palette: Palette }) {
  return (
    <div className="grid gap-4">
      <LinePlotPreview palette={palette} />
      <ScatterPreview palette={palette} />
      <BarPreview palette={palette} />
      <SequentialMapPreview palette={palette} />
      <DivergingMapPreview palette={palette} />
      <CyclicMapPreview palette={palette} />
      <ConceptFigurePreview palette={palette} />
    </div>
  );
}
