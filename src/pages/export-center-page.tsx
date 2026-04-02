import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { RouteNavigationPanel } from '@/app/route-navigation-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SplitPanelLayout } from '@/components/ui/split-panel-layout';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast-provider';
import { createId } from '@/domain/color/convert';
import { buildExportPayload, createExportRecord } from '@/domain/export/service';
import type { ExportFormat, ExportProfile, ExportScope, LanguageCode, NotesBehavior } from '@/domain/models';
import { useLibraryHydration } from '@/hooks/use-library-hydration';
import { downloadText } from '@/lib/utils';
import { useLibraryStore } from '@/stores/library-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

type ProfileDraftState = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

const formatLabelKeyByFormat: Record<ExportFormat, string> = {
  json: 'exports:formatJson',
  csv: 'exports:formatCsv',
  css: 'exports:formatCss',
  tailwind: 'exports:formatTailwind',
  matplotlib: 'exports:formatMatplotlib',
  plotly: 'exports:formatPlotly',
  matlab: 'exports:formatMatlab',
  summary: 'exports:formatSummary',
};

const scopeLabelKeyByScope: Record<ExportScope, string> = {
  color: 'exports:scopeColor',
  palette: 'exports:scopePalette',
  project: 'exports:scopeProject',
};

function createDraftProfile(name: string, base?: ExportProfile): ExportProfile {
  const now = new Date().toISOString();
  return (
    base ?? {
      id: createId('profile'),
      name,
      scope: 'palette',
      format: 'json',
      language: 'en',
      includeMetadata: true,
      includeTags: true,
      notesBehavior: 'inline',
      filenameTemplate: '{name}-{language}-{format}',
      createdAt: now,
      updatedAt: now,
    }
  );
}

function normalizeProfile(profile: ExportProfile) {
  return JSON.stringify({
    name: profile.name,
    scope: profile.scope,
    format: profile.format,
    language: profile.language,
    includeMetadata: profile.includeMetadata,
    includeTags: profile.includeTags,
    notesBehavior: profile.notesBehavior,
    filenameTemplate: profile.filenameTemplate,
  });
}

