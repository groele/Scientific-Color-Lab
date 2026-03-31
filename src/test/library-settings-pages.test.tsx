import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import { i18n } from '@/i18n';
import { LibraryPage } from '@/pages/library-page';
import { SettingsPage } from '@/pages/settings-page';

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
    expect(view.getByText('Saved palettes')).toBeInTheDocument();
    expect(view.getByText('Project workspace')).toBeInTheDocument();
  });

  it('renders the settings workflow structure in Chinese', async () => {
    await i18n.changeLanguage('zh-CN');

    const view = render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(view.getByText('偏好设置')).toBeInTheDocument();
    expect(view.getByText('设置摘要')).toBeInTheDocument();
    expect(view.getByText('诊断阈值')).toBeInTheDocument();
  });
});
