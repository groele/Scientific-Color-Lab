import { ClipboardPaste, ImagePlus, Layers3, RotateCcw, SlidersHorizontal, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useColorActions } from '@/hooks/use-color-actions';
import type {
  AnalyzerClusterLayer,
  AnalyzerDetailLevel,
  AnalyzerOptions,
  ColorToken,
  ImageAnalysisStats,
  ImageCluster,
  Palette,
} from '@/domain/models';
import { cn, formatPercent } from '@/lib/utils';

function suitabilityLabel(cluster: ImageCluster, t: (key: string) => string) {
  const assessment = cluster.assessment;
  if (!assessment) {
    return t('analyzer:suitabilityLabels.needsReconstruction');
  }

  const labels = [];
  if (assessment.categorical) labels.push(t('analyzer:suitabilityLabels.categorical'));
  if (assessment.gradientEndpoint) labels.push(t('analyzer:suitabilityLabels.endpoint'));
  if (assessment.background) labels.push(t('analyzer:suitabilityLabels.background'));
  if (assessment.text) labels.push(t('analyzer:suitabilityLabels.text'));
  if (assessment.accent) labels.push(t('analyzer:suitabilityLabels.accent'));
  return labels.length ? labels.join(', ') : t('analyzer:suitabilityLabels.needsReconstruction');
}

interface ImageDropzoneProps {
  onFile: (file: File) => void;
  onSample: () => void;
  onReset?: () => void;
  hasImage?: boolean;
}

