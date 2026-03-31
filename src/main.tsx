import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import '@/i18n';
import { registerScientificColorLabPwa } from '@/pwa/register';
import '@/styles/index.css';

registerScientificColorLabPwa();

const routerBase = import.meta.env.BASE_URL.replace(/\/+$/, '') || '';
const redirectedPath = new URLSearchParams(window.location.search).get('redirect');
if (redirectedPath) {
  const normalizedRedirect = redirectedPath.startsWith('/') ? redirectedPath : `/${redirectedPath}`;
  const nextUrl =
    routerBase && normalizedRedirect.startsWith(routerBase)
      ? normalizedRedirect
      : `${routerBase}${normalizedRedirect}` || normalizedRedirect;
  window.history.replaceState(null, '', nextUrl);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
