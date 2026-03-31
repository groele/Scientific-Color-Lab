import { describe, expect, it } from 'vitest';
import { templateCatalog } from '@/data/templates/catalog';
import { deriveScientificTemplateMeta } from '@/domain/templates/scientific-guidance';

describe('scientific template guidance', () => {
  it('marks high-contrast academic templates with stronger scientific labels', () => {
    const template = templateCatalog.find((entry) => entry.id === 'wong-safe-categorical-light');
    expect(template).toBeDefined();

    const meta = deriveScientificTemplateMeta(template!);

    expect(meta.labels).toContain('highContrast');
    expect(meta.labels).toContain('thinLineSafe');
    expect(meta.labels).toContain('cvdSafer');
  });

  it('marks dark-background heatmaps with darkBgHeatmap guidance', () => {
    const template = templateCatalog.find((entry) => entry.id === 'magma-dark-heatmap-dark');
    expect(template).toBeDefined();

    const meta = deriveScientificTemplateMeta(template!);

    expect(meta.labels).toContain('darkBgHeatmap');
    expect(meta.labels).toContain('orderedRamp');
  });
});
