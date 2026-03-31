import type { ScientificColor } from '@/domain/models';

export function MetadataTable({ color }: { color: ScientificColor }) {
  const rows = [
    ['HEX', color.hex],
    ['RGB', `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`],
    ['HSL', `${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%`],
    ['Lab', `${color.lab.l} ${color.lab.a} ${color.lab.b}`],
    ['OKLCH', `${color.oklch.l} ${color.oklch.c} ${color.oklch.h}`],
    ['CSS', color.cssColor],
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border/80">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-border/70 last:border-none">
              <th className="w-20 bg-muted/60 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                {label}
              </th>
              <td className="px-3 py-2 font-mono text-xs text-foreground/80">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
