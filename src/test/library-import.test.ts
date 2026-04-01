import { describe, expect, it } from 'vitest';
import { importPaletteFromCsv, importPaletteFromJson } from '@/domain/library/import';

describe('library import validation', () => {
  it('rejects malformed JSON cleanly', () => {
    const result = importPaletteFromJson('{bad json');

    expect(result.status).toBe('failed');
    expect(result.palette).toBeNull();
    expect(result.importedRows).toBe(0);
  });

  it('partially imports JSON palettes when some colors are invalid', () => {
    const result = importPaletteFromJson(
      JSON.stringify({
        name: 'Imported Study',
        class: 'qualitative',
        colors: [{ name: 'Blue', hex: '#2563EB' }, { name: 'Broken', hex: 'not-a-color' }, '#F59E0B'],
      }),
    );

    expect(result.status).toBe('partial');
    expect(result.palette?.name).toBe('Imported Study');
    expect(result.importedRows).toBe(2);
    expect(result.skippedRows).toBe(1);
  });

  it('skips invalid CSV rows and keeps the valid colors', () => {
    const csv = ['name,hex', 'Accent,#2563EB', 'Broken,nope', 'Support,#10B981'].join('\n');
    const result = importPaletteFromCsv(csv);

    expect(result.status).toBe('partial');
    expect(result.palette?.colors).toHaveLength(2);
    expect(result.importedRows).toBe(2);
    expect(result.skippedRows).toBe(1);
  });
});
