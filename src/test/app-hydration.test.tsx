import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PersistedSettings } from '@/domain/models';
import '@/i18n';
import { App } from '@/app/App';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
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
  const deferred = createDeferred<PersistedSettings>();
  const diagnosticsState = {
    applySettings: vi.fn(),
  };
  const preferencesState = {
    applySettings: vi.fn(),
  };
  const i18nState = {
    applySettings: vi.fn(async () => undefined),
  };
  const workspaceState = {
    setCopyFormat: vi.fn(),
  };

  return {
    deferred,
    diagnosticsState,
    preferencesState,
    i18nState,
    workspaceState,
  };
});

vi.mock('@/routes/app-routes', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes ready</div>,
}));

vi.mock('@/services/settings-runtime', () => ({
  loadFullSettings: vi.fn(() => boot.deferred.promise),
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
  it('renders routes immediately and applies restored settings after background restore settles', async () => {
    render(<App />);

    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    expect(screen.queryByTestId('app-hydration')).not.toBeInTheDocument();

    boot.deferred.resolve({
      language: 'en',
      copyFormat: 'oklch',
      thresholds: {
        categoricalDeltaE: 10,
        minimumContrast: 3,
        maxQualitativeColors: 7,
        maximumChroma: 0.22,
      },
      backgroundMode: 'light',
      showWelcome: true,
    });

    await waitFor(() => {
      expect(boot.preferencesState.applySettings).toHaveBeenCalled();
      expect(boot.diagnosticsState.applySettings).toHaveBeenCalled();
      expect(boot.i18nState.applySettings).toHaveBeenCalled();
      expect(boot.workspaceState.setCopyFormat).toHaveBeenCalledWith('oklch');
    });
  });
});
