import { describe, expect, it } from 'vitest';
import { scientificColorFromString } from '@/domain/color/convert';
import { buildExportPayload } from '@/domain/export/service';
import type { ExportProfile, Palette, Project } from '@/domain/models';

function samplePalette(): Palette {
  const colors = ['#315d88', '#b9835d', '#637c64'].map((hex, index) =>
    scientificColorFromString(hex, {
      id: `sample-${index + 1}`,
      name: `Sample ${index + 1}`,
      source: { kind: 'manual', detail: 'test' },
      tags: ['test'],
      usage: ['categorical'],
      notes: 'sample note',
    }),
  );

  return {
    id: 'palette-test',
    name: 'Sample Palette',
    class: 'qualitative',
    colors,
    baseColorId: colors[0]!.id,
    diagnostics: { score: 100, status: 'healthy', summary: 'Healthy score 100', quickFixes: [], items: [] },
    tags: ['study', 'test'],
    notes: 'palette note',
    provenance: { source: 'manual', reference: 'test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('export service', () => {
  it('produces a readable zh-CN palette summary without mojibake', () => {
    const palette = samplePalette();
    const profile: ExportProfile = {
      id: 'profile-summary',
      name: 'Summary',
      scope: 'palette',
      format: 'summary',
      language: 'zh-CN',
      includeMetadata: true,
      includeTags: true,
      notesBehavior: 'separate',
      filenameTemplate: '{name}-{language}-{format}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const payload = buildExportPayload({ profile, palette });

    expect(payload.filename).toContain('sample-palette');
    expect(payload.content).toContain('调色板: Sample Palette');
    expect(payload.content).toContain('类型: qualitative');
    expect(payload.content).toContain('标签: study, test');
    expect(payload.content).toContain('--- 备注 ---');
  });

  it('produces a readable en project summary with included palettes', () => {
    const palette = samplePalette();
    const project: Project = {
      id: 'project-1',
      name: 'Project One',
      description: 'project description',
      tagIds: ['tag-1'],
      notes: 'project note',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const profile: ExportProfile = {
      id: 'profile-project',
      name: 'Project JSON',
      scope: 'project',
      format: 'json',
      language: 'en',
      includeMetadata: true,
      includeTags: true,
      notesBehavior: 'inline',
      filenameTemplate: '{name}-{format}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const payload = buildExportPayload({ profile, project, projectPalettes: [palette] });

    expect(payload.content).toContain('"palettes"');
    expect(payload.content).toContain('Sample Palette');
    expect(payload.content).toContain('Project One');
  });

  it('rejects invalid export sources instead of producing mismatched preview content', () => {
    const profile: ExportProfile = {
      id: 'profile-empty',
      name: 'Empty',
      scope: 'project',
      format: 'summary',
      language: 'en',
      includeMetadata: true,
      includeTags: true,
      notesBehavior: 'inline',
      filenameTemplate: '{name}-{format}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => buildExportPayload({ profile })).toThrow('Missing export project.');
  });
});
