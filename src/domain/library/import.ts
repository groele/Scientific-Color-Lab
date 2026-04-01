import { createId, scientificColorFromString } from '@/domain/color/convert';
import { paletteFromColors } from '@/domain/color/palette';
import type { Palette, PaletteClass, PaletteImportResult, ScientificColor } from '@/domain/models';

const paletteClasses = new Set<PaletteClass>(['qualitative', 'sequential', 'diverging', 'cyclic', 'concept']);

type JsonLike = Record<string, unknown>;

function isRecord(value: unknown): value is JsonLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePaletteClass(value: unknown): PaletteClass {
  return typeof value === 'string' && paletteClasses.has(value as PaletteClass) ? (value as PaletteClass) : 'qualitative';
}

function buildImportedPalette(name: string, paletteClass: PaletteClass, colors: ScientificColor[], notes = '', tags: string[] = []) {
  const palette = paletteFromColors(name, paletteClass, colors, 'import');
  return {
    ...palette,
    notes,
    tags: [...new Set([...palette.tags, ...tags.filter(Boolean)])],
    updatedAt: new Date().toISOString(),
  } satisfies Palette;
}

function toImportedColor(input: string, name: string, detail: string) {
  try {
    return scientificColorFromString(input, {
      id: createId('import'),
      name,
      source: { kind: 'imported', detail },
      tags: ['import'],
      usage: ['imported'],
      notes: '',
    });
  } catch {
    return null;
  }
}

function parseJsonColor(entry: unknown, index: number) {
  if (typeof entry === 'string') {
    return toImportedColor(entry, `Imported ${index + 1}`, 'json');
  }

  if (!isRecord(entry)) {
    return null;
  }

  const colorValue =
    typeof entry.hex === 'string'
      ? entry.hex
      : typeof entry.value === 'string'
        ? entry.value
        : typeof entry.cssColor === 'string'
          ? entry.cssColor
          : null;
  if (!colorValue) {
    return null;
  }

  const colorName = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : `Imported ${index + 1}`;
  return toImportedColor(colorValue, colorName, 'json');
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function detectColorCell(cells: string[], colorIndex: number | null) {
  if (colorIndex != null) {
    return cells[colorIndex] ?? null;
  }

  return cells.find((cell) => /^#?[0-9a-f]{6}([0-9a-f]{2})?$/i.test(cell) || /^rgb|^hsl|^oklch|^oklab/i.test(cell)) ?? null;
}

export function importPaletteFromCsv(text: string): PaletteImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { status: 'failed', palette: null, importedRows: 0, skippedRows: 0, message: 'CSV content is empty.' };
  }

  const firstRow = parseCsvLine(lines[0]!);
  const normalizedHeaders = firstRow.map((cell) => cell.toLowerCase());
  const headerLooksStructured = normalizedHeaders.some((header) => ['name', 'hex', 'color', 'value', 'css'].includes(header));
  const colorIndex = normalizedHeaders.findIndex((header) => ['hex', 'color', 'value', 'css'].includes(header));
  const nameIndex = normalizedHeaders.findIndex((header) => header === 'name');
  const dataLines = headerLooksStructured ? lines.slice(1) : lines;

  const colors: ScientificColor[] = [];
  let skippedRows = 0;

  dataLines.forEach((line) => {
    const cells = parseCsvLine(line);
    const colorValue = detectColorCell(cells, colorIndex >= 0 ? colorIndex : null);
    if (!colorValue) {
      skippedRows += 1;
      return;
    }

    const colorName =
      nameIndex >= 0 && cells[nameIndex]?.trim() ? cells[nameIndex]!.trim() : `Imported ${colors.length + 1}`;
    const color = toImportedColor(colorValue, colorName, 'csv');
    if (!color) {
      skippedRows += 1;
      return;
    }

    colors.push(color);
  });

  if (!colors.length) {
    return {
      status: 'failed',
      palette: null,
      importedRows: 0,
      skippedRows,
      message: 'No parsable color rows were found in this CSV file.',
    };
  }

  const palette = buildImportedPalette('Imported CSV Palette', 'qualitative', colors);
  return {
    status: skippedRows > 0 ? 'partial' : 'success',
    palette,
    importedRows: colors.length,
    skippedRows,
    message: skippedRows > 0 ? 'Some CSV rows were skipped because they did not contain a valid color.' : undefined,
  };
}

export function importPaletteFromJson(text: string): PaletteImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: 'failed', palette: null, importedRows: 0, skippedRows: 0, message: 'Invalid JSON.' };
  }

  const source = isRecord(parsed) ? parsed : { colors: Array.isArray(parsed) ? parsed : [] };
  const colorsInput = Array.isArray(source.colors) ? source.colors : Array.isArray(parsed) ? parsed : [];
  const colors = colorsInput
    .map((entry, index) => parseJsonColor(entry, index))
    .filter((entry): entry is ScientificColor => entry != null);

  const skippedRows = colorsInput.length - colors.length;
  if (!colors.length) {
    return {
      status: 'failed',
      palette: null,
      importedRows: 0,
      skippedRows: Math.max(skippedRows, 0),
      message: 'No valid colors were found in this JSON input.',
    };
  }

  const name = typeof source.name === 'string' && source.name.trim() ? source.name.trim() : 'Imported JSON Palette';
  const notes = typeof source.notes === 'string' ? source.notes : '';
  const tags = Array.isArray(source.tags) ? source.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  const paletteClass = parsePaletteClass(source.class ?? source.type);
  const palette = buildImportedPalette(name, paletteClass, colors, notes, tags);

  return {
    status: skippedRows > 0 ? 'partial' : 'success',
    palette,
    importedRows: colors.length,
    skippedRows: Math.max(skippedRows, 0),
    message: skippedRows > 0 ? 'Some JSON colors were ignored because they were invalid.' : undefined,
  };
}
