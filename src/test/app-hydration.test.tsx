import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { App } from '@/app/App';

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

function createMockStore<T extends object>(state: T) {
  const hook = ((selector?: (value: T) => unknown) => (selector ? selector(state) : state)) as ((selector?: (value: T) => unknown) => unknown) & {
    getState: () => T;
  };

  hook.getState = () => state;
  return hook;
}

const boot = vi.hoisted(() => {
  const library = createDeferred();
  const diagnostics = createDeferred();
  const preferences = createDeferred();
  const i18n = createDeferred();

  const libraryState = {
    hydrate: vi.fn(() => library.promise),
  };

  const diagnosticsState = {
    hydrate: vi.fn(() => diagnostics.promise),
  };

  const preferencesState = {
    copyFormat: 'rgb',
    hydrate: vi.fn(() => preferences.promise),
  };

  const i18nState = {
    hydrate: vi.fn(() => i18n.promise),
  };

  const workspaceState = {
    setCopyFormat: vi.fn(),
  };

  return {
    library,
    diagnostics,
    preferences,
    i18n,
    libraryState,
    diagnosticsState,
    preferencesState,
    i18nState,
    workspaceState,
  };
});

vi.mock('@/routes/app-routes', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes ready</div>,
}));

vi.mock('@/stores/library-store', () => ({
  useLibraryStore: createMockStore(boot.libraryState),
}));

vi.mock('@/stores/diagnostics-store', () => ({
  useDiagnosticsStore: createMockStore(boot.diagnosticsState),
}));

vi.mock('@/stores/preferences-store', () => ({
  usePreferencesStore: createMockStore(boot.preferencesState),
}));

vi.mock('@/stores/i18n-store', () => ({
  useI18nStore: createMockStore(boot.i18nState),
}));

vi.mock('@/stores/workspace-store', () => ({
  useWorkspaceStore: createMockStore(boot.workspaceState),
}));

describe('App boot hydration', () => {
  it('keeps the boot screen visible until hydration settles and then syncs preferences', async () => {
    render(<App />);

    expect(screen.getByTestId('app-hydration')).toBeInTheDocument();
    expect(screen.queryByTestId('app-routes')).not.toBeInTheDocument();

    boot.preferencesState.copyFormat = 'oklch';
    boot.library.resolve();
    boot.diagnostics.resolve();
    boot.preferences.resolve();
    boot.i18n.resolve();

    await screen.findByTestId('app-routes');

    expect(screen.queryByTestId('app-hydration')).not.toBeInTheDocument();
    expect(boot.workspaceState.setCopyFormat).toHaveBeenCalledWith('oklch');
  });
});
