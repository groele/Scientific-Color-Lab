import type { Palette } from '@/domain/models';
import { createConceptGradient, createCyclicGradient, createDivergingGradient, createSequentialGradient } from '@/domain/color/gradients';

function PreviewFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-surface overflow-hidden">
      <div className="border-b border-border/80 px-4 py-3">
        <div className="section-label">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function LinePlotPreview({ palette }: { palette: Palette }) {
  return (
    <PreviewFrame title="Line Plot">
      <svg viewBox="0 0 280 140" className="w-full">
        <path d="M 24 12 v110 h230" fill="none" stroke="#8b9197" strokeWidth="1.4" />
        {palette.colors.slice(0, 5).map((color, index) => {
          const offset = index * 18;
          return <path key={color.id} d={`M 10 ${120 - offset} C 90 ${20 + offset}, 150 ${100 - offset}, 250 ${40 + offset}`} fill="none" stroke={color.hex} strokeWidth="4" />;
        })}
      </svg>
    </PreviewFrame>
  );
}

export function ScatterPreview({ palette }: { palette: Palette }) {
  return (
    <PreviewFrame title="Scatter Plot">
      <svg viewBox="0 0 280 140" className="w-full">
        <path d="M 24 12 v110 h230" fill="none" stroke="#8b9197" strokeWidth="1.4" />
        {palette.colors.slice(0, 6).map((color, index) => (
          <circle key={color.id} cx={42 + index * 34} cy={30 + (index % 3) * 28 + index * 4} r="8" fill={color.hex} opacity="0.92" />
        ))}
      </svg>
    </PreviewFrame>
  );
}

export function BarPreview({ palette }: { palette: Palette }) {
  return (
    <PreviewFrame title="Bar Chart">
      <svg viewBox="0 0 280 140" className="w-full">
        <path d="M 24 12 v110 h230" fill="none" stroke="#8b9197" strokeWidth="1.4" />
        {palette.colors.slice(0, 6).map((color, index) => (
          <rect key={color.id} x={42 + index * 32} y={38 + (index % 2) * 12} width="22" height={60 - (index % 3) * 10} fill={color.hex} rx="4" />
        ))}
      </svg>
    </PreviewFrame>
  );
}

export function SequentialMapPreview({ palette }: { palette: Palette }) {
  const gradient = createSequentialGradient(palette.colors[Math.floor(palette.colors.length / 2)]!);
  return <PreviewFrame title="Sequential Gradient"><div className="h-28 rounded-xl" style={{ backgroundImage: gradient.css }} /></PreviewFrame>;
}

export function DivergingMapPreview({ palette }: { palette: Palette }) {
  const gradient = createDivergingGradient(palette.colors[0]!);
  return <PreviewFrame title="Diverging Gradient"><div className="h-28 rounded-xl" style={{ backgroundImage: gradient.css }} /></PreviewFrame>;
}

export function CyclicMapPreview({ palette }: { palette: Palette }) {
  const gradient = createCyclicGradient(palette.colors[0]!);
  return <PreviewFrame title="Cyclic Map"><div className="h-28 rounded-xl" style={{ backgroundImage: gradient.css }} /></PreviewFrame>;
}

export function ConceptFigurePreview({ palette }: { palette: Palette }) {
  const gradient = createConceptGradient(palette.colors[palette.colors.length - 1]!);
  return (
    <PreviewFrame title="Concept Figure">
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl p-5" style={{ backgroundImage: gradient.css }}>
          <div className="space-y-2 rounded-xl bg-white/72 p-4 backdrop-blur">
            <div className="font-editorial text-2xl tracking-tight text-slate-950">Mechanistic diagram accent system</div>
            <p className="text-sm text-slate-700">Neutral scaffolding with one disciplined accent family keeps online figures readable and publication-ready.</p>
          </div>
        </div>
        <div className="grid gap-2">
          {palette.colors.slice(0, 4).map((color) => (
            <div key={color.id} className="rounded-xl border border-border/80 p-3" style={{ background: `${color.hex}18` }}>
              <div className="font-medium text-foreground">{color.name}</div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/55">{color.hex}</div>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}
