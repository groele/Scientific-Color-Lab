import { create } from 'zustand';
import { templateCatalog } from '@/data/templates/catalog';
import { filterTemplateCatalog, type TemplateFilters } from '@/domain/templates/query-service';
import type { TemplateDescriptor } from '@/domain/models';

interface TemplateState {
  templates: TemplateDescriptor[];
  query: string;
  filters: TemplateFilters;
  recentTemplateIds: string[];
  setQuery: (query: string) => void;
  setFilter: <K extends keyof TemplateFilters>(key: K, value: TemplateFilters[K]) => void;
  markRecent: (templateId: string) => void;
  getVisibleTemplates: () => TemplateDescriptor[];
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: templateCatalog,
  query: '',
  filters: {
    chartType: 'all',
    structure: 'all',
    backgroundMode: 'all',
    size: 'all',
    tone: 'all',
    academicUsage: 'all',
  },
  recentTemplateIds: [],
  setQuery: (query) => set({ query }),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  markRecent: (templateId) =>
    set((state) => ({
      recentTemplateIds: [templateId, ...state.recentTemplateIds.filter((entry) => entry !== templateId)].slice(0, 12),
    })),
  getVisibleTemplates: () => {
    const state = get();
    const visible = filterTemplateCatalog(state.templates, state.query, state.filters);
    return visible.sort((left, right) => {
      const leftIndex = state.recentTemplateIds.indexOf(left.id);
      const rightIndex = state.recentTemplateIds.indexOf(right.id);
      if (leftIndex === -1 && rightIndex === -1) {
        return 0;
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });
  },
}));
