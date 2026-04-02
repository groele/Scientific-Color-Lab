import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { i18n } from '@/i18n';
import { ensureLanguageResources } from '@/i18n/resources';
import { LibraryPage } from '@/pages/library-page';
import { SettingsPage } from '@/pages/settings-page';

vi.mock('@/hooks/use-library-hydration', () => ({
  useLibraryHydration: () => true,
}));

describe('Library and Settings pages', () => {
  it('renders the library workflow structure in English', async () => {
    await i18n.changeLanguage('en');

    const view = render(
      <MemoryRouter initialEntries={['/library']}>
        <Routes>
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(view.getByText('Search and focus')).toBeInTheDocument();
    expect(view.getByRole('heading', { name: 'Saved palettes' })).toBeInTheDocument();
    expect(view.getByRole('heading', { name: 'Project workspace' })).toBeInTheDocument();
  });

  it('renders the settings workflow structure with readable copy when Chinese resources fall back', async () => {
    await ensureLanguageResources(i18n, 'zh-CN');
    await i18n.changeLanguage('zh-CN');

    const view = render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(view.getByRole('heading', { name: /preferences|偏好设置/i })).toBeInTheDocument();
    expect(view.getByText(/settings summary|设置摘要/i)).toBeInTheDocument();
    expect(view.getAllByText(/thresholds|诊断阈值/i).length).toBeGreaterThan(0);
  });
});
