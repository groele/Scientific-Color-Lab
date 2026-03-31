import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { downloadText } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useLibraryStore } from '@/stores/library-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

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

export function ExportCenterPage() {
  const { t } = useTranslation(['common', 'exports']);
  const { pushToast } = useToast();
  const { canInstall, install } = usePwaInstall();
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
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [paletteId, setPaletteId] = useState(currentPalette.id);

  useEffect(() => {
    const activeProfile = exportProfiles.find((profile) => profile.id === profileId);
    if (activeProfile) {
      setDraftProfile(activeProfile);
    }
  }, [exportProfiles, profileId]);

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

  const payload = useMemo(
    () =>
      buildExportPayload({
        profile: draftProfile,
        palette: draftProfile.scope === 'palette' ? selectedPalette : currentPalette,
        color: draftProfile.scope === 'color' ? selectedColor : undefined,
        project: draftProfile.scope === 'project' ? selectedProject : undefined,
        projectPalettes: draftProfile.scope === 'project' ? projectPalettes : [],
      }),
    [currentPalette, draftProfile, projectPalettes, selectedColor, selectedPalette, selectedProject],
  );

  const saveProfile = async () => {
    const profile = {
      ...draftProfile,
      updatedAt: new Date().toISOString(),
      createdAt: draftProfile.createdAt || new Date().toISOString(),
    };
    await saveExportProfile(profile);
    setProfileId(profile.id);
    pushToast(t('exports:profileSaved'));
  };

  const runExport = async () => {
    downloadText(payload.filename, payload.content);
    await saveExport(
      createExportRecord(
        draftProfile,
        payload,
        draftProfile.scope,
        draftProfile.language,
        draftProfile.scope === 'palette' ? selectedPalette : currentPalette,
        draftProfile.scope === 'color' ? selectedColor : undefined,
        draftProfile.scope === 'project' ? selectedProject : undefined,
      ),
    );
    await remember('palette', selectedPalette.id, selectedPalette.name, '/exports');
    pushToast(t('exports:exportSaved', { filename: payload.filename }));
  };

  return (
    <SplitPanelLayout
      left={
        <>
          <RouteNavigationPanel canInstall={canInstall} onInstall={() => void install()} />
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
                  setProfileId(profile.id);
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
              <Select value={draftProfile.scope} onChange={(event) => setDraftProfile((current) => ({ ...current, scope: event.target.value as ExportScope }))}>
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
              <CardTitle>{t('exports:profileConfiguration')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 xl:grid-cols-2">
              <Input
                value={draftProfile.name}
                onChange={(event) => setDraftProfile((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('exports:profileName')}
              />
              <Input
                value={draftProfile.filenameTemplate}
                onChange={(event) => setDraftProfile((current) => ({ ...current, filenameTemplate: event.target.value }))}
                placeholder={t('exports:filenameTemplate')}
              />

              <Select value={draftProfile.format} onChange={(event) => setDraftProfile((current) => ({ ...current, format: event.target.value as ExportFormat }))}>
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
                onChange={(event) => setDraftProfile((current) => ({ ...current, language: event.target.value as LanguageCode }))}
              >
                <option value="en">{t('exports:languageEnglish')}</option>
                <option value="zh-CN">{t('exports:languageChinese')}</option>
              </Select>

              <Select
                value={draftProfile.includeMetadata ? 'yes' : 'no'}
                onChange={(event) => setDraftProfile((current) => ({ ...current, includeMetadata: event.target.value === 'yes' }))}
              >
                <option value="yes">{t('exports:includeMetadata')}: {t('common:yes')}</option>
                <option value="no">{t('exports:includeMetadata')}: {t('common:no')}</option>
              </Select>

              <Select
                value={draftProfile.includeTags ? 'yes' : 'no'}
                onChange={(event) => setDraftProfile((current) => ({ ...current, includeTags: event.target.value === 'yes' }))}
              >
                <option value="yes">{t('exports:includeTags')}: {t('common:yes')}</option>
                <option value="no">{t('exports:includeTags')}: {t('common:no')}</option>
              </Select>

              <Select
                value={draftProfile.notesBehavior}
                onChange={(event) => setDraftProfile((current) => ({ ...current, notesBehavior: event.target.value as NotesBehavior }))}
              >
                <option value="inline">{t('exports:notesInline')}</option>
                <option value="separate">{t('exports:notesSeparate')}</option>
                <option value="omit">{t('exports:notesOmit')}</option>
              </Select>

              <div className="xl:col-span-2">
                <Button className="w-full" variant="outline" onClick={() => void saveProfile()}>
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
              <div className="rounded-xl border border-border/80 bg-muted/35 p-3 font-mono text-sm text-foreground/70">{payload.filename}</div>
              <Textarea value={payload.content} readOnly className="min-h-[560px]" />
            </CardContent>
          </Card>
        </>
      }
      right={
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:exportTargets')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground/70">
              <div>
                {t('exports:currentColor')}: {selectedColor.name}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('exports:actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => void runExport()}>
                {t('exports:exportNow')}
              </Button>
            </CardContent>
          </Card>
        </>
      }
    />
  );
}
