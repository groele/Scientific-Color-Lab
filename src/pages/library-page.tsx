import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RouteNavigationPanel } from '@/app/route-navigation-panel';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { Select } from '@/components/ui/select';
import { SplitPanelLayout } from '@/components/ui/split-panel-layout';
import { Textarea } from '@/components/ui/textarea';
import { useLibraryHydration } from '@/hooks/use-library-hydration';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useLibraryStore } from '@/stores/library-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function LibraryPage() {
  const { t } = useTranslation(['common', 'library']);
  const navigate = useNavigate();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const hydrated = useLibraryHydration();
  const palettes = useLibraryStore((state) => state.palettes);
  const favorites = useLibraryStore((state) => state.favorites);
  const recents = useLibraryStore((state) => state.recents);
  const exportProfiles = useLibraryStore((state) => state.exportProfiles);
  const projects = useLibraryStore((state) => state.projects);
  const assets = useLibraryStore((state) => state.assets);
  const tags = useLibraryStore((state) => state.tags);
  const search = useLibraryStore((state) => state.search);
  const setSearch = useLibraryStore((state) => state.setSearch);
  const createProject = useLibraryStore((state) => state.createProject);
  const updateProject = useLibraryStore((state) => state.updateProject);
  const saveTag = useLibraryStore((state) => state.saveTag);
  const deleteTag = useLibraryStore((state) => state.deleteTag);
  const assignPaletteToProject = useLibraryStore((state) => state.assignPaletteToProject);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const remember = useLibraryStore((state) => state.remember);
  const setCurrentPalette = useWorkspaceStore((state) => state.setCurrentPalette);

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDraft, setProjectDraft] = useState({ name: '', description: '', notes: '' });
  const [projectDraftState, setProjectDraftState] = useState<'clean' | 'dirty' | 'saving' | 'saved' | 'error'>('clean');

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId('');
      return;
    }

    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]!.id);
    }
  }, [projects, selectedProjectId]);

  const query = search.trim().toLowerCase();
  const visiblePalettes = useMemo(() => {
    return palettes.filter((palette) => {
      if (!query) {
        return true;
      }

      return [palette.name, palette.notes, ...palette.tags].join(' ').toLowerCase().includes(query);
    });
  }, [palettes, query]);

  const matchingProjects = useMemo(() => {
    if (!query) {
      return [];
    }

    return projects.filter((project) =>
      [project.name, project.description ?? '', project.notes ?? ''].join(' ').toLowerCase().includes(query),
    );
  }, [projects, query]);

  const matchingFavorites = useMemo(() => {
    if (!query) {
      return [];
    }

    return favorites.filter((favorite) => [favorite.name ?? '', favorite.kind, favorite.targetId].join(' ').toLowerCase().includes(query));
  }, [favorites, query]);

  const matchingRecents = useMemo(() => {
    if (!query) {
      return [];
    }

    return recents.filter((entry) => [entry.label, entry.type, entry.route ?? ''].join(' ').toLowerCase().includes(query));
  }, [query, recents]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );
  const projectDraftDirty =
    !!selectedProject &&
    (projectDraft.name !== selectedProject.name ||
      projectDraft.description !== (selectedProject.description ?? '') ||
      projectDraft.notes !== (selectedProject.notes ?? ''));

  useEffect(() => {
    if (!selectedProject) {
      setProjectDraft({ name: '', description: '', notes: '' });
      setProjectDraftState('clean');
      return;
    }

    setProjectDraft({
      name: selectedProject.name,
      description: selectedProject.description ?? '',
      notes: selectedProject.notes ?? '',
    });
    setProjectDraftState('clean');
  }, [selectedProject?.id]);

  useEffect(() => {
    if (!selectedProject || !projectDraftDirty) {
      return;
    }

    setProjectDraftState('dirty');
    const timer = window.setTimeout(async () => {
      setProjectDraftState('saving');
      try {
        await updateProject(selectedProject.id, {
          name: projectDraft.name.trim() || selectedProject.name,
          description: projectDraft.description,
          notes: projectDraft.notes,
        });
        setProjectDraftState('saved');
      } catch {
        setProjectDraftState('error');
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [projectDraft.description, projectDraft.name, projectDraft.notes, projectDraftDirty, selectedProject, updateProject]);

  const commitProjectDraft = async () => {
    if (!selectedProject || !projectDraftDirty) {
      return;
    }

    setProjectDraftState('saving');
    try {
      await updateProject(selectedProject.id, {
        name: projectDraft.name.trim() || selectedProject.name,
        description: projectDraft.description,
        notes: projectDraft.notes,
      });
      setProjectDraftState('saved');
    } catch {
      setProjectDraftState('error');
    }
  };

  const selectedProjectAssets = useMemo(
    () => assets.filter((asset) => asset.projectId === selectedProject?.id),
    [assets, selectedProject?.id],
  );

  const selectedProjectPalettes = useMemo(
    () => palettes.filter((palette) => palette.projectId === selectedProject?.id),
    [palettes, selectedProject?.id],
  );

  return (
    <SplitPanelLayout
      left={
        <>
          <RouteNavigationPanel canInstall={canInstall} isInstalled={isInstalled} onInstall={() => void install()} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:searchTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SearchFilterBar value={search} onChange={setSearch} placeholder={t('library:searchPlaceholder')} />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-muted/35 p-3 text-sm">
                  <div className="section-label">{t('library:savedPalettes')}</div>
                  <div className="mt-1 font-medium text-foreground">{palettes.length}</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/35 p-3 text-sm">
                  <div className="section-label">{t('library:projectsTitle')}</div>
                  <div className="mt-1 font-medium text-foreground">{projects.length}</div>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={() => navigate('/exports')}>
                {t('common:exports')}
              </Button>
            </CardContent>
          </Card>
        </>
      }
      center={
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:projectWorkspace')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <div className="section-label">{t('library:createProject')}</div>
                  <p className="text-sm text-foreground/65">{t('library:createProjectHint')}</p>
                  <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder={t('library:projectName')} />
                  <Input
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                    placeholder={t('library:projectDescription')}
                  />
                  <Textarea value={projectNotes} onChange={(event) => setProjectNotes(event.target.value)} placeholder={t('library:projectNotes')} />
                  <div className="space-y-2">
                    <div className="section-label">{t('library:projectTags')}</div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            className={`rounded-full border px-2.5 py-1 text-xs transition ${
                              active ? 'border-foreground bg-foreground text-background' : 'border-border bg-panel text-foreground/70'
                            }`}
                            onClick={() =>
                              setSelectedTagIds((current) =>
                                current.includes(tag.id) ? current.filter((entry) => entry !== tag.id) : [...current, tag.id],
                              )
                            }
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      if (!projectName.trim()) {
                        return;
                      }

                      const project = await createProject(projectName.trim(), projectDescription.trim(), selectedTagIds, projectNotes.trim());
                      setProjectName('');
                      setProjectDescription('');
                      setProjectNotes('');
                      setSelectedTagIds([]);
                      setSelectedProjectId(project.id);
                      await remember('project', project.id, project.name, '/library');
                    }}
                  >
                    {t('library:createProject')}
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/80 bg-panel p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="section-label">{t('library:projectFocus')}</div>
                      <p className="mt-1 text-sm text-foreground/65">{t('library:projectWorkspaceHint')}</p>
                    </div>
                    <Select value={selectedProject?.id ?? ''} onChange={(event) => setSelectedProjectId(event.target.value)}>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {selectedProject ? (
                    <div className="grid gap-3">
                      <Input
                        value={projectDraft.name}
                        onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))}
                        onBlur={() => void commitProjectDraft()}
                        placeholder={t('library:projectName')}
                      />
                      <Input
                        value={projectDraft.description}
                        onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))}
                        onBlur={() => void commitProjectDraft()}
                        placeholder={t('library:projectDescription')}
                      />
                      <Textarea
                        className="min-h-[108px]"
                        value={projectDraft.notes}
                        onChange={(event) => setProjectDraft((current) => ({ ...current, notes: event.target.value }))}
                        onBlur={() => void commitProjectDraft()}
                        placeholder={t('library:projectNotes')}
                      />
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              className="rounded-full border border-border bg-panel px-2.5 py-1 text-xs text-foreground/75 transition hover:bg-muted"
                              onClick={() => void deleteTag(tag.id)}
                            >
                              {tag.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input value={newTagLabel} onChange={(event) => setNewTagLabel(event.target.value)} placeholder={t('library:newTagPlaceholder')} />
                          <Button
                            variant="outline"
                            onClick={async () => {
                              if (!newTagLabel.trim()) {
                                return;
                              }

                              await saveTag(newTagLabel.trim());
                              setNewTagLabel('');
                            }}
                          >
                            {t('library:addTag')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
                      {t('library:noProjectSelected')}
                    </div>
                  )}
                </div>
              </div>

              {query ? (
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <div className="section-label">{t('library:quickActions')}</div>
                  <div className="mt-3 grid gap-4 xl:grid-cols-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{t('library:savedPalettes')}</div>
                      <div className="mt-2 space-y-2">
                        {visiblePalettes.slice(0, 3).map((palette) => (
                          <button
                            key={palette.id}
                            type="button"
                            className="w-full rounded-xl border border-border/80 bg-panel px-3 py-2 text-left text-sm text-foreground/75 transition hover:border-foreground/35"
                            onClick={() => {
                              setCurrentPalette(palette);
                              navigate('/workspace');
                            }}
                          >
                            {palette.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t('library:projectsTitle')}</div>
                      <div className="mt-2 space-y-2">
                        {matchingProjects.slice(0, 3).map((project) => (
                          <button
                            key={project.id}
                            type="button"
                            className="w-full rounded-xl border border-border/80 bg-panel px-3 py-2 text-left text-sm text-foreground/75 transition hover:border-foreground/35"
                            onClick={() => setSelectedProjectId(project.id)}
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t('library:recentHistory')}</div>
                      <div className="mt-2 space-y-2">
                        {[...matchingFavorites, ...matchingRecents].slice(0, 3).map((entry) => (
                          <div key={entry.id} className="rounded-xl border border-border/80 bg-panel px-3 py-2 text-sm text-foreground/75">
                            {'label' in entry ? entry.label : entry.name ?? entry.targetId}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:savedPalettes')}</CardTitle>
              <p className="mt-1 text-sm text-foreground/65">{t('library:savedPalettesHint')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hydrated ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-foreground/60">
                  {t('common:loadingWorkspace')}
                </div>
              ) : visiblePalettes.length ? (
                visiblePalettes.map((palette) => {
                  const paletteProject = projects.find((project) => project.id === palette.projectId);
                  return (
                    <div key={palette.id} className="rounded-2xl border border-border/80 bg-panel p-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{palette.name}</div>
                          <div className="text-sm text-foreground/65">{palette.notes || palette.tags.join(', ') || t('common:none')}</div>
                          <div className="text-xs uppercase tracking-[0.16em] text-foreground/45">
                            {paletteProject?.name || t('library:unassigned')}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              setCurrentPalette(palette);
                              await remember('palette', palette.id, palette.name, '/workspace');
                              navigate('/workspace');
                            }}
                          >
                            {t('library:openPalette')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/exports', { state: { scope: 'palette', paletteId: palette.id, from: 'library' } })}
                          >
                            {t('common:exports')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void toggleFavorite('palette', palette.id, palette.name)}>
                            <Star className="mr-2 h-3.5 w-3.5" />
                            {t('library:favoritePalette')}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_240px]">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {palette.colors.slice(0, 6).map((color) => (
                            <ColorSwatchButton key={color.id} color={color} compact />
                          ))}
                        </div>
                        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/30 p-3">
                          <div className="section-label">{t('library:projectAssignment')}</div>
                          <Select
                            value={palette.projectId ?? ''}
                            onChange={(event) => void assignPaletteToProject(palette.id, event.target.value || undefined)}
                          >
                            <option value="">{t('library:unassigned')}</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </Select>
                          <div className="text-xs text-foreground/55">
                            {t('library:currentProject')}: {paletteProject?.name ?? t('common:none')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-foreground/60">
                  {t('library:noPalettes')}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      }
      right={
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:projectFocus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedProject ? (
                <>
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                    <div className="font-medium text-foreground">{selectedProject.name}</div>
                    <div className="mt-1 text-sm text-foreground/65">{selectedProject.description || t('common:none')}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-foreground/60">
                    <div>
                      {t('library:assetCount')}: {selectedProjectAssets.length}
                    </div>
                    <div>
                      {t('common:palette')}: {selectedProjectPalettes.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/25 p-3 text-xs text-foreground/60">
                    {projectDraftState === 'saving'
                      ? t('library:draftSaving')
                      : projectDraftState === 'saved'
                        ? t('library:draftSaved')
                        : projectDraftState === 'error'
                          ? t('library:draftSaveFailed')
                          : projectDraftState === 'dirty'
                            ? t('library:draftUnsaved')
                            : t('common:none')}
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
                    <div className="section-label">{t('library:linkedPalettes')}</div>
                    {selectedProjectPalettes.length ? (
                      <div className="mt-2 space-y-2">
                        {selectedProjectPalettes.map((palette) => (
                          <button
                            key={palette.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-panel px-3 py-2 text-sm transition hover:border-foreground/35"
                            onClick={() => {
                              setCurrentPalette(palette);
                              navigate('/workspace');
                            }}
                          >
                            <span>{palette.name}</span>
                            <ArrowRight className="h-4 w-4 text-foreground/45" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-foreground/60">{t('library:noPalettes')}</div>
                    )}
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/exports', { state: { scope: 'project', projectId: selectedProject.id, from: 'library' } })}>
                    {t('common:exports')}
                  </Button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
                  {t('library:noProjectSelected')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:favoritesTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {favorites.length ? (
                favorites.map((favorite) => (
                  <div key={favorite.id} className="rounded-xl border border-border/80 bg-muted/35 p-3">
                    <div className="text-sm font-medium text-foreground">{favorite.name ?? favorite.targetId}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-foreground/45">{favorite.kind}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
                  {t('library:noFavorites')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:recentHistory')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recents.length ? (
                recents.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border/80 bg-muted/35 p-3">
                    <div className="text-sm text-foreground">{entry.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-foreground/45">{entry.type}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
                  {t('library:noRecents')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:exportProfiles')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exportProfiles.length ? (
                exportProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className="w-full rounded-xl border border-border/80 bg-muted/35 p-3 text-left text-sm transition hover:border-foreground/35"
                    onClick={() => navigate('/exports')}
                  >
                    <div className="font-medium text-foreground">{profile.name}</div>
                    <div className="mt-1 text-foreground/65">
                      {profile.scope} / {profile.format} / {profile.language}
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
                  {t('library:noExportProfiles')}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      }
    />
  );
}