export function ExportCenterPage() {
  const { t } = useTranslation(['common', 'exports']);
  const { pushToast } = useToast();
  const location = useLocation();
  const libraryHydrated = useLibraryHydration('core');
  const currentPalette = useWorkspaceStore((state) => state.currentPalette);
  const selectedColor = useWorkspaceStore((state) => state.getSelectedColor());
  const palettes = useLibraryStore((state) => state.palettes);
  const projects = useLibraryStore((state) => state.projects);
  const exportProfiles = useLibraryStore((state) => state.exportProfiles);
  const saveExport = useLibraryStore((state) => state.saveExport);
  const saveExportProfile = useLibraryStore((state) => state.saveExportProfile);
  const remember = useLibraryStore((state) => state.remember);

  const [profileId, setProfileId] = useState(exportProfiles[0]?.id ?? '');
  const [draftProfile, setDraftProfile] = useState<ExportProfile>(createDraftProfile(t('exports:newProfileName'), exportProfiles[0]));
  const [draftBaseline, setDraftBaseline] = useState<ExportProfile | null>(exportProfiles[0] ?? null);
  const [draftState, setDraftState] = useState<ProfileDraftState>('clean');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [paletteId, setPaletteId] = useState(currentPalette.id);

  const activeProfile = exportProfiles.find((profile) => profile.id === profileId) ?? null;

  useEffect(() => {
    if (!activeProfile) {
      return;
    }

    setDraftProfile(activeProfile);
    setDraftBaseline(activeProfile);
    setDraftState('clean');
  }, [activeProfile]);

  useEffect(() => {
    if (!paletteId) {
      setPaletteId(currentPalette.id);
    }
  }, [currentPalette.id, paletteId]);

  useEffect(() => {
    if (!projectId && projects[0]) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  useEffect(() => {
    const routeState = location.state as { scope?: ExportScope; paletteId?: string; projectId?: string } | null;
    if (!routeState) {
      return;
    }

    if (routeState.scope) {
      setDraftProfile((current) => ({ ...current, scope: routeState.scope! }));
      setDraftState('dirty');
    }

    if (routeState.paletteId) {
      setPaletteId(routeState.paletteId);
    }

    if (routeState.projectId) {
      setProjectId(routeState.projectId);
    }
  }, [location.state]);

  const paletteOptions = useMemo(
    () => [currentPalette, ...palettes.filter((palette) => palette.id !== currentPalette.id)],
    [currentPalette, palettes],
  );
  const selectedPalette = paletteOptions.find((palette) => palette.id === paletteId) ?? currentPalette;
  const selectedProject = projects.find((project) => project.id === projectId) ?? projects[0];
  const projectPalettes = useMemo(
    () => palettes.filter((palette) => palette.projectId === selectedProject?.id),
    [palettes, selectedProject?.id],
  );

  const updateDraftProfile = (updater: (current: ExportProfile) => ExportProfile) => {
    setDraftProfile((current) => {
      const next = updater(current);
      const baselineMatches = draftBaseline ? normalizeProfile(next) === normalizeProfile(draftBaseline) : false;
      setDraftState(baselineMatches ? 'clean' : 'dirty');
      return next;
    });
  };

  const payloadState = useMemo(() => {
    try {
      return {
        payload: buildExportPayload({
          profile: draftProfile,
          palette: draftProfile.scope === 'palette' ? selectedPalette : currentPalette,
          color: draftProfile.scope === 'color' ? selectedColor : undefined,
          project: draftProfile.scope === 'project' ? selectedProject : undefined,
          projectPalettes: draftProfile.scope === 'project' ? projectPalettes : [],
        }),
        error: null,
      };
    } catch (error) {
      return {
        payload: null,
        error: error instanceof Error ? error.message : t('exports:invalidSource'),
      };
    }
  }, [currentPalette, draftProfile, projectPalettes, selectedColor, selectedPalette, selectedProject, t]);

  const previewHeader = t('exports:previewHeader', {
    format: t(formatLabelKeyByFormat[draftProfile.format]),
    scope: t(scopeLabelKeyByScope[draftProfile.scope]),
    language: draftProfile.language === 'zh-CN' ? t('exports:languageChinese') : t('exports:languageEnglish'),
  });

  const statusMessage =
    !libraryHydrated
      ? t('common:loadingWorkspace')
      : draftState === 'saving'
        ? t('exports:draftSaving')
        : draftState === 'saved'
          ? t('exports:draftClean')
          : draftState === 'error'
            ? t('exports:draftError')
            : draftState === 'dirty'
              ? t('exports:draftDirty')
              : t('exports:draftClean');

  const saveProfile = async () => {
    const profile = {
      ...draftProfile,
      updatedAt: new Date().toISOString(),
      createdAt: draftProfile.createdAt || new Date().toISOString(),
    };

    setDraftState('saving');
    try {
      await saveExportProfile(profile);
      setDraftProfile(profile);
      setDraftBaseline(profile);
      setProfileId(profile.id);
      setDraftState('saved');
      pushToast(t('exports:profileSaved'));
    } catch {
      setDraftState('error');
      pushToast(t('exports:draftError'));
    }
  };

  const runExport = async () => {
    if (!payloadState.payload) {
      pushToast(payloadState.error ?? t('exports:invalidSource'));
      return;
    }

    try {
      downloadText(payloadState.payload.filename, payloadState.payload.content);
      await saveExport(
        createExportRecord(
          draftProfile,
          payloadState.payload,
          draftProfile.scope,
          draftProfile.language,
          draftProfile.scope === 'palette' ? selectedPalette : currentPalette,
          draftProfile.scope === 'color' ? selectedColor : undefined,
          draftProfile.scope === 'project' ? selectedProject : undefined,
        ),
      );

      if (draftProfile.scope === 'project' && selectedProject) {
        await remember('project', selectedProject.id, selectedProject.name, '/exports');
      } else if (draftProfile.scope === 'color' && selectedColor) {
        await remember('color', selectedColor.id, selectedColor.name, '/exports');
      } else {
        await remember('palette', selectedPalette.id, selectedPalette.name, '/exports');
      }

      pushToast(t('exports:exportSaved', { filename: payloadState.payload.filename }));
    } catch {
      pushToast(t('exports:draftError'));
    }
  };

  return (
    <SplitPanelLayout
      left={
        <>
          <RouteNavigationPanel />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:profiles')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={profileId} onChange={(event) => setProfileId(event.target.value)}>
                {exportProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </Select>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  const profile = createDraftProfile(t('exports:newProfileName'));
                  setDraftProfile(profile);
                  setDraftBaseline(null);
                  setProfileId(profile.id);
                  setDraftState('dirty');
                }}
              >
                {t('exports:createProfile')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:sourceSelection')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={draftProfile.scope} onChange={(event) => updateDraftProfile((current) => ({ ...current, scope: event.target.value as ExportScope }))}>
                <option value="color">{t('exports:scopeColor')}</option>
                <option value="palette">{t('exports:scopePalette')}</option>
                <option value="project">{t('exports:scopeProject')}</option>
              </Select>

              {draftProfile.scope === 'palette' ? (
                <Select value={paletteId} onChange={(event) => setPaletteId(event.target.value)}>
                  {paletteOptions.map((palette) => (
                    <option key={palette.id} value={palette.id}>
                      {palette.name}
                    </option>
                  ))}
                </Select>
              ) : null}

              {draftProfile.scope === 'project' ? (
                <Select value={selectedProject?.id ?? ''} onChange={(event) => setProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              ) : null}
            </CardContent>
          </Card>
        </>
      }
      center={
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:sourceSelection')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
              <div className="rounded-2xl border border-border/80 bg-muted/25 p-4">
                <div className="section-label">{t('exports:currentPalette')}</div>
                <div className="mt-2 font-medium text-foreground">{selectedPalette.name}</div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {selectedPalette.colors.slice(0, 6).map((color) => (
                    <div key={color.id} className="rounded-xl border border-border/80 bg-panel px-3 py-3 text-sm">
                      <div className="font-medium text-foreground">{color.name}</div>
                      <div className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-foreground/55">{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/25 p-4 text-sm text-foreground/70">
                <div className="section-label">{t('exports:exportTargets')}</div>
                <div className="mt-3 space-y-2">
                  <div>
                    {t('exports:currentColor')}: {selectedColor?.name ?? t('common:none')}
                  </div>
                  <div>
                    {t('exports:currentPalette')}: {selectedPalette.name}
                  </div>
                  <div>
                    {t('exports:currentProject')}: {selectedProject?.name ?? t('common:none')}
                  </div>
                  {draftProfile.scope === 'project' ? (
                    <div>
                      {t('exports:projectPalettes')}: {projectPalettes.length}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:profileConfiguration')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 xl:grid-cols-2">
              <Input
                value={draftProfile.name}
                onChange={(event) => updateDraftProfile((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('exports:profileName')}
              />
              <Input
                value={draftProfile.filenameTemplate}
                onChange={(event) => updateDraftProfile((current) => ({ ...current, filenameTemplate: event.target.value }))}
                placeholder={t('exports:filenameTemplate')}
              />

              <Select value={draftProfile.format} onChange={(event) => updateDraftProfile((current) => ({ ...current, format: event.target.value as ExportFormat }))}>
                <option value="json">{t('exports:formatJson')}</option>
                <option value="csv">{t('exports:formatCsv')}</option>
                <option value="css">{t('exports:formatCss')}</option>
                <option value="tailwind">{t('exports:formatTailwind')}</option>
                <option value="matplotlib">{t('exports:formatMatplotlib')}</option>
                <option value="plotly">{t('exports:formatPlotly')}</option>
                <option value="matlab">{t('exports:formatMatlab')}</option>
                <option value="summary">{t('exports:formatSummary')}</option>
              </Select>

              <Select
                value={draftProfile.language}
                onChange={(event) => updateDraftProfile((current) => ({ ...current, language: event.target.value as LanguageCode }))}
              >
                <option value="en">{t('exports:languageEnglish')}</option>
                <option value="zh-CN">{t('exports:languageChinese')}</option>
              </Select>

              <Select
                value={draftProfile.includeMetadata ? 'yes' : 'no'}
                onChange={(event) => updateDraftProfile((current) => ({ ...current, includeMetadata: event.target.value === 'yes' }))}
              >
                <option value="yes">
                  {t('exports:includeMetadata')}: {t('common:yes')}
                </option>
                <option value="no">
                  {t('exports:includeMetadata')}: {t('common:no')}
                </option>
              </Select>

              <Select
                value={draftProfile.includeTags ? 'yes' : 'no'}
                onChange={(event) => updateDraftProfile((current) => ({ ...current, includeTags: event.target.value === 'yes' }))}
              >
                <option value="yes">
                  {t('exports:includeTags')}: {t('common:yes')}
                </option>
                <option value="no">
                  {t('exports:includeTags')}: {t('common:no')}
                </option>
              </Select>

              <Select
                value={draftProfile.notesBehavior}
                onChange={(event) => updateDraftProfile((current) => ({ ...current, notesBehavior: event.target.value as NotesBehavior }))}
              >
                <option value="inline">{t('exports:notesInline')}</option>
                <option value="separate">{t('exports:notesSeparate')}</option>
                <option value="omit">{t('exports:notesOmit')}</option>
              </Select>

              <div className="xl:col-span-2">
                <Button className="w-full" variant="outline" onClick={() => void saveProfile()} disabled={!libraryHydrated}>
                  {t('exports:saveProfile')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:preview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/80 bg-muted/35 p-3 font-mono text-sm text-foreground/70">
                {payloadState.payload?.filename ?? t('exports:invalidSource')}
              </div>
              <div className="rounded-2xl border border-border/80 bg-panel p-4">
                <div className="section-label">{t('exports:exportFormat')}</div>
                <div className="mt-2 text-sm text-foreground/65">{previewHeader}</div>
              </div>
              {payloadState.payload ? (
                <Textarea value={payloadState.payload.content} readOnly className="min-h-[520px]" />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-foreground/65">
                  {payloadState.error ?? t('exports:invalidSource')}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      }
      right={
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('exports:actions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/80 bg-muted/25 p-3 text-sm text-foreground/65">{statusMessage}</div>
            <Button className="w-full" onClick={() => void runExport()} disabled={!libraryHydrated || !payloadState.payload}>
              {t('exports:exportNow')}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => window.history.back()}>
              {t('common:cancel')}
            </Button>
          </CardContent>
        </Card>
      }
    />
  );
}
