import { createId, readableRgbString } from '@/domain/color/convert';
import type {
  ColorToken,
  ExportFormat,
  ExportProfile,
  ExportScope,
  LanguageCode,
  Palette,
  Project,
  SavedExport,
} from '@/domain/models';
import { slugify } from '@/lib/utils';

interface ExportInput {
  profile: ExportProfile;
  palette?: Palette;
  color?: ColorToken;
  project?: Project;
  projectPalettes?: Palette[];
}

interface ExportPayload {
  filename: string;
  content: string;
}

type SummaryLabelKey =
  | 'color'
  | 'palette'
  | 'project'
  | 'class'
  | 'description'
  | 'usage'
  | 'tags'
  | 'notesSection'
  | 'notSpecified'
  | 'none'
  | 'includedPalettes';

const SUMMARY_LABELS: Record<LanguageCode, Record<SummaryLabelKey, string>> = {
  en: {
    color: 'Color',
    palette: 'Palette',
    project: 'Project',
    class: 'Class',
    description: 'Description',
    usage: 'Usage',
    tags: 'Tags',
    notesSection: 'NOTES',
    notSpecified: 'not specified',
    none: 'none',
    includedPalettes: 'Included palettes:',
  },
  'zh-CN': {
    color: '颜色',
    palette: '调色板',
    project: '项目',
    class: '类型',
    description: '说明',
    usage: '用途',
    tags: '标签',
    notesSection: '备注',
    notSpecified: '未填写',
    none: '无',
    includedPalettes: '包含的调色板:',
  },
};

function summaryLabel(language: LanguageCode, key: SummaryLabelKey) {
  return SUMMARY_LABELS[language][key];
}

function summaryLine(language: LanguageCode, key: SummaryLabelKey, value: string) {
  return `${summaryLabel(language, key)}: ${value}`;
}

function listOrFallback(values: string[], language: LanguageCode) {
  return values.length ? values.join(', ') : summaryLabel(language, 'none');
}

function withNotes(notes: string, behavior: ExportProfile['notesBehavior'], language: LanguageCode) {
  if (behavior === 'omit') {
    return '';
  }

  if (behavior === 'separate') {
    return notes ? `\n--- ${summaryLabel(language, 'notesSection')} ---\n${notes}` : '';
  }

  return notes;
}

function compactColor(color: ColorToken, profile: ExportProfile) {
  return {
    name: color.name,
    hex: color.hex,
    rgb: readableRgbString(color),
    hsl: `hsl(${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%)`,
    lab: `lab(${color.lab.l} ${color.lab.a} ${color.lab.b})`,
    oklch: `oklch(${color.oklch.l} ${color.oklch.c} ${color.oklch.h})`,
    alpha: color.alpha,
    ...(profile.includeTags ? { tags: color.tags, usage: color.usage } : {}),
    ...(profile.includeMetadata ? { gamutStatus: color.gamutStatus, source: color.source } : {}),
    ...(profile.notesBehavior !== 'omit' ? { notes: color.notes } : {}),
  };
}

function compactPalette(palette: Palette, profile: ExportProfile) {
  return {
    id: palette.id,
    name: palette.name,
    class: palette.class,
    colors: palette.colors.map((color) => compactColor(color, profile)),
    ...(profile.includeTags ? { tags: palette.tags } : {}),
    ...(profile.includeMetadata
      ? {
          diagnostics: palette.diagnostics,
          provenance: palette.provenance,
          categories: palette.categories,
          baseColorId: palette.baseColorId,
        }
      : {}),
    ...(profile.notesBehavior !== 'omit' ? { notes: palette.notes } : {}),
  };
}

function paletteRows(palette: Palette, profile: ExportProfile) {
  return palette.colors.map((color) =>
    [
      color.name,
      color.hex,
      readableRgbString(color),
      `hsl(${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%)`,
      `lab(${color.lab.l} ${color.lab.a} ${color.lab.b})`,
      `oklch(${color.oklch.l} ${color.oklch.c} ${color.oklch.h})`,
      profile.includeTags ? color.tags.join('|') : '',
      profile.includeTags ? color.usage.join('|') : '',
      profile.notesBehavior !== 'omit' ? JSON.stringify(color.notes) : '',
    ].join(', '),
  );
}

