import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import '@/i18n';
import { registerScientificColorLabPwa } from '@/pwa/register';
import { useI18nStore } from '@/stores/i18n-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { loadStartupSnapshot } from '@/services/settings-runtime';
import '@/styles/index.css';

registerScientificColorLabPwa();

const routerBase = import.meta.env.BASE_URL.replace(/\/+$/, '') || '';
const useHashRouter = import.meta.env.BASE_URL !== '/';
const redirectedPath = new URLSearchParams(window.location.search).get('redirect');
if (redirectedPath) {
  const normalizedRedirect = redirectedPath.startsWith('/') ? redirectedPath : `/${redirectedPath}`;
  const nextUrl = useHashRouter
    ? `${routerBase}/#${normalizedRedirect}`
    : routerBase && normalizedRedirect.startsWith(routerBase)
      ? normalizedRedirect
      : `${routerBase}${normalizedRedirect}` || normalizedRedirect;
  window.history.replaceState(null, '', nextUrl);
}

const startupSnapshot = loadStartupSnapshot();
if (startupSnapshot) {
  usePreferencesStore.getState().primeFromSnapshot(startupSnapshot);
  useI18nStore.getState().primeFromSnapshot(startupSnapshot);
  useWorkspaceStore.getState().setCopyFormat(startupSnapshot.copyFormat);
  if (startupSnapshot.activeView) {
    useWorkspaceStore.getState().setActiveView(startupSnapshot.activeView);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
