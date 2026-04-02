import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ClipboardPaste, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RouteNavigationPanel } from '@/app/route-navigation-panel';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SplitPanelLayout } from '@/components/ui/split-panel-layout';
import {
  AnalyzerControlsCard,
  AnalyzerStatsSummary,
  ClusterTable,
  ClusterTreemap,
  ColorSummaryCard,
  ImageDropzone,
  ReplacementSuggestionList,
} from '@/components/viz/image-analysis';
import { DiagnosticsPanel } from '@/components/workspace/diagnostics-panel';
import { paletteFromColors } from '@/domain/color/palette';
import { buildPaletteDiagnostics } from '@/domain/diagnostics/engine';
import type { ColorToken, DiagnosticItem, ImageAnalysisResult, ImageCluster, Palette } from '@/domain/models';
import { useAnalyzerStore } from '@/stores/analyzer-store';
import { useLibraryStore } from '@/stores/library-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

async function rasterizeSvgSample(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error('Unable to decode the SVG sample image.'));
      node.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || 1200;
    canvas.height = image.naturalHeight || 900;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas rendering is unavailable in this browser.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
          return;
        }

        reject(new Error('Unable to convert the SVG sample image into a PNG.'));
      }, 'image/png');
    });
    return pngBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function deriveSuitabilitySummary(clusters: ImageCluster[]) {
  return {
    categorical: clusters.filter((cluster) => cluster.assessment?.categorical).length,
    text: clusters.filter((cluster) => cluster.assessment?.text).length,
    background: clusters.filter((cluster) => cluster.assessment?.background).length,
    accent: clusters.filter((cluster) => cluster.assessment?.accent).length,
  };
}

function clusterSummary(cluster: ImageCluster | null, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!cluster) {
    return null;
  }

  return t('analyzer:clusterSummary', {
    hex: cluster.color.hex,
    share: `${Math.round(cluster.percentage * 100)}%`,
    count: cluster.count,
  });
}

function clusterSuitability(cluster: ImageCluster | null, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!cluster?.assessment) {
    return t('analyzer:clusterNeedsReconstruction');
  }

  const flags = [];
  if (cluster.assessment.categorical) flags.push(t('analyzer:suitabilityLabels.categorical'));
  if (cluster.assessment.gradientEndpoint) flags.push(t('analyzer:suitabilityLabels.endpoint'));
  if (cluster.assessment.background) flags.push(t('analyzer:suitabilityLabels.background'));
  if (cluster.assessment.text) flags.push(t('analyzer:suitabilityLabels.text'));
  if (cluster.assessment.accent) flags.push(t('analyzer:suitabilityLabels.accent'));

  return flags.length ? t('analyzer:clusterSuitabilityPrefix', { labels: flags.join(', ') }) : t('analyzer:clusterNeedsReconstruction');
}

function createRawPalette(result: ImageAnalysisResult): Palette {
  return paletteFromColors(
    'Raw Image Clusters',
    'qualitative',
    result.mergedClusters.slice(0, 6).map((cluster) => cluster.color),
    'image-analysis',
  );
}

function deriveAnalyzerDiagnostics(result: ImageAnalysisResult, clusterLayer: 'summary' | 'detail') {
  const items: DiagnosticItem[] = [...result.diagnostics.items];
  if (clusterLayer === 'summary' && result.detailClusters.length - result.mergedClusters.length >= 6) {
    items.unshift({
      id: crypto.randomUUID(),
      code: 'analyzer-detail-layer-recommended',
      severity: 'info',
      category: 'analyzer',
      title: 'Detail layer recommended',
      message: 'The detail layer preserves substantially more colors than the summary layer.',
      suggestion: 'Inspect the detail layer if you need secondary accents, annotations, or long-tail colors.',
    });
  }

  return buildPaletteDiagnostics(result.diagnostics.score, items);
}