function exportJson(scope: ExportScope, profile: ExportProfile, palette?: Palette, color?: ColorToken, project?: Project, projectPalettes: Palette[] = []) {
  return JSON.stringify(
    {
      scope,
      color: color ? compactColor(color, profile) : undefined,
      palette: palette ? compactPalette(palette, profile) : undefined,
      project:
        scope === 'project' && project
          ? {
              id: project.id,
              name: project.name,
              description: project.description,
              ...(profile.includeTags ? { tagIds: project.tagIds } : {}),
              ...(profile.notesBehavior !== 'omit' ? { notes: project.notes } : {}),
              palettes: projectPalettes.map((entry) => compactPalette(entry, profile)),
            }
          : undefined,
    },
    null,
    2,
  );
}

function exportCsv(scope: ExportScope, profile: ExportProfile, palette?: Palette, color?: ColorToken, project?: Project, projectPalettes: Palette[] = []) {
  if (scope === 'color' && color) {
    return [
      'name,hex,rgb,hsl,lab,oklch,alpha,tags,usage,notes',
      [
        color.name,
        color.hex,
        readableRgbString(color),
        `hsl(${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%)`,
        `lab(${color.lab.l} ${color.lab.a} ${color.lab.b})`,
        `oklch(${color.oklch.l} ${color.oklch.c} ${color.oklch.h})`,
        color.alpha,
        profile.includeTags ? color.tags.join('|') : '',
        profile.includeTags ? color.usage.join('|') : '',
        profile.notesBehavior !== 'omit' ? JSON.stringify(color.notes) : '',
      ].join(', '),
    ].join('\n');
  }

  if (scope === 'project' && project) {
    const header = 'projectId,projectName,description,paletteName,paletteClass,colorCount';
    const rows = projectPalettes.map((entry) =>
      [project.id, project.name, JSON.stringify(project.description ?? ''), entry.name, entry.class, entry.colors.length].join(', '),
    );
    return [header, ...rows].join('\n');
  }

  if (!palette) {
    return '';
  }

  return ['name,hex,rgb,hsl,lab,oklch,tags,usage,notes', ...paletteRows(palette, profile)].join('\n');
}

function exportCssVariables(palette?: Palette) {
  if (!palette) {
    return ':root {}';
  }

  return [':root {', ...palette.colors.map((color, index) => `  --${slugify(palette.name)}-${index + 1}: ${color.hex};`), '}'].join('\n');
}

function exportTailwindTokens(palette?: Palette) {
  if (!palette) {
    return JSON.stringify({ colors: {} }, null, 2);
  }

  return JSON.stringify(
    {
      theme: {
        extend: {
          colors: Object.fromEntries(palette.colors.map((color, index) => [`${slugify(palette.name)}-${index + 1}`, color.hex])),
        },
      },
    },
    null,
    2,
  );
}

function exportMatplotlib(palette?: Palette) {
  if (!palette) {
    return 'scientific_color_lab = []';
  }

  return ['scientific_color_lab = [', ...palette.colors.map((color) => `    {"name": "${color.name}", "hex": "${color.hex}"},`), ']'].join('\n');
}

function exportPlotly(palette?: Palette) {
  if (!palette) {
    return JSON.stringify({ layout: { colorway: [] } }, null, 2);
  }

  return JSON.stringify(
    {
      layout: { colorway: palette.colors.map((color) => color.hex) },
      data: { scatter: [{ marker: { line: { width: 1.2 } } }] },
    },
    null,
    2,
  );
}

function exportMatlab(palette?: Palette) {
  if (!palette) {
    return 'scientific_color_lab = [];';
  }

  const rows = palette.colors.map(
    (color) => `    [${(color.rgb.r / 255).toFixed(4)}, ${(color.rgb.g / 255).toFixed(4)}, ${(color.rgb.b / 255).toFixed(4)}]; % ${color.name}`,
  );
  return ['scientific_color_lab = [', ...rows, '];'].join('\n');
}

