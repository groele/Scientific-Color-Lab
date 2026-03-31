import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { DiagnosticsPanel } from '@/components/workspace/diagnostics-panel';
import type { PaletteDiagnostics } from '@/domain/models';

const diagnostics: PaletteDiagnostics = {
  score: 72,
  status: 'needs-attention',
  summary: '2 warnings to review · score 72',
  quickFixes: [
    { id: 'reduce-chroma' },
    { id: 'suggest-safer-template' },
  ],
  items: [
    {
      id: 'item-1',
      code: 'oversaturation-risk',
      severity: 'warning',
      category: 'palette-risk',
      title: 'Oversaturation risk',
      message: 'Too vivid for restrained scientific use.',
      suggestion: 'Reduce chroma.',
    },
    {
      id: 'item-2',
      code: 'categorical-too-similar',
      severity: 'warning',
      category: 'categorical',
      title: 'Categorical colors are too similar',
      message: 'Two swatches are too close together.',
      suggestion: 'Increase spacing.',
    },
  ],
};

describe('DiagnosticsPanel', () => {
  it('renders as a collapsed assistant summary with quick fixes', async () => {
    const user = userEvent.setup();
    const onQuickFix = vi.fn();
    const view = render(<DiagnosticsPanel diagnostics={diagnostics} onQuickFix={onQuickFix} />);

    expect(view.getByText(/Needs attention/i)).toBeInTheDocument();
    expect(view.getByText(/Quick fixes/i)).toBeInTheDocument();
    expect(view.queryByText(/Increase spacing/i)).not.toBeInTheDocument();

    await user.click(view.getByRole('button', { name: /View details/i }));
    expect(view.getByText(/Increase spacing/i)).toBeInTheDocument();

    await user.click(view.getByRole('button', { name: /Reduce chroma/i }));
    expect(onQuickFix).toHaveBeenCalledWith('reduce-chroma');
  });
});
