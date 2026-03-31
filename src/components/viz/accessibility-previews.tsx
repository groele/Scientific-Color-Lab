import type { Palette } from '@/domain/models';
import { simulateGrayscale, simulatePaletteCvd } from '@/domain/diagnostics/engine';
import { colorDistance } from '@/domain/color/convert';

function PaletteRow({ label, colors }: { label: string; colors: Palette['colors'] }) {
  return (
    <div className="space-y-2">
      <div className="section-label">{label}</div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {colors.map((color) => (
          <div key={color.id} className="overflow-hidden rounded-xl border border-border/80">
            <div className="h-14" style={{ background: color.hex }} />
            <div className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/65">{color.hex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContrastChecker({ palette }: { palette: Palette }) {
  return (
    <div className="panel-surface p-4">
      <div className="section-label">Contrast Checker</div>
      <div className="mt-3 grid gap-2">
        {palette.colors.map((color) => (
          <div key={color.id} className="flex items-center justify-between rounded-xl border border-border/80 p-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full border border-border/70" style={{ background: color.hex }} />
              <span className="text-sm">{color.name}</span>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/55">{color.hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GrayscalePreview({ palette }: { palette: Palette }) {
  return <PaletteRow label="Grayscale Preview" colors={simulateGrayscale(palette.colors)} />;
}

export function CvdPreview({ palette }: { palette: Palette }) {
  return (
    <div className="grid gap-5">
      <PaletteRow label="Deuteranopia" colors={simulatePaletteCvd(palette.colors, 'deuteranopia')} />
      <PaletteRow label="Protanopia" colors={simulatePaletteCvd(palette.colors, 'protanopia')} />
      <PaletteRow label="Tritanopia" colors={simulatePaletteCvd(palette.colors, 'tritanopia')} />
    </div>
  );
}

export function SimilarityMatrix({ palette }: { palette: Palette }) {
  return (
    <div className="panel-surface overflow-hidden">
      <div className="border-b border-border/80 px-4 py-3">
        <div className="section-label">Categorical Similarity</div>
      </div>
      <div className="overflow-auto p-4">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-2" />
              {palette.colors.map((color) => (
                <th key={color.id} className="px-2 py-2 font-mono uppercase tracking-[0.18em] text-foreground/55">
                  {color.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {palette.colors.map((row) => (
              <tr key={row.id}>
                <th className="px-2 py-2 text-left font-mono uppercase tracking-[0.18em] text-foreground/55">{row.name}</th>
                {palette.colors.map((column) => (
                  <td key={column.id} className="px-2 py-2 text-center text-foreground/70">
                    {row.id === column.id ? '—' : colorDistance(row, column).toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
