import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { Select } from '@/components/ui/select';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { deriveScientificTemplateMeta, rankTemplateCatalog, type ScientificTemplateLabelKey } from '@/domain/templates/scientific-guidance';
import { filterTemplateCatalog, templateToPalette } from '@/domain/templates/query-service';
import type { Palette, TemplateDescriptor } from '@/domain/models';
import { useTemplateStore } from '@/stores/template-store';

interface TemplateLibraryPanelProps {
  currentPalette: Palette;
  onApplyTemplate: (templateId: string) => void;
}

function contrastDirection(template: TemplateDescriptor, labels: ScientificTemplateLabelKey[]) {
  if (labels.includes('highContrast')) {
    return 'high-contrast';
  }

  if (template.tone === 'Editorial Minimal' || template.tone === 'Scientific Neutral') {
    return 'restrained';
  }

  return 'balanced';
}

function rationaleKey(template: TemplateDescriptor, labels: ScientificTemplateLabelKey[]) {
  if (labels.includes('thinLineSafe')) {
    return 'thinLineSafe';
  }

  if (labels.includes('denseScatterSafe')) {
    return 'denseScatterSafe';
  }

  if (labels.includes('darkBgHeatmap')) {
    return 'darkBgHeatmap';
  }

  if (template.paletteClass === 'sequential') {
    return 'orderedRamp';
  }

  if (template.paletteClass === 'diverging') {
    return 'structuredMidpoint';
  }

  if (template.paletteClass === 'concept') {
    return 'conceptScaffold';
  }

  return 'general';
}

