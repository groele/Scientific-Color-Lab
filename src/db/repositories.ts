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
import { markStorageDegraded } from '@/services/storage-status';

export const defaultSettings: PersistedSettings = {
  language: 'en',
  copyFormat: 'hex',
  thresholds: defaultDiagnosticThresholds,
  backgroundMode: 'light',
  showWelcome: true,
};

const memoryStore: {
  palettes: Palette[];
  projects: Project[];
  assets: ProjectAsset[];
  favorites: FavoriteRef[];
  recents: RecentEntry[];
  exports: SavedExport[];
  exportProfiles: ExportProfile[];
  tags: Tag[];
  settings: PersistedSettings;
} = {
  palettes: [],
  projects: [],
  assets: [],
  favorites: [],
  recents: [],
  exports: [],
  exportProfiles: [],
  tags: [],
  settings: { ...defaultSettings },
};

function warnStorageFailure(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : `Unknown ${scope} storage error.`;
  markStorageDegraded(`Local storage is temporarily unavailable. ${scope}: ${message}`);
}

async function safeDb<T>(scope: string, action: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await action();
  } catch (error) {
    warnStorageFailure(scope, error);
    return fallback();
  }
}

function upsertById<T extends { id: string }>(collection: T[], nextItem: T) {
  return [nextItem, ...collection.filter((entry) => entry.id !== nextItem.id)];
}

function sortByUpdatedAt<T extends { updatedAt: string }>(collection: T[]) {
  return collection.slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function sortByCreatedAt<T extends { createdAt: string }>(collection: T[]) {
  return collection.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export const paletteRepository = {
  list: () =>
    safeDb(
      'palette list',
      () => db.palettes.orderBy('updatedAt').reverse().toArray(),
      () => sortByUpdatedAt(memoryStore.palettes),
    ),
  save: async (palette: Palette) =>
    safeDb(
      'palette save',
      async () => {
        await db.palettes.put(palette);
        return palette;
      },
      () => {
        memoryStore.palettes = upsertById(memoryStore.palettes, palette);
        return palette;
      },
    ),
  bulkPut: (palettes: Palette[]) =>
    safeDb(
      'palette bulk save',
      () => db.palettes.bulkPut(palettes),
      () => {
        palettes.forEach((palette) => {
          memoryStore.palettes = upsertById(memoryStore.palettes, palette);
        });
        return palettes[palettes.length - 1]?.id ?? '';
      },
    ),
};

export const projectRepository = {
  list: () =>
    safeDb(
      'project list',
      () => db.projects.orderBy('updatedAt').reverse().toArray(),
      () => sortByUpdatedAt(memoryStore.projects),
    ),
  save: async (project: Project) =>
    safeDb(
      'project save',
      async () => {
        await db.projects.put(project);
        return project;
      },
      () => {
        memoryStore.projects = upsertById(memoryStore.projects, project);
        return project;
      },
    ),
};

export const assetRepository = {
  list: () =>
    safeDb(
      'asset list',
      () => db.assets.orderBy('updatedAt').reverse().toArray(),
      () => sortByUpdatedAt(memoryStore.assets),
    ),
  save: async (asset: ProjectAsset) =>
    safeDb(
      'asset save',
      async () => {
        await db.assets.put(asset);
        return asset;
      },
      () => {
        memoryStore.assets = upsertById(memoryStore.assets, asset);
        return asset;
      },
    ),
  delete: (id: string) =>
    safeDb(
      'asset delete',
      () => db.assets.delete(id),
      () => {
        memoryStore.assets = memoryStore.assets.filter((asset) => asset.id !== id);
      },
    ),
};

export const favoriteRepository = {
  list: () =>
    safeDb(
      'favorite list',
      () => db.favorites.orderBy('createdAt').reverse().toArray(),
      () => sortByCreatedAt(memoryStore.favorites),
    ),
  async toggle(reference: FavoriteRef) {
    return safeDb(
      'favorite toggle',
      async () => {
        const existing = await db.favorites.get(reference.id);
        if (existing) {
          await db.favorites.delete(reference.id);
          return false;
        }

        await db.favorites.put(reference);
        return true;
      },
      () => {
        const existing = memoryStore.favorites.find((entry) => entry.id === reference.id);
        if (existing) {
          memoryStore.favorites = memoryStore.favorites.filter((entry) => entry.id !== reference.id);
          return false;
        }

        memoryStore.favorites = [reference, ...memoryStore.favorites];
        return true;
      },
    );
  },
};

export const recentRepository = {
  list: () =>
    safeDb(
      'recent list',
      () => db.recents.orderBy('createdAt').reverse().limit(24).toArray(),
      () => sortByCreatedAt(memoryStore.recents).slice(0, 24),
    ),
  async push(entry: RecentEntry) {
    return safeDb(
      'recent save',
      async () => {
        await db.recents.put(entry);
        return entry;
      },
      () => {
        memoryStore.recents = upsertById(memoryStore.recents, entry).slice(0, 24);
        return entry;
      },
    );
  },
};

export const exportRepository = {
  list: () =>
    safeDb(
      'export history list',
      () => db.exports.orderBy('createdAt').reverse().toArray(),
      () => sortByCreatedAt(memoryStore.exports),
    ),
  async save(record: SavedExport) {
    return safeDb(
      'export history save',
      async () => {
        await db.exports.put(record);
        return record;
      },
      () => {
        memoryStore.exports = upsertById(memoryStore.exports, record);
        return record;
      },
    );
  },
};

export const exportProfileRepository = {
  list: () =>
    safeDb(
      'export profile list',
      () => db.exportProfiles.orderBy('updatedAt').reverse().toArray(),
      () => sortByUpdatedAt(memoryStore.exportProfiles),
    ),
  async save(profile: ExportProfile) {
    return safeDb(
      'export profile save',
      async () => {
        await db.exportProfiles.put(profile);
        return profile;
      },
      () => {
        memoryStore.exportProfiles = upsertById(memoryStore.exportProfiles, profile);
        return profile;
      },
    );
  },
};

export const tagRepository = {
  list: () =>
    safeDb(
      'tag list',
      () => db.tags.orderBy('label').toArray(),
      () => memoryStore.tags.slice().sort((left, right) => left.label.localeCompare(right.label)),
    ),
  save: async (tag: Tag) =>
    safeDb(
      'tag save',
      async () => {
        await db.tags.put(tag);
        return tag;
      },
      () => {
        memoryStore.tags = upsertById(memoryStore.tags, tag).sort((left, right) => left.label.localeCompare(right.label));
        return tag;
      },
    ),
  delete: (id: string) =>
    safeDb(
      'tag delete',
      () => db.tags.delete(id),
      () => {
        memoryStore.tags = memoryStore.tags.filter((tag) => tag.id !== id);
      },
    ),
};

export const settingsRepository = {
  async load() {
    return safeDb(
      'settings load',
      async () => {
        const record = await db.settings.get('app');
        return { ...defaultSettings, ...record?.value };
      },
      () => ({ ...memoryStore.settings }),
    );
  },
  async save(value: Partial<PersistedSettings>) {
    return safeDb(
      'settings save',
      async () => {
        const current = await this.load();
        const next = { ...current, ...value };
        await db.settings.put({ id: 'app', value: next });
        return next;
      },
      () => {
        memoryStore.settings = { ...memoryStore.settings, ...value };
        return memoryStore.settings;
      },
    );
  },
};
