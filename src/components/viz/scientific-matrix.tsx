import type { ColorMatrix } from '@/domain/models';
import { cn } from '@/lib/utils';

export function ScientificMatrix({
  matrix,
  selectedColorId,
  onSelect,
}: {
  matrix: ColorMatrix;
  selectedColorId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="panel-surface overflow-hidden p-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="section-label">
            {matrix.xAxis} × {matrix.yAxis}
          </div>
          <h3 className="font-editorial text-2xl tracking-tight">Scientific Grid</h3>
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/55">{matrix.density} cells per axis</div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${matrix.density}, minmax(0, 1fr))` }}>
        {matrix.cells.flat().map((cell) => (
          <button
            key={cell.id}
            className={cn(
              'aspect-square rounded-lg border border-white/40 p-2 text-left shadow-inner transition-transform hover:scale-[1.02]',
              selectedColorId === cell.color.id && 'ring-2 ring-foreground',
            )}
            style={{ background: cell.color.hex }}
            onClick={() => onSelect(cell.color.id)}
          >
            <div className="flex h-full flex-col justify-between rounded-md bg-black/16 p-2 text-white">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                {matrix.mode === 'hue-lightness' ? `H ${cell.xValue.toFixed(0)}` : `C ${cell.xValue.toFixed(3)}`}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">L {cell.yValue.toFixed(3)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