function exportSummary(language: LanguageCode, scope: ExportScope, profile: ExportProfile, palette?: Palette, color?: ColorToken, project?: Project, projectPalettes: Palette[] = []) {
  if (scope === 'color' && color) {
    return [
      summaryLine(language, 'color', color.name),
      `HEX: ${color.hex}`,
      `RGB: ${readableRgbString(color)}`,
      `OKLCH: ${color.oklch.l} / ${color.oklch.c} / ${color.oklch.h}`,
      summaryLine(language, 'usage', listOrFallback(color.usage, language)),
      profile.includeTags ? summaryLine(language, 'tags', listOrFallback(color.tags, language)) : '',
      withNotes(color.notes, profile.notesBehavior, language),
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (scope === 'project' && project) {
    return [
      summaryLine(language, 'project', project.name),
      summaryLine(language, 'description', project.description ?? summaryLabel(language, 'notSpecified')),
      profile.includeTags ? summaryLine(language, 'tags', String(project.tagIds.length)) : '',
      withNotes(project.notes ?? '', profile.notesBehavior, language),
      '',
      summaryLabel(language, 'includedPalettes'),
      ...projectPalettes.map((entry, index) => `${index + 1}. ${entry.name} (${entry.class})`),
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (!palette) {
    return '';
  }

  return [
    summaryLine(language, 'palette', palette.name),
    summaryLine(language, 'class', palette.class),
    profile.includeTags ? summaryLine(language, 'tags', listOrFallback(palette.tags, language)) : '',
    withNotes(palette.notes, profile.notesBehavior, language),
    '',
    ...palette.colors.map((entry, index) => `${index + 1}. ${entry.name} ${entry.hex}`),
  ]
    .filter(Boolean)
    .join('\n');
}

function serializeExport(format: ExportFormat, scope: ExportScope, profile: ExportProfile, palette?: Palette, color?: ColorToken, project?: Project, projectPalettes: Palette[] = []) {
  switch (format) {
    case 'json':
      return exportJson(scope, profile, palette, color, project, projectPalettes);
    case 'csv':
      return exportCsv(scope, profile, palette, color, project, projectPalettes);
    case 'css':
      return exportCssVariables(palette);
    case 'tailwind':
      return exportTailwindTokens(palette);
    case 'matplotlib':
      return exportMatplotlib(palette);
    case 'plotly':
      return exportPlotly(palette);
    case 'matlab':
      return exportMatlab(palette);
    case 'summary':
      return exportSummary(profile.language, scope, profile, palette, color, project, projectPalettes);
    default:
      return exportJson(scope, profile, palette, color, project, projectPalettes);
  }
}

function extensionForFormat(format: ExportFormat) {
  switch (format) {
    case 'css':
      return 'css';
    case 'csv':
      return 'csv';
    case 'matplotlib':
      return 'py';
    case 'plotly':
      return 'json';
    case 'tailwind':
      return 'json';
    case 'matlab':
      return 'm';
    case 'summary':
      return 'txt';
    case 'json':
    default:
      return 'json';
  }
}

function validateExportInput(scope: ExportScope, palette?: Palette, color?: ColorToken, project?: Project) {
  if (scope === 'color' && !color) {
    throw new Error('Missing export color.');
  }

  if (scope === 'palette' && !palette) {
    throw new Error('Missing export palette.');
  }

  if (scope === 'project' && !project) {
    throw new Error('Missing export project.');
  }
}

export function buildExportPayload({ profile, palette, color, project, projectPalettes = [] }: ExportInput): ExportPayload {
  validateExportInput(profile.scope, palette, color, project);

  const baseName = project?.name ?? palette?.name ?? color?.name ?? 'scientific-color-lab';
  const filename = profile.filenameTemplate
    .replace('{name}', slugify(baseName))
    .replace('{format}', profile.format)
    .replace('{language}', profile.language);
  const content = serializeExport(profile.format, profile.scope, profile, palette, color, project, projectPalettes);
  const extension = extensionForFormat(profile.format);

  return {
    filename: filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`,
    content,
  };
}

export function createExportRecord(
  profile: ExportProfile,
  payload: ExportPayload,
  scope: ExportScope,
  language: LanguageCode,
  palette?: Palette,
  color?: ColorToken,
  project?: Project,
): SavedExport {
  return {
    id: createId('export'),
    profileId: profile.id,
    paletteId: palette?.id,
    colorId: color?.id,
    projectId: project?.id,
    language,
    format: profile.format,
    scope,
    filename: payload.filename,
    content: payload.content,
    createdAt: new Date().toISOString(),
  };
}
