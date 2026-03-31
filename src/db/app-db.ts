import Dexie, { type Table } from 'dexie';
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

export class ScientificColorLabDB extends Dexie {
  palettes!: Table<Palette, string>;
  projects!: Table<Project, string>;
  assets!: Table<ProjectAsset, string>;
  favorites!: Table<FavoriteRef, string>;
  recents!: Table<RecentEntry, string>;
  exports!: Table<SavedExport, string>;
  exportProfiles!: Table<ExportProfile, string>;
  tags!: Table<Tag, string>;
  settings!: Table<{ id: string; value: Partial<PersistedSettings> }, string>;

  constructor() {
    super('scientific-color-lab');

    this.version(1).stores({
      palettes: 'id, name, class, projectId, *tags, updatedAt',
      projects: 'id, name, updatedAt',
      favorites: 'id, kind, targetId, createdAt',
      recents: 'id, type, targetId, createdAt',
      exports: 'id, paletteId, format, createdAt',
      tags: 'id, label',
      settings: 'id',
    });

    this.version(2).stores({
      palettes: 'id, name, class, projectId, templateId, *tags, updatedAt',
      projects: 'id, name, updatedAt',
      assets: 'id, projectId, assetKind, targetId, updatedAt',
      favorites: 'id, kind, targetId, createdAt',
      recents: 'id, type, targetId, createdAt',
      exports: 'id, paletteId, projectId, colorId, format, scope, createdAt',
      exportProfiles: 'id, scope, format, updatedAt',
      tags: 'id, label',
      settings: 'id',
    });
  }
}

export const db = new ScientificColorLabDB();
