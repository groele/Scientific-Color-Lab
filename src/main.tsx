import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import '@/i18n';
import { registerScientificColorLabPwa } from '@/pwa/register';
import '@/styles/index.css';

registerScientificColorLabPwa();

const redirectedPath = new URLSearchParams(window.location.search).get('redirect');
if (redirectedPath) {
  const nextUrl = redirectedPath.startsWith('/') ? redirectedPath : `/${redirectedPath}`;
  window.history.replaceState(null, '', nextUrl);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
