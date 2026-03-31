import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/app/app-shell';

const WorkspacePage = lazy(() => import('@/pages/workspace-page').then((module) => ({ default: module.WorkspacePage })));
const LibraryPage = lazy(() => import('@/pages/library-page').then((module) => ({ default: module.LibraryPage })));
const AnalyzerPage = lazy(() => import('@/pages/analyzer-page').then((module) => ({ default: module.AnalyzerPage })));
const ExportCenterPage = lazy(() => import('@/pages/export-center-page').then((module) => ({ default: module.ExportCenterPage })));
const SettingsPage = lazy(() => import('@/pages/settings-page').then((module) => ({ default: module.SettingsPage })));
const routerBase = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';
const useHashRouter = import.meta.env.BASE_URL !== '/';

function Layout() {
  const { t } = useTranslation(['common']);

  return (
    <AppShell>
      <Suspense fallback={<div className="rounded-2xl border border-border/80 bg-panel p-6 text-sm text-foreground/65">{t('common:loadingWorkspace')}</div>}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

export function AppRoutes() {
  const Router = useHashRouter ? HashRouter : BrowserRouter;
  const routerProps = useHashRouter ? {} : { basename: routerBase };

  return (
    <Router {...routerProps}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/workspace" replace />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/analyzer" element={<AnalyzerPage />} />
          <Route path="/exports" element={<ExportCenterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/studio" element={<Navigate to="/workspace" replace />} />
          <Route path="/generators" element={<Navigate to="/workspace?view=chart-preview" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
