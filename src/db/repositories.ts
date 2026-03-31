import type {
  ExportProfile,
  FavoriteRef,
  Palette,
  PersistedSettings,
  Project,
  ProjectAsset,
  RecentEntry,
  SavedExport,
  Tag,
} from '@/domain/models';
import { db } from '@/db/app-db';
import { defaultDiagnosticThresholds } from '@/domain/diagnostics/engine';

export const defaultSettings: PersistedSettings = {
  language: 'en',
  copyFormat: 'hex',
  thresholds: defaultDiagnosticThresholds,
  backgroundMode: 'light',
  showWelcome: true,
};

export const paletteRepository = {
  list: () => db.palettes.orderBy('updatedAt').reverse().toArray(),
  save: async (palette: Palette) => {
    await db.palettes.put(palette);
    return palette;
  },
  bulkPut: (palettes: Palette[]) => db.palettes.bulkPut(palettes),
};

export const projectRepository = {
  list: () => db.projects.orderBy('updatedAt').reverse().toArray(),
  save: async (project: Project) => {
    await db.projects.put(project);
    return project;
  },
};

export const assetRepository = {
  list: () => db.assets.orderBy('updatedAt').reverse().toArray(),
  save: async (asset: ProjectAsset) => {
    await db.assets.put(asset);
    return asset;
  },
  delete: (id: string) => db.assets.delete(id),
};

export const favoriteRepository = {
  list: () => db.favorites.orderBy('createdAt').reverse().toArray(),
  async toggle(reference: FavoriteRef) {
    const existing = await db.favorites.get(reference.id);
    if (existing) {
      await db.favorites.delete(reference.id);
      return false;
    }

    await db.favorites.put(reference);
    return true;
  },
};

export const recentRepository = {
  list: () => db.recents.orderBy('createdAt').reverse().limit(24).toArray(),
  async push(entry: RecentEntry) {
    await db.recents.put(entry);
    return entry;
  },
};

export const exportRepository = {
  list: () => db.exports.orderBy('createdAt').reverse().toArray(),
  async save(record: SavedExport) {
    await db.exports.put(record);
    return record;
  },
};

export const exportProfileRepository = {
  list: () => db.exportProfiles.orderBy('updatedAt').reverse().toArray(),
  async save(profile: ExportProfile) {
    await db.exportProfiles.put(profile);
    return profile;
  },
};

export const tagRepository = {
  list: () => db.tags.orderBy('label').toArray(),
  save: async (tag: Tag) => {
    await db.tags.put(tag);
    return tag;
  },
  delete: (id: string) => db.tags.delete(id),
};

export const settingsRepository = {
  async load() {
    const record = await db.settings.get('app');
    return { ...defaultSettings, ...record?.value };
  },
  async save(value: Partial<PersistedSettings>) {
    const current = await this.load();
    const next = { ...current, ...value };
    await db.settings.put({ id: 'app', value: next });
    return next;
  },
};