export function ImageDropzone({ onFile, onSample, onReset, hasImage = false }: ImageDropzoneProps) {
  const { t } = useTranslation(['analyzer']);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t('analyzer:importTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-4 py-10 text-center transition-colors hover:bg-muted"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) {
              onFile(file);
            }
          }}
        >
          <Upload className="h-6 w-6 text-foreground/55" />
          <div>
            <div className="font-medium text-foreground">{hasImage ? t('analyzer:changeImage') : t('analyzer:importBody')}</div>
            <div className="text-sm text-foreground/60">{t('analyzer:startWithImageBody')}</div>
          </div>
          <input
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onFile(file);
              }
            }}
          />
        </label>
        <div className="grid gap-2 md:grid-cols-3">
          <Button variant="outline" onClick={onSample}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {t('analyzer:sample')}
          </Button>
          <div className="rounded-xl border border-border/80 bg-muted/60 px-3 py-2 text-sm text-foreground/65">
            <ClipboardPaste className="mr-2 inline h-4 w-4" />
            {t('analyzer:pasteHint')}
          </div>
          <Button variant="ghost" onClick={onReset} disabled={!hasImage || !onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('analyzer:reset')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyzerControlsCardProps {
  options: AnalyzerOptions;
  clusterLayer: AnalyzerClusterLayer;
  stats?: ImageAnalysisStats | null;
  onOptionsChange: (options: Partial<AnalyzerOptions>) => void;
  onLayerChange: (layer: AnalyzerClusterLayer) => void;
}

export function AnalyzerControlsCard({
  options,
  clusterLayer,
  stats,
  onOptionsChange,
  onLayerChange,
}: AnalyzerControlsCardProps) {
  const { t } = useTranslation(['analyzer']);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-foreground/55" />
          <CardTitle>{t('analyzer:controlsTitle')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="section-label">{t('analyzer:extractionMode')}</span>
            <Select
              value={options.detailLevel}
              onChange={(event) => onOptionsChange({ detailLevel: event.target.value as AnalyzerDetailLevel })}
            >
              <option value="compact">Compact</option>
              <option value="balanced">Balanced</option>
              <option value="complete">Complete</option>
            </Select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="section-label">{t('analyzer:maxColors')}</span>
            <Select
              value={String(options.maxColors)}
              onChange={(event) =>
                onOptionsChange({ maxColors: Number(event.target.value) as AnalyzerOptions['maxColors'] })
              }
            >
              {[8, 12, 16, 24].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="section-label">{t('analyzer:view')}</span>
            <Select value={clusterLayer} onChange={(event) => onLayerChange(event.target.value as AnalyzerClusterLayer)}>
              <option value="summary">{t('analyzer:viewSummary')}</option>
              <option value="detail">{t('analyzer:viewDetail')}</option>
            </Select>
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/80 bg-muted/25 p-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="section-label">{t('analyzer:processedPixels')}</div>
            <div className="mt-1 font-medium text-foreground">{stats?.opaquePixels?.toLocaleString() ?? '—'}</div>
          </div>
          <div>
            <div className="section-label">{t('analyzer:histogramBins')}</div>
            <div className="mt-1 font-medium text-foreground">{stats?.histogramBins?.toLocaleString() ?? '—'}</div>
          </div>
          <div>
            <div className="section-label">{t('analyzer:detailSummary')}</div>
            <div className="mt-1 font-medium text-foreground">
              {stats ? `${stats.detailClusterCount} / ${stats.summaryClusterCount}` : '—'}
            </div>
          </div>
          <div>
            <div className="section-label">{t('analyzer:resizeScale')}</div>
            <div className="mt-1 font-medium text-foreground">{stats ? `${Math.round(stats.resizeScale * 100)}%` : '—'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ClusterTreemapProps {
  clusters: ImageCluster[];
  heading?: string;
  selectedClusterId?: string | null;
  onSelect?: (clusterId: string) => void;
}

export function ClusterTreemap({ clusters, heading, selectedClusterId, onSelect }: ClusterTreemapProps) {
  const { t } = useTranslation(['analyzer']);
  const { copyHex } = useColorActions();
  const total = clusters.reduce((sum, cluster) => sum + cluster.count, 0) || 1;

  return (
    <div className="panel-surface overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="section-label">{heading ?? t('analyzer:dominantColors')}</div>
        <div className="text-xs text-foreground/55">{clusters.length}</div>
      </div>
      <div className="mt-3 flex h-24 overflow-hidden rounded-xl">
        {clusters.map((cluster) => {
          const selected = cluster.id === selectedClusterId;
          return (
            <button
              key={cluster.id}
              type="button"
              className={cn(
                'flex items-end justify-start border-r border-white/20 px-2 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white last:border-none',
                selected ? 'ring-2 ring-inset ring-white/90' : 'opacity-85 hover:opacity-100',
              )}
              style={{ width: `${(cluster.count / total) * 100}%`, background: cluster.color.hex }}
              title={`${cluster.color.name} ${cluster.color.hex}`}
              onClick={(event) => {
                onSelect?.(cluster.id);
                void copyHex(cluster.color, event.currentTarget);
              }}
            >
              {t('analyzer:clusterShare')} {formatPercent(cluster.percentage)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ClusterTableProps {
  clusters: ImageCluster[];
  heading?: string;
  selectedClusterId?: string | null;
  onSelect?: (clusterId: string) => void;
}

export function ClusterTable({ clusters, heading, selectedClusterId, onSelect }: ClusterTableProps) {
  const { t } = useTranslation(['analyzer']);

  return (
    <div className="panel-surface overflow-hidden">
      <div className="border-b border-border/80 px-4 py-3">
        <div className="section-label">{heading ?? t('analyzer:dominantColors')}</div>
      </div>
      <div className="overflow-auto p-4">
        <div className="grid gap-3">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              role="button"
              tabIndex={0}
              className={cn(
                'grid gap-3 rounded-2xl border bg-panel p-3 text-left transition xl:grid-cols-[220px_120px_1fr]',
                cluster.id === selectedClusterId ? 'border-foreground shadow-panel' : 'border-border/70 hover:border-foreground/35',
              )}
              onClick={() => onSelect?.(cluster.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect?.(cluster.id);
                }
              }}
            >
              <ColorSwatchButton color={cluster.color} compact selected={cluster.id === selectedClusterId} onSelect={() => onSelect?.(cluster.id)} />
              <div className="space-y-1 text-sm text-foreground/70">
                <div className="section-label">{t('analyzer:clusterShare')}</div>
                <div>{formatPercent(cluster.percentage)}</div>
              </div>
              <div className="space-y-1 text-sm text-foreground/70">
                <div className="section-label">{t('analyzer:suitability')}</div>
                <div>{suitabilityLabel(cluster, t)}</div>
                <div className="text-xs text-foreground/55">{cluster.color.notes}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReplacementSuggestionListProps {
  palette: Palette;
  selectedColorId?: string | null;
  onSelect?: (colorId: string) => void;
}

export function ReplacementSuggestionList({ palette, selectedColorId, onSelect }: ReplacementSuggestionListProps) {
  const { t } = useTranslation(['analyzer']);

  return (
    <div className="panel-surface p-4">
      <div className="section-label">{t('analyzer:replacementSuggestions')}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {palette.colors.map((color) => (
          <div
            key={color.id}
            role="button"
            tabIndex={0}
            className={cn(
              'rounded-xl border bg-panel p-3 text-left transition',
              color.id === selectedColorId ? 'border-foreground shadow-panel' : 'border-border/80 hover:border-foreground/35',
            )}
            onClick={() => onSelect?.(color.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.(color.id);
              }
            }}
          >
            <ColorSwatchButton color={color} compact selected={color.id === selectedColorId} onSelect={() => onSelect?.(color.id)} />
            <div className="mt-3 font-medium text-foreground">{color.name}</div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/55">{color.hex}</div>
            <div className="mt-2 text-xs text-foreground/60">{color.usage.join(', ') || t('analyzer:scientificReconstructionBody')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColorSummaryCard({
  title,
  color,
  metaLabel,
  metaValue,
  secondaryMeta,
}: {
  title: string;
  color: ColorToken | null;
  metaLabel: string;
  metaValue?: string;
  secondaryMeta?: string;
}) {
  const { t } = useTranslation(['common']);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {color ? (
          <>
            <ColorSwatchButton color={color} />
            <div className="space-y-1 text-sm text-foreground/70">
              <div className="section-label">{metaLabel}</div>
              <div>{metaValue}</div>
              {secondaryMeta ? <div className="text-xs text-foreground/55">{secondaryMeta}</div> : null}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-foreground/60">
            {t('common:noSelection')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyzerStatsSummary({ stats }: { stats: ImageAnalysisStats }) {
  const { t } = useTranslation(['analyzer']);
  const mergeSaved = Math.max(stats.detailClusterCount - stats.summaryClusterCount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-foreground/55" />
          <CardTitle>{t('analyzer:extractionStats')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
          <div className="section-label">{t('analyzer:processedPixels')}</div>
          <div className="mt-1 font-medium text-foreground">{stats.opaquePixels.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
          <div className="section-label">{t('analyzer:detailLayer')}</div>
          <div className="mt-1 font-medium text-foreground">{stats.detailClusterCount}</div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
          <div className="section-label">{t('analyzer:summaryLayer')}</div>
          <div className="mt-1 font-medium text-foreground">{stats.summaryClusterCount}</div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
          <div className="section-label">{t('analyzer:mergedAway')}</div>
          <div className="mt-1 font-medium text-foreground">{mergeSaved}</div>
        </div>
      </CardContent>
    </Card>
  );
}
