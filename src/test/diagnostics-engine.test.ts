import { describe, expect, it } from 'vitest';
import { scientificColorFromString } from '@/domain/color/convert';
import { evaluatePalette } from '@/domain/diagnostics/engine';
import { applyDiagnosticQuickFix } from '@/domain/diagnostics/quick-fixes';
import type { Palette } from '@/domain/models';

function buildSequentialPalette(colors: string[]): Palette {
  const swatches = colors.map((hex, index) =>
    scientificColorFromString(hex, {
      id: `seq-${index + 1}`,
      name: `Step ${index + 1}`,
      source: { kind: 'manual', detail: 'test' },
      tags: ['test'],
      usage: ['heatmap'],
      notes: '',
    }),
  );

  return {
    id: 'palette-seq',
    name: 'Broken Sequential',
    class: 'sequential',
    colors: swatches,
    baseColorId: swatches[0]?.id,
    diagnostics: { score: 0, status: 'healthy', summary: '', quickFixes: [], items: [] },
    tags: ['test'],
    notes: '',
    provenance: { source: 'manual', reference: 'test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('diagnostics engine', () => {
  it('returns status and quick fixes for a risky sequential palette', () => {
    const palette = buildSequentialPalette(['#fcfdbf', '#6f1d80', '#fe9f6d', '#000004']);
    const diagnostics = evaluatePalette(palette);

    expect(diagnostics.status).toBe('high-risk');
    expect(diagnostics.quickFixes.some((fix) => fix.id === 'rebuild-sequential-ramp')).toBe(true);
    expect(diagnostics.quickFixes.some((fix) => fix.id === 'suggest-safer-template')).toBe(true);
  });

  it('applies sequential quick fixes without changing palette length', () => {
    const palette = buildSequentialPalette(['#fcfdbf', '#6f1d80', '#fe9f6d', '#000004']);
    const repaired = applyDiagnosticQuickFix(palette, 'rebuild-sequential-ramp');

    expect(repaired.colors).toHaveLength(palette.colors.length);
    expect(repaired.diagnostics.score).toBeGreaterThanOrEqual(palette.diagnostics.score);
  });
});
