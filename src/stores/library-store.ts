import { create } from 'zustand';
import type {
  ExportProfile,
  FavoriteKind,
  FavoriteRef,
  Palette,
  PaletteImportResult,
  Project,
  ProjectAsset,
  RecentEntry,
  SavedExport,
  Tag,
} from '@/domain/models';
import {
  assetRepository,
  exportProfileRepository,
  exportRepository,
  favoriteRepository,
  paletteRepository,
  projectRepository,
  recentRepository,
  tagRepository,
} from '@/db/repositories';
import { createId } from '@/domain/color/convert';
import { importPaletteFromCsv, importPaletteFromJson } from '@/domain/library/import';

let hydrationPromise: Promise<void> | null = null;

function defaultProject(): Project {
  const now = new Date().toISOString();
  return {
    id: 'project-current-study',
    name: 'Current Study',
    description: 'Local-first working group for active palette experiments.',
    tagIds: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

function defaultExportProfiles(): ExportProfile[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'profile-palette-json-en',
      name: 'Palette JSON',
      scope: 'palette',
      format: 'json',
      language: 'en',
      includeMetadata: true,
      includeTags: true,
      notesBehavior: 'inline',
      filenameTemplate: '{name}-{language}-{format}',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'profile-palette-css-zh',
      name: 'Palette CSS Variables',
      scope: 'palette',
      format: 'css',
      language: 'zh-CN',
      includeMetadata: false,
      includeTags: false,
      notesBehavior: 'omit',
      filenameTemplate: '{name}-{format}',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'profile-project-summary-en',
      name: 'Project Summary',
      scope: 'project',
      format: 'summary',
      language: 'en',
      includeMetadata: true,
      includeTags: true,
      notesBehavior: 'separate',
      filenameTemplate: '{name}-project-{language}',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function paletteAssetFromPalette(palette: Palette, projectId: string): ProjectAsset {
  return {
    id: `asset-${palette.id}`,
    projectId,
    assetKind: 'palette',
    targetId: palette.id,
    name: palette.name,
    tags: palette.tags,
    notes: palette.notes,
    createdAt: palette.createdAt,
    updatedAt: palette.updatedAt,
  };
}

function upsertById<T extends { id: string }>(collection: T[], nextItem: T) {
  return [nextItem, ...collection.filter((entry) => entry.id !== nextItem.id)];
}

interface LibraryState {
  palettes: Palette[];
  projects: Project[];
  assets: ProjectAsset[];
  favorites: FavoriteRef[];
  recents: RecentEntry[];
  savedExports: SavedExport[];
  exportProfiles: ExportProfile[];
  tags: Tag[];
  search: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSearch: (value: string) => void;
  savePalette: (palette: Palette, projectId?: string) => Promise<void>;
  assignPaletteToProject: (paletteId: string, projectId?: string) => Promise<void>;
  toggleFavorite: (kind: FavoriteKind, targetId: string, name?: string) => Promise<void>;
  remember: (type: RecentEntry['type'], targetId: string, label: string, route?: string) => Promise<void>;
  saveExport: (record: SavedExport) => Promise<void>;
  saveExportProfile: (profile: ExportProfile) => Promise<void>;
  registerProjectAsset: (asset: ProjectAsset) => Promise<void>;
  createProject: (name: string, description?: string, tagIds?: string[], notes?: string) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
  saveTag: (label: string) => Promise<Tag>;
  deleteTag: (tagId: string) => Promise<void>;
  importText: (text: string, format: 'json' | 'csv') => Promise<PaletteImportResult>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  palettes: [],
  projects: [],
  assets: [],
  favorites: [],
  recents: [],
  savedExports: [],
  exportProfiles: [],
  tags: [],
  search: '',
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    if (!hydrationPromise) {
      hydrationPromise = (async () => {
        let projects = await projectRepository.list();
        if (!projects.length) {
          const seeded = defaultProject();
          await projectRepository.save(seeded);
          projects = [seeded];
        }

        let exportProfiles = await exportProfileRepository.list();
        if (!exportProfiles.length) {
          const seeded = defaultExportProfiles();
          await Promise.all(seeded.map((profile) => exportProfileRepository.save(profile)));
          exportProfiles = seeded;
        }

        const [palettes, favorites, recents, savedExports, assets, tags] = await Promise.all([
          paletteRepository.list(),
          favoriteRepository.list(),
          recentRepository.list(),
          exportRepository.list(),
          assetRepository.list(),
          tagRepository.list(),
        ]);

        set({ projects, palettes, favorites, recents, savedExports, exportProfiles, assets, tags, hydrated: true });
      })().finally(() => {
        hydrationPromise = null;
      });
    }

    await hydrationPromise;
  },
  setSearch: (search) => set({ search }),
  savePalette: async (palette, projectId) => {
    const nextPalette = { ...palette, projectId, updatedAt: new Date().toISOString() };
    await paletteRepository.save(nextPalette);

    if (projectId) {
      await assetRepository.save(paletteAssetFromPalette(nextPalette, projectId));
    }

    set((state) => ({
      palettes: upsertById(state.palettes, nextPalette),
      assets:
        projectId != null
          ? upsertById(state.assets, paletteAssetFromPalette(nextPalette, projectId))
          : state.assets.filter((asset) => asset.targetId !== nextPalette.id),
    }));
  },
  assignPaletteToProject: async (paletteId, projectId) => {
    const palette = get().palettes.find((entry) => entry.id === paletteId);
    if (!palette) {
      return;
    }

    const nextPalette = { ...palette, projectId, updatedAt: new Date().toISOString() };
    await paletteRepository.save(nextPalette);

    if (projectId) {
      await assetRepository.save(paletteAssetFromPalette(nextPalette, projectId));
    } else {
      await assetRepository.delete(`asset-${paletteId}`);
    }

    set((state) => ({
      palettes: upsertById(state.palettes, nextPalette),
      assets:
        projectId != null
          ? upsertById(state.assets, paletteAssetFromPalette(nextPalette, projectId))
          : state.assets.filter((asset) => asset.id !== `asset-${paletteId}`),
    }));
  },
  toggleFavorite: async (kind, targetId, name) => {
    const reference: FavoriteRef = {
      id: `${kind}-${targetId}`,
      kind,
      targetId,
      name,
      createdAt: new Date().toISOString(),
    };
    const enabled = await favoriteRepository.toggle(reference);
    set((state) => ({
      favorites: enabled
        ? [reference, ...state.favorites]
        : state.favorites.filter((entry) => entry.id !== reference.id),
    }));
  },
  remember: async (type, targetId, label, route) => {
    const entry: RecentEntry = {
      id: `${type}-${targetId}`,
      type,
      targetId,
      label,
      route,
      createdAt: new Date().toISOString(),
    };
    await recentRepository.push(entry);
    set((state) => ({
      recents: upsertById(state.recents, entry).slice(0, 24),
    }));
  },
  saveExport: async (record) => {
    await exportRepository.save(record);
    set((state) => ({ savedExports: upsertById(state.savedExports, record) }));
  },
  saveExportProfile: async (profile) => {
    await exportProfileRepository.save(profile);
    set((state) => ({
      exportProfiles: upsertById(state.exportProfiles, profile),
    }));
  },
  registerProjectAsset: async (asset) => {
    await assetRepository.save(asset);
    set((state) => ({ assets: upsertById(state.assets, asset) }));
  },
  createProject: async (name, description = '', tagIds = [], notes = '') => {
    const now = new Date().toISOString();
    const project: Project = {
      id: createId('project'),
      name,
      description,
      tagIds,
      notes,
      createdAt: now,
      updatedAt: now,
    };

    await projectRepository.save(project);
    set((state) => ({ projects: upsertById(state.projects, project) }));
    return project;
  },
  updateProject: async (projectId, updates) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const nextProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await projectRepository.save(nextProject);
    set((state) => ({ projects: upsertById(state.projects, nextProject) }));
  },
  saveTag: async (label) => {
    const normalized = label.trim();
    const existing = get().tags.find((tag) => tag.label.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      return existing;
    }

    const tag: Tag = {
      id: createId('tag'),
      label: normalized,
    };
    await tagRepository.save(tag);
    set((state) => ({ tags: [...state.tags, tag].sort((left, right) => left.label.localeCompare(right.label)) }));
    return tag;
  },
  deleteTag: async (tagId) => {
    await tagRepository.delete(tagId);
    const nextProjects = get().projects.map((project) =>
      project.tagIds.includes(tagId)
        ? { ...project, tagIds: project.tagIds.filter((entry) => entry !== tagId), updatedAt: new Date().toISOString() }
        : project,
    );
    await Promise.all(nextProjects.map((project) => projectRepository.save(project)));
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== tagId),
      projects: nextProjects,
    }));
  },
  importText: async (text, format) => {
    const result = format === 'json' ? importPaletteFromJson(text) : importPaletteFromCsv(text);

    if (!result.palette) {
      return result;
    }

    await paletteRepository.save(result.palette);
    set((state) => ({ palettes: upsertById(state.palettes, result.palette!) }));
    return result;
  },
}));
