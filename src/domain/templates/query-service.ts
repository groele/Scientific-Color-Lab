import type { TemplateDescriptor } from '@/domain/models';
import { paletteFromColors } from '@/domain/color/palette';
import { scientificColorFromString } from '@/domain/color/convert';

export interface TemplateFilters {
  chartType?: TemplateDescriptor['chartType'] | 'all';
  structure?: TemplateDescriptor['structure'] | 'all';
  backgroundMode?: TemplateDescriptor['backgroundMode'] | 'all';
  size?: number | 'all';
  tone?: TemplateDescriptor['tone'] | 'all';
  academicUsage?: TemplateDescriptor['academicUsage'] | 'all';
}

export function filterTemplateCatalog(
  templates: TemplateDescriptor[],
  query: string,
  filters: TemplateFilters,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return templates.filter((template) => {
    if (filters.chartType && filters.chartType !== 'all' && template.chartType !== filters.chartType) {
      return false;
    }

    if (filters.structure && filters.structure !== 'all' && template.structure !== filters.structure) {
      return false;
    }

    if (filters.backgroundMode && filters.backgroundMode !== 'all' && template.backgroundMode !== filters.backgroundMode) {
      return false;
    }

    if (filters.size && filters.size !== 'all' && template.size !== filters.size) {
      return false;
    }

    if (filters.tone && filters.tone !== 'all' && template.tone !== filters.tone) {
      return false;
    }

    if (filters.academicUsage && filters.academicUsage !== 'all' && template.academicUsage !== filters.academicUsage) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [template.name, template.description, template.chartType, template.structure, template.tone, template.academicUsage, ...template.tags]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function templateToPalette(template: TemplateDescriptor) {
  const colors = template.hexes.map((hex, index) =>
    scientificColorFromString(hex, {
      id: `${template.id}-${index + 1}`,
      name: `${template.name} ${index + 1}`,
      source: { kind: 'preset', detail: template.id },
      tags: template.tags,
      usage: [template.chartType, template.academicUsage],
      notes: template.description,
    }),
  );

  const palette = paletteFromColors(template.name, template.paletteClass, colors, 'preset');
  return {
    ...palette,
    templateId: template.id,
    categories: {
      chartType: template.chartType,
      structure: template.structure,
      background: template.backgroundMode,
      size: template.size,
      tone: template.tone,
      usage: template.academicUsage,
    },
    notes: template.description,
  };
}
