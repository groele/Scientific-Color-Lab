import type { Palette } from '@/domain/models';
import { cn } from '@/lib/utils';

export function SwatchGrid({
  palette,
  selectedColorId,
  onSelect,
}: {
  palette: Palette;
  selectedColorId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {palette.colors.map((color) => (
        <button
          key={color.id}
          className={cn(
            'panel-surface overflow-hidden text-left transition-transform hover:-translate-y-0.5',
            selectedColorId === color.id && 'ring-2 ring-foreground',
          )}
          onClick={() => onSelect(color.id)}
        >
          <div className="h-28 w-full" style={{ background: color.hex }} />
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">{color.name}</div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50">{color.hex}</div>
              </div>
              {color.gamutStatus === 'mapped' ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-800">
                  mapped
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-foreground/60">
              <div>L {color.oklch.l}</div>
              <div>C {color.oklch.c}</div>
              <div>H {color.oklch.h}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
