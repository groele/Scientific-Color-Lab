import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
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
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useLibraryStore } from '@/stores/library-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function LibraryPage() {
  const { t } = useTranslation(['common', 'library']);
  const navigate = useNavigate();
  const { canInstall, install } = usePwaInstall();
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

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId('');
      return;
    }

    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]!.id);
    }
  }, [projects, selectedProjectId]);

  const visiblePalettes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return palettes.filter((palette) => {
      if (!query) {
        return true;
      }

      return [palette.name, palette.notes, ...palette.tags].join(' ').toLowerCase().includes(query);
    });
  }, [palettes, search]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

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
          <RouteNavigationPanel canInstall={canInstall} onInstall={() => void install()} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:searchTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchFilterBar value={search} onChange={setSearch} placeholder={t('library:searchPlaceholder')} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:createProject')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:tagManager')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
              <p className="text-xs text-foreground/55">{t('library:manageTagsHint')}</p>
            </CardContent>
          </Card>
        </>
      }
      center={
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('library:savedPalettes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visiblePalettes.length ? (
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
      }
      right={
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('library:projectWorkspace')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/65">{t('library:projectWorkspaceHint')}</p>
              <Select value={selectedProject?.id ?? ''} onChange={(event) => setSelectedProjectId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              {selectedProject ? (
                <>
                  <Input
                    value={selectedProject.name}
                    onChange={(event) => void updateProject(selectedProject.id, { name: event.target.value })}
                    placeholder={t('library:projectName')}
                  />
                  <Input
                    value={selectedProject.description ?? ''}
                    onChange={(event) => void updateProject(selectedProject.id, { description: event.target.value })}
                    placeholder={t('library:projectDescription')}
                  />
                  <Textarea
                    className="min-h-[96px]"
                    value={selectedProject.notes ?? ''}
                    onChange={(event) => void updateProject(selectedProject.id, { notes: event.target.value })}
                    placeholder={t('library:projectNotes')}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs text-foreground/60">
                    <div>
                      {t('library:assetCount')}: {selectedProjectAssets.length}
                    </div>
                    <div>
                      {t('common:palette')}: {selectedProjectPalettes.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
                    <div className="section-label">{t('library:savedPalettes')}</div>
                    {selectedProjectPalettes.length ? (
                      <div className="mt-2 space-y-2">
                        {selectedProjectPalettes.map((palette) => (
                          <div key={palette.id} className="rounded-lg border border-border/70 bg-panel px-3 py-2 text-sm">
                            {palette.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-foreground/60">{t('library:noPalettes')}</div>
                    )}
                  </div>
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
                  <div key={profile.id} className="rounded-xl border border-border/80 bg-muted/35 p-3 text-sm">
                    <div className="font-medium text-foreground">{profile.name}</div>
                    <div className="mt-1 text-foreground/65">
                      {profile.scope} / {profile.format} / {profile.language}
                    </div>
                  </div>
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
