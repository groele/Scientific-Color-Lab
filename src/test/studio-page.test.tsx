import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import { ToastProvider } from '@/components/ui/toast-provider';
import { WorkspacePage } from '@/pages/workspace-page';

describe('WorkspacePage', () => {
  it('renders the workspace shell', () => {
    const view = render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/workspace?view=swatches']}>
          <Routes>
            <Route path="/workspace" element={<WorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    expect(view.getByText(/Scientific color workspace/i)).toBeInTheDocument();
    expect(view.getByText(/Palette Canvas/i)).toBeInTheDocument();
  });
});
