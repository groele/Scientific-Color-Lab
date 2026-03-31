import type { ScientificColor } from '@/domain/models';

export function GradientStrip({
  label,
  css,
  stops,
  onSelect,
}: {
  label: string;
  css: string;
  stops: ScientificColor[];
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="panel-surface overflow-hidden">
      <div className="border-b border-border/80 px-5 py-4">
        <div className="section-label">{label}</div>
      </div>
      <div className="h-28" style={{ backgroundImage: css }} />
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
        {stops.map((stop) => (
          <button
            key={stop.id}
            className="flex items-center gap-3 rounded-xl border border-border/80 bg-panel p-3 text-left"
            onClick={() => onSelect?.(stop.id)}
          >
            <span className="h-10 w-10 rounded-lg border border-white/60" style={{ background: stop.hex }} />
            <span>
              <div className="text-sm font-medium text-foreground">{stop.name}</div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/50">{stop.hex}</div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