export function AnalyzerPage() {
  const { t } = useTranslation(['common', 'analyzer']);
  const navigate = useNavigate();
  const previewUrl = useAnalyzerStore((state) => state.previewUrl);
  const result = useAnalyzerStore((state) => state.result);
  const isAnalyzing = useAnalyzerStore((state) => state.isAnalyzing);
  const analysisStatus = useAnalyzerStore((state) => state.analysisStatus);
  const notice = useAnalyzerStore((state) => state.notice);
  const error = useAnalyzerStore((state) => state.error);
  const errorCode = useAnalyzerStore((state) => state.errorCode);
  const options = useAnalyzerStore((state) => state.options);
  const clusterLayer = useAnalyzerStore((state) => state.clusterLayer);
  const selectedClusterId = useAnalyzerStore((state) => state.selectedClusterId);
  const selectedSuggestedColorId = useAnalyzerStore((state) => state.selectedSuggestedColorId);
  const analyzeFile = useAnalyzerStore((state) => state.analyzeFile);
  const analyzeBlob = useAnalyzerStore((state) => state.analyzeBlob);
  const setOptions = useAnalyzerStore((state) => state.setOptions);
  const setClusterLayer = useAnalyzerStore((state) => state.setClusterLayer);
  const selectCluster = useAnalyzerStore((state) => state.selectCluster);
  const selectSuggestedColor = useAnalyzerStore((state) => state.selectSuggestedColor);
  const setError = useAnalyzerStore((state) => state.setError);
  const clear = useAnalyzerStore((state) => state.clear);
  const setCurrentPalette = useWorkspaceStore((state) => state.setCurrentPalette);
  const remember = useLibraryStore((state) => state.remember);

  const [paletteMode, setPaletteMode] = useState<'raw' | 'scientific'>('scientific');

  const activeClusters = clusterLayer === 'detail' ? result?.detailClusters ?? [] : result?.mergedClusters ?? [];
  const selectedCluster = activeClusters.find((cluster) => cluster.id === selectedClusterId) ?? activeClusters[0] ?? null;
  const selectedSuggestedColor =
    result?.suggestedPalette.colors.find((color) => color.id === selectedSuggestedColorId) ?? result?.suggestedPalette.colors[0] ?? null;
  const inspectorColor: ColorToken | null = selectedSuggestedColorId ? selectedSuggestedColor : selectedCluster?.color ?? selectedSuggestedColor;
  const inspectorMetaLabel = selectedSuggestedColorId
    ? t('analyzer:suitability')
    : clusterLayer === 'detail'
      ? t('analyzer:detailLayerSummary')
      : t('analyzer:analysisSummary');
  const inspectorMetaValue = selectedSuggestedColorId
    ? selectedSuggestedColor?.usage.join(', ') || t('analyzer:scientificReconstructionBody')
    : clusterSummary(selectedCluster, t) ?? undefined;
  const inspectorSecondary = selectedSuggestedColorId ? selectedSuggestedColor?.notes : clusterSuitability(selectedCluster, t);
  const suitabilitySummary = result ? deriveSuitabilitySummary(result.mergedClusters) : null;
  const rawPalette = useMemo(() => (result ? createRawPalette(result) : null), [result]);
  const activePalette = paletteMode === 'raw' && rawPalette ? rawPalette : result?.suggestedPalette ?? null;
  const analyzerDiagnostics = useMemo(() => (result ? deriveAnalyzerDiagnostics(result, clusterLayer) : null), [clusterLayer, result]);
  const layerHeading = clusterLayer === 'detail' ? t('analyzer:detailLayer') : t('analyzer:summaryLayer');
  const resolvedError =
    errorCode === 'decode-failure'
      ? t('analyzer:workerDecodeFailure')
      : errorCode === 'canvas-unavailable'
        ? t('analyzer:workerCanvasFailure')
        : errorCode === 'worker-failure'
          ? t('analyzer:workerFailure')
          : error;
  const noticeMessage =
    notice === 'queued' ? t('analyzer:statusQueued') : notice === 'updated' ? t('analyzer:statusUpdated') : null;

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith('image/'));
      const blob = item?.getAsFile();
      if (blob) {
        void analyzeBlob(blob);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [analyzeBlob]);

  useEffect(() => {
    setPaletteMode('scientific');
  }, [result?.imageId]);

  const handleSampleLoad = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}examples/lab-spectrum.svg`);
      if (!response.ok) {
        throw new Error('Unable to fetch the bundled example image.');
      }

      const svgBlob = await response.blob();
      const pngBlob = await rasterizeSvgSample(svgBlob);
      await analyzeBlob(pngBlob, 'lab-spectrum.png');
    } catch (sampleError) {
      setError(sampleError instanceof Error ? sampleError.message : 'Unable to load the bundled example image.');
    }
  };

  return (
    <SplitPanelLayout
      left={<RouteNavigationPanel />}
      center={
        <>
          <ImageDropzone
            hasImage={Boolean(previewUrl || result)}
            onReset={clear}
            onFile={(file) => void analyzeFile(file)}
            onSample={() => void handleSampleLoad()}
          />

          <AnalyzerControlsCard
            options={options}
            clusterLayer={clusterLayer}
            stats={result?.stats ?? null}
            onOptionsChange={(nextOptions) => void setOptions(nextOptions)}
            onLayerChange={(layer) => setClusterLayer(layer)}
          />

          {!result && !isAnalyzing && !error ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('analyzer:startWithImage')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border/80 bg-muted/35 p-4 text-sm text-foreground/70">
                  {t('analyzer:startWithImageBody')}
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/35 p-4 text-sm text-foreground/70">
                  <ClipboardPaste className="mr-2 inline h-4 w-4" />
                  {t('analyzer:browserPasteHint')}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isAnalyzing ? (
            <div className="rounded-2xl border border-border/80 bg-panel p-4 text-sm text-foreground/70">{t('analyzer:analyzing')}</div>
          ) : null}

          {analysisStatus === 'updated' && noticeMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{noticeMessage}</div>
          ) : null}

          {analysisStatus === 'analyzing' && noticeMessage ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{noticeMessage}</div>
          ) : null}

          {resolvedError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle className="mr-2 inline h-4 w-4" />
              {resolvedError}
            </div>
          ) : null}

          {previewUrl ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('analyzer:sourceImage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={previewUrl} alt="Analyzer source" className="max-h-[420px] w-full rounded-2xl object-contain" />
              </CardContent>
            </Card>
          ) : null}

          {result ? (
            <>
              <AnalyzerStatsSummary stats={result.stats} />
              <ClusterTreemap
                heading={layerHeading}
                clusters={activeClusters}
                selectedClusterId={selectedCluster?.id ?? null}
                onSelect={(clusterId) => selectCluster(clusterId)}
              />
              {suitabilitySummary ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>{t('analyzer:analysisSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
                      {t('analyzer:categoricalSafe')}: {suitabilitySummary.categorical}
                    </div>
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
                      {t('analyzer:textSafe')}: {suitabilitySummary.text}
                    </div>
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
                      {t('analyzer:backgroundSafe')}: {suitabilitySummary.background}
                    </div>
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">
                      {t('analyzer:accentSafe')}: {suitabilitySummary.accent}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              <ClusterTable
                heading={layerHeading}
                clusters={activeClusters}
                selectedClusterId={selectedCluster?.id ?? null}
                onSelect={(clusterId) => selectCluster(clusterId)}
              />
              <ReplacementSuggestionList
                palette={result.suggestedPalette}
                selectedColorId={selectedSuggestedColor?.id ?? null}
                onSelect={(colorId) => selectSuggestedColor(colorId)}
              />
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <CardTitle>{t('analyzer:resultPalette')}</CardTitle>
                      <p className="mt-1 text-sm text-foreground/65">
                        {paletteMode === 'raw' ? t('analyzer:rawExtractionBody') : t('analyzer:scientificReconstructionBody')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant={paletteMode === 'raw' ? 'outline' : 'ghost'} onClick={() => setPaletteMode('raw')}>
                        {t('analyzer:rawExtraction')}
                      </Button>
                      <Button variant={paletteMode === 'scientific' ? 'outline' : 'ghost'} onClick={() => setPaletteMode('scientific')}>
                        {t('analyzer:scientificReconstruction')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {(activePalette?.colors ?? []).map((color) => (
                      <ColorSwatchButton
                        key={color.id}
                        color={color}
                        selected={paletteMode === 'scientific' ? color.id === selectedSuggestedColor?.id : color.id === selectedCluster?.color.id}
                        onSelect={() => {
                          if (!result) {
                            return;
                          }

                          if (paletteMode === 'scientific') {
                            selectSuggestedColor(color.id);
                            return;
                          }

                          const clusterId = result.mergedClusters.find((cluster) => cluster.color.id === color.id)?.id ?? null;
                          setClusterLayer('summary');
                          selectCluster(clusterId);
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      }
      right={
        <>
          <ColorSummaryCard
            title={selectedSuggestedColorId ? t('analyzer:suggestionInspector') : t('analyzer:clusterInspector')}
            color={inspectorColor}
            metaLabel={inspectorMetaLabel}
            metaValue={inspectorMetaValue}
            secondaryMeta={inspectorSecondary}
          />
          {result ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('analyzer:workspaceActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border/80 bg-muted/35 p-3 text-sm text-foreground/65">
                  <Sparkles className="mr-2 inline h-4 w-4" />
                  {t('analyzer:reviewHint')}
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!result || !activePalette) {
                      return;
                    }

                    setCurrentPalette(activePalette);
                    void remember('analyzer', result.imageId, activePalette.name, '/analyzer');
                    navigate('/workspace');
                  }}
                >
                  {t('analyzer:adopt')}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    if (!result) {
                      return;
                    }

                    navigate('/exports', {
                      state: {
                        scope: 'palette',
                        paletteId: result.suggestedPalette.id,
                        paletteName: result.suggestedPalette.name,
                        from: 'analyzer',
                      },
                    });
                  }}
                >
                  {t('common:exports')}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => clear()}>
                  {t('analyzer:startOver')}
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {analyzerDiagnostics ? <DiagnosticsPanel diagnostics={analyzerDiagnostics} /> : null}
        </>
      }
    />
  );
}
