import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColorToken } from '@/domain/models';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';

const handleSwatchClick = vi.fn();
const handleSwatchDoubleClick = vi.fn();
const copyByFormat = vi.fn();
const favoriteColor = vi.fn();

vi.mock('@/hooks/use-color-actions', () => ({
  useColorActions: () => ({
    handleSwatchClick,
    handleSwatchDoubleClick,
    copyByFormat,
    favoriteColor,
  }),
}));

function createColor(): ColorToken {
  const now = new Date().toISOString();
  return {
    id: 'color-1',
    hex: '#3366FF',
    name: 'Test Blue',
    copyLabel: 'Test Blue',
    favoriteable: true,
    insertable: true,
    rgb: { r: 51, g: 102, b: 255 },
    hsl: { h: 225, s: 100, l: 60 },
    lab: { l: 50, a: 10, b: -60 },
    oklch: { l: 0.62, c: 0.18, h: 264 },
    alpha: 1,
    cssColor: '#3366FF',
    source: { kind: 'manual' },
    gamutStatus: 'in-gamut',
    tags: [],
    usage: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

describe('ColorSwatchButton overflow menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the menu via portal and does not trigger swatch selection when opening it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <div className="overflow-hidden">
        <ColorSwatchButton color={createColor()} onSelect={onSelect} onInsert={vi.fn()} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /open color menu/i }));

    expect(screen.getByText('Copy RGB')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('closes on outside click and escape, and menu actions do not trigger primary swatch click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <div className="overflow-hidden">
        <ColorSwatchButton color={createColor()} onSelect={onSelect} onInsert={vi.fn()} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /open color menu/i }));
    await user.click(screen.getByText('Copy RGB'));

    expect(copyByFormat).toHaveBeenCalledWith(expect.objectContaining({ id: 'color-1' }), 'rgb', expect.any(HTMLElement));
    expect(onSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Copy RGB')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /open color menu/i }));
    expect(screen.getByText('Favorite')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Favorite')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /open color menu/i }));
    expect(screen.getByText('Add to palette')).toBeInTheDocument();
    await user.click(document.body);
    await waitFor(() => expect(screen.queryByText('Add to palette')).not.toBeInTheDocument());
  });
});
