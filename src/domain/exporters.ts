import type { Palette, ScientificColor } from '@/domain/models';

function paletteRows(colors: ScientificColor[]) {
  return colors.map((color) =>
    [color.name, color.hex, `${color.rgb.r} ${color.rgb.g} ${color.rgb.b}`, `${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%`, `${color.lab.l} ${color.lab.a} ${color.lab.b}`, `${color.oklch.l} ${color.oklch.c} ${color.oklch.h}`].join(','),
  );
}

export function exportPaletteAsJson(palette: Palette) {
  return JSON.stringify(palette, null, 2);
}

export function exportPaletteAsCsv(palette: Palette) {
  return ['name,hex,rgb,hsl,lab,oklch', ...paletteRows(palette.colors)].join('\n');
}

export function exportPaletteAsCssVariables(palette: Palette) {
  return [':root {', ...palette.colors.map((color, index) => `  --${palette.id}-${index + 1}: ${color.hex};`), '}'].join('\n');
}

export function exportPaletteAsMatplotlib(palette: Palette) {
  return ['scientific_color_lab = [', ...palette.colors.map((color) => `    "${color.hex}",`), ']'].join('\n');
}

export function exportPaletteAsPlotlyTemplate(palette: Palette) {
  return JSON.stringify({ layout: { colorway: palette.colors.map((color) => color.hex) } }, null, 2);
}
