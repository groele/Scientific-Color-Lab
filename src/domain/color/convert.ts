import {
  converter,
  differenceCiede2000,
  formatCss,
  formatHex,
  formatRgb,
  inGamut,
  parse,
} from 'culori';
import type { CopyFormat, NumericOklch, ScientificColor } from '@/domain/models';

interface ScientificColorOptions {
  id?: string;
  name?: string;
  source?: ScientificColor['source'];
  tags?: string[];
  usage?: string[];
  notes?: string;
}

interface RawOklch {
  l: number;
  c: number;
  h: number;
  alpha?: number;
}

const toRgb = converter('rgb');
const toLab = converter('lab');
const toHsl = converter('hsl');
const toOklch = converter('oklch');
const deltaE = differenceCiede2000();
const isRgbGamut = inGamut('rgb');

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeHue(hue: number) {
  const normalized = hue % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function createId(prefix = 'color') {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function gamutMapOklch(input: RawOklch) {
  const candidate = {
    mode: 'oklch' as const,
    l: clamp(input.l, 0, 1),
    c: Math.max(0, input.c),
    h: normalizeHue(input.h),
    alpha: input.alpha ?? 1,
  };

  if (isRgbGamut(candidate)) {
    return { color: candidate, clipped: false };
  }

  let low = 0;
  let high = candidate.c;
  let best = { ...candidate, c: 0 };

  for (let step = 0; step < 28; step += 1) {
    const mid = (low + high) / 2;
    const probe = { ...candidate, c: mid };

    if (isRgbGamut(probe)) {
      best = probe;
      low = mid;
    } else {
      high = mid;
    }
  }

  return { color: best, clipped: true };
}

export function scientificColorFromOklch(
  input: RawOklch,
  options: ScientificColorOptions = {},
): ScientificColor {
  const { color, clipped } = gamutMapOklch(input);
  const rgb = toRgb(color);
  const hsl = toHsl(color);
  const lab = toLab(color);
  const oklch = toOklch(color);

  if (!rgb || !hsl || !lab || !oklch) {
    throw new Error('Unable to convert color to displayable formats.');
  }

  const now = new Date().toISOString();

  return {
    id: options.id ?? createId(),
    name: options.name ?? 'Derived Color',
    copyLabel: options.name ?? 'Derived Color',
    favoriteable: true,
    insertable: true,
    hex: formatHex(rgb),
    rgb: {
      r: Math.round(clamp(rgb.r ?? 0, 0, 1) * 255),
      g: Math.round(clamp(rgb.g ?? 0, 0, 1) * 255),
      b: Math.round(clamp(rgb.b ?? 0, 0, 1) * 255),
    },
    hsl: {
      h: round(normalizeHue(hsl.h ?? 0), 1),
      s: round((hsl.s ?? 0) * 100, 1),
      l: round((hsl.l ?? 0) * 100, 1),
    },
    lab: {
      l: round(lab.l ?? 0, 2),
      a: round(lab.a ?? 0, 2),
      b: round(lab.b ?? 0, 2),
    },
    oklch: {
      l: round(oklch.l ?? 0, 4),
      c: round(oklch.c ?? 0, 4),
      h: round(normalizeHue(oklch.h ?? 0), 2),
    },
    alpha: round(color.alpha ?? 1, 3),
    cssColor: formatCss(rgb),
    source: options.source ?? { kind: 'generated' },
    gamutStatus: clipped ? 'mapped' : 'in-gamut',
    tags: options.tags ?? [],
    usage: options.usage ?? [],
    notes: options.notes ?? '',
    createdAt: now,
    updatedAt: now,
  };
}

export function scientificColorFromString(value: string, options: ScientificColorOptions = {}) {
  const parsed = parse(value);
  const oklch = parsed ? toOklch(parsed) : undefined;

  if (!oklch) {
    throw new Error(`Invalid color input: ${value}`);
  }

  return scientificColorFromOklch(
    {
      l: oklch.l ?? 0,
      c: oklch.c ?? 0,
      h: oklch.h ?? 0,
      alpha: oklch.alpha ?? 1,
    },
    options,
  );
}

export function serializeColorByFormat(color: ScientificColor, format: CopyFormat) {
  switch (format) {
    case 'hex':
      return color.hex;
    case 'rgb':
      return `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`;
    case 'hsl':
      return `${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%`;
    case 'lab':
      return `lab(${color.lab.l} ${color.lab.a} ${color.lab.b})`;
    case 'oklch':
      return `oklch(${color.oklch.l} ${color.oklch.c} ${color.oklch.h})`;
    case 'css':
      return color.cssColor;
    default:
      return color.hex;
  }
}

export function createColorLabel(index: number, prefix: string) {
  return `${prefix} ${String(index + 1).padStart(2, '0')}`;
}

export function colorDistance(colorA: ScientificColor, colorB: ScientificColor) {
  return deltaE(colorA.hex, colorB.hex);
}

export function averageOklch(colors: ScientificColor[]): NumericOklch {
  const total = colors.length || 1;
  const sums = colors.reduce(
    (accumulator, color) => {
      accumulator.l += color.oklch.l;
      accumulator.c += color.oklch.c;
      accumulator.x += Math.cos((color.oklch.h * Math.PI) / 180);
      accumulator.y += Math.sin((color.oklch.h * Math.PI) / 180);
      return accumulator;
    },
    { l: 0, c: 0, x: 0, y: 0 },
  );

  return {
    l: round(sums.l / total, 4),
    c: round(sums.c / total, 4),
    h: round(normalizeHue((Math.atan2(sums.y / total, sums.x / total) * 180) / Math.PI), 2),
  };
}

export function readableRgbString(color: ScientificColor) {
  return formatRgb({
    mode: 'rgb',
    r: color.rgb.r / 255,
    g: color.rgb.g / 255,
    b: color.rgb.b / 255,
    alpha: color.alpha,
  });
}
