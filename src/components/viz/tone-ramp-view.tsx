import type { ScientificColor } from '@/domain/models';

export function ToneRampView({
  colors,
  selectedColorId,
  onSelect,
}: {
  colors: ScientificColor[];
  selectedColorId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="panel-surface overflow-hidden">
      <div className="grid min-h-[132px] grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
        {colors.map((color) => (
          <button
            key={color.id}
            className={`relative flex min-h-[132px] flex-col justify-end px-3 py-3 text-left ${selectedColorId === color.id ? 'ring-2 ring-inset ring-white' : ''}`}
            style={{ background: color.hex }}
            onClick={() => onSelect(color.id)}
          >
            <div className="rounded-md bg-black/35 px-2 py-1 text-[11px] text-white backdrop-blur">
              <div className="font-medium">{color.name}</div>
              <div className="font-mono uppercase tracking-[0.16em] text-white/75">{color.hex}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