export function TemplateLibraryPanel({ currentPalette, onApplyTemplate }: TemplateLibraryPanelProps) {
  const { t } = useTranslation(['common', 'workspace', 'templates']);
  const query = useTemplateStore((state) => state.query);
  const setQuery = useTemplateStore((state) => state.setQuery);
  const filters = useTemplateStore((state) => state.filters);
  const setFilter = useTemplateStore((state) => state.setFilter);
  const templates = useTemplateStore((state) => state.templates);
  const recentTemplateIds = useTemplateStore((state) => state.recentTemplateIds);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const visibleTemplates = useMemo(() => {
    const ranked = rankTemplateCatalog(filterTemplateCatalog(templates, query, filters));
    return ranked.sort((left, right) => {
      const leftIndex = recentTemplateIds.indexOf(left.id);
      const rightIndex = recentTemplateIds.indexOf(right.id);
      if (leftIndex === -1 && rightIndex === -1) {
        return 0;
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });
  }, [filters, query, recentTemplateIds, templates]);

  useEffect(() => {
    if (!visibleTemplates.length) {
      setPreviewTemplateId(null);
      return;
    }

    if (!previewTemplateId || !visibleTemplates.some((template) => template.id === previewTemplateId)) {
      setPreviewTemplateId(visibleTemplates[0]!.id);
    }
  }, [previewTemplateId, visibleTemplates]);

  const previewTemplate = visibleTemplates.find((template) => template.id === previewTemplateId) ?? visibleTemplates[0] ?? null;
  const previewPalette = previewTemplate ? templateToPalette(previewTemplate) : null;
  const previewMeta = previewTemplate ? deriveScientificTemplateMeta(previewTemplate) : null;

  const chartTypeLabel = (value: TemplateDescriptor['chartType']) => t(`templates:chartType.${value}`);
  const structureLabel = (value: TemplateDescriptor['structure']) => t(`templates:structure.${value}`);
  const usageLabel = (value: TemplateDescriptor['academicUsage']) => t(`templates:usage.${value}`);
  const toneLabel = (value: TemplateDescriptor['tone']) => t(`templates:tone.${value}`);
  const backgroundLabel = (value: TemplateDescriptor['backgroundMode']) => t(`templates:background.${value}`);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t('workspace:templateLibrary')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))]">
          <SearchFilterBar value={query} onChange={setQuery} placeholder={t('templates:searchPlaceholder')} />
          <Select value={filters.chartType ?? 'all'} onChange={(event) => setFilter('chartType', event.target.value as typeof filters.chartType)}>
            <option value="all">{t('templates:allChartTypes')}</option>
            <option value="line-plot">{chartTypeLabel('line-plot')}</option>
            <option value="scatter-plot">{chartTypeLabel('scatter-plot')}</option>
            <option value="bar-chart">{chartTypeLabel('bar-chart')}</option>
            <option value="heatmap">{chartTypeLabel('heatmap')}</option>
            <option value="concept-figure">{chartTypeLabel('concept-figure')}</option>
            <option value="presentation-slide">{chartTypeLabel('presentation-slide')}</option>
          </Select>
          <Select value={filters.structure ?? 'all'} onChange={(event) => setFilter('structure', event.target.value as typeof filters.structure)}>
            <option value="all">{t('templates:allStructures')}</option>
            <option value="monochromatic">{structureLabel('monochromatic')}</option>
            <option value="cool-warm-balanced">{structureLabel('cool-warm-balanced')}</option>
            <option value="high-contrast-categorical">{structureLabel('high-contrast-categorical')}</option>
            <option value="low-saturation-editorial">{structureLabel('low-saturation-editorial')}</option>
            <option value="sequential-gradient">{structureLabel('sequential-gradient')}</option>
            <option value="diverging-gradient">{structureLabel('diverging-gradient')}</option>
            <option value="cyclic-gradient">{structureLabel('cyclic-gradient')}</option>
          </Select>
          <Select value={filters.backgroundMode ?? 'all'} onChange={(event) => setFilter('backgroundMode', event.target.value as typeof filters.backgroundMode)}>
            <option value="all">{t('templates:allBackgrounds')}</option>
            <option value="light">{backgroundLabel('light')}</option>
            <option value="dark">{backgroundLabel('dark')}</option>
          </Select>
          <Select value={String(filters.size ?? 'all')} onChange={(event) => setFilter('size', event.target.value === 'all' ? 'all' : Number(event.target.value))}>
            <option value="all">{t('templates:allSizes')}</option>
            <option value="5">{t('templates:size.5')}</option>
            <option value="7">{t('templates:size.7')}</option>
            <option value="9">{t('templates:size.9')}</option>
          </Select>
          <Select value={filters.tone ?? 'all'} onChange={(event) => setFilter('tone', event.target.value as typeof filters.tone)}>
            <option value="all">{t('templates:allTones')}</option>
            <option value="Editorial Minimal">{toneLabel('Editorial Minimal')}</option>
            <option value="Nature-like">{toneLabel('Nature-like')}</option>
            <option value="Publication Clean">{toneLabel('Publication Clean')}</option>
            <option value="Scientific Neutral">{toneLabel('Scientific Neutral')}</option>
            <option value="Presentation Strong">{toneLabel('Presentation Strong')}</option>
          </Select>
          <Select value={filters.academicUsage ?? 'all'} onChange={(event) => setFilter('academicUsage', event.target.value as typeof filters.academicUsage)}>
            <option value="all">{t('templates:allAcademicUses')}</option>
            <option value="manuscript">{usageLabel('manuscript')}</option>
            <option value="lab meeting">{usageLabel('lab meeting')}</option>
            <option value="poster">{usageLabel('poster')}</option>
            <option value="course slides">{usageLabel('course slides')}</option>
            <option value="online document">{usageLabel('online document')}</option>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/25 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-foreground">{t('workspace:scientificGuidance')}</div>
            <p className="mt-1 text-sm text-foreground/65">{t('workspace:scientificGuidanceBody')}</p>
          </div>
          <div className="text-sm text-foreground/55">
            {visibleTemplates.length} {t('templates:results')}
          </div>
        </div>

        {previewTemplate && previewPalette && previewMeta ? (
          <div className="rounded-3xl border border-border/80 bg-panel p-5 shadow-panel">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="section-label">{t('workspace:templatePreview')}</div>
                <div>
                  <div className="font-editorial text-2xl tracking-tight text-foreground">{previewTemplate.name}</div>
                  <p className="mt-2 max-w-3xl text-sm text-foreground/68">{previewTemplate.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-foreground/60">
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{chartTypeLabel(previewTemplate.chartType)}</span>
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{structureLabel(previewTemplate.structure)}</span>
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{usageLabel(previewTemplate.academicUsage)}</span>
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{backgroundLabel(previewTemplate.backgroundMode)}</span>
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{toneLabel(previewTemplate.tone)}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                    <div className="section-label">{t('templates:contrastDirectionLabel')}</div>
                    <div className="mt-2 text-sm text-foreground/72">{t(`templates:contrast.${contrastDirection(previewTemplate, previewMeta.labels)}`)}</div>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                    <div className="section-label">{t('workspace:templateWhyWorks')}</div>
                    <div className="mt-2 text-sm text-foreground/72">{t(`templates:why.${rationaleKey(previewTemplate, previewMeta.labels)}`)}</div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplateId(previewTemplate.id)}>
                  {t('common:preview')}
                </Button>
                <Button onClick={() => onApplyTemplate(previewTemplate.id)}>{t('common:apply')}</Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                <div className="section-label">{t('workspace:currentPalette')}</div>
                <div className="mt-2 font-medium text-foreground">{currentPalette.name}</div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {currentPalette.colors.slice(0, 5).map((color) => (
                    <ColorSwatchButton key={color.id} color={color} compact />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                <div className="section-label">{t('common:candidate')}</div>
                <div className="mt-2 font-medium text-foreground">{previewPalette.name}</div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {previewPalette.colors.slice(0, 5).map((color) => (
                    <ColorSwatchButton key={color.id} color={color} compact />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {previewMeta.labels.map((label) => (
                <span key={label} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                  {t(`templates:labels.${label}`)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 2xl:grid-cols-2">
          {visibleTemplates.map((template) => {
            const palette = templateToPalette(template);
            const scientificMeta = deriveScientificTemplateMeta(template);
            const previewed = previewTemplate?.id === template.id;

            return (
              <div
                key={template.id}
                className={`rounded-2xl border p-4 transition ${
                  previewed ? 'border-foreground bg-panel shadow-panel' : 'border-border/80 bg-panel hover:border-foreground/35'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{template.name}</div>
                    <p className="mt-1 text-sm text-foreground/65">{template.description}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs uppercase tracking-[0.16em] text-foreground/45">
                    {recentTemplateIds.includes(template.id) ? t('workspace:recentlyUsedTemplate') : t('workspace:readyToApply')}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2">
                  {palette.colors.slice(0, 5).map((color) => (
                    <ColorSwatchButton key={color.id} color={color} compact />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/55">
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{chartTypeLabel(template.chartType)}</span>
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{usageLabel(template.academicUsage)}</span>
                  <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{t(`templates:contrast.${contrastDirection(template, scientificMeta.labels)}`)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {scientificMeta.labels.map((label) => (
                    <span key={label} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {t(`templates:labels.${label}`)}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm text-foreground/68">{t(`templates:why.${rationaleKey(template, scientificMeta.labels)}`)}</p>

                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => setPreviewTemplateId(template.id)}>
                    {t('common:preview')}
                  </Button>
                  <Button className="flex-1" onClick={() => onApplyTemplate(template.id)}>
                    {t('common:apply')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
