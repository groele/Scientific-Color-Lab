import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ClipboardPaste, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SplitPanelLayout } from '@/components/ui/split-panel-layout';
import { RouteNavigationPanel } from '@/app/route-navigation-panel';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import {
  ClusterTable,
  ClusterTreemap,
  ColorSummaryCard,
  ImageDropzone,
  ReplacementSuggestionList,
} from '@/components/viz/image-analysis';
import { DiagnosticsPanel } from '@/components/workspace/diagnostics-panel';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import type { ColorToken, ImageCluster } from '@/domain/models';
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

function clusterSummary(cluster: ImageCluster | null) {
  if (!cluster) {
    return null;
  }

  return `${cluster.color.hex} · ${Math.round(cluster.percentage * 100)}% share · ${cluster.count} sampled pixels`;
}

function clusterSuitability(cluster: ImageCluster | null, isZh: boolean) {
  if (!cluster?.assessment) {
    return isZh ? '在出版使用前仍需要重构。' : 'Needs reconstruction before publication use.';
  }

  const flags = [];
  if (cluster.assessment.categorical) flags.push(isZh ? '分类色' : 'categorical');
  if (cluster.assessment.gradientEndpoint) flags.push(isZh ? '渐变端点' : 'gradient endpoint');
  if (cluster.assessment.background) flags.push(isZh ? '背景' : 'background');
  if (cluster.assessment.text) flags.push(isZh ? '文字' : 'text');
  if (cluster.assessment.accent) flags.push(isZh ? '强调色' : 'accent');
  return flags.length ? (isZh ? `适合作为${flags.join('、')}。` : `Suitable for ${flags.join(', ')}.`) : isZh ? '在出版使用前仍需要重构。' : 'Needs reconstruction before publication use.';
}

export function AnalyzerPage() {
  const { t, i18n } = useTranslation(['analyzer']);
  const isZh = i18n.language === 'zh-CN';
  const navigate = useNavigate();
  const { canInstall, install } = usePwaInstall();
  const previewUrl = useAnalyzerStore((state) => state.previewUrl);
  const result = useAnalyzerStore((state) => state.result);
  const isAnalyzing = useAnalyzerStore((state) => state.isAnalyzing);
  const error = useAnalyzerStore((state) => state.error);
  const selectedClusterId = useAnalyzerStore((state) => state.selectedClusterId);
  const selectedSuggestedColorId = useAnalyzerStore((state) => state.selectedSuggestedColorId);
  const analyzeFile = useAnalyzerStore((state) => state.analyzeFile);
  const analyzeBlob = useAnalyzerStore((state) => state.analyzeBlob);
  const selectCluster = useAnalyzerStore((state) => state.selectCluster);
  const selectSuggestedColor = useAnalyzerStore((state) => state.selectSuggestedColor);
  const setError = useAnalyzerStore((state) => state.setError);
  const clear = useAnalyzerStore((state) => state.clear);
  const setCurrentPalette = useWorkspaceStore((state) => state.setCurrentPalette);
  const remember = useLibraryStore((state) => state.remember);

  const selectedCluster = result?.mergedClusters.find((cluster) => cluster.id === selectedClusterId) ?? result?.mergedClusters[0] ?? null;
  const selectedSuggestedColor =
    result?.suggestedPalette.colors.find((color) => color.id === selectedSuggestedColorId) ?? result?.suggestedPalette.colors[0] ?? null;
  const inspectorColor: ColorToken | null = selectedSuggestedColorId ? selectedSuggestedColor : selectedCluster?.color ?? selectedSuggestedColor;
  const inspectorMetaLabel = selectedSuggestedColorId ? t('analyzer:suitability') : t('analyzer:analysisSummary');
  const inspectorMetaValue = selectedSuggestedColorId
    ? selectedSuggestedColor?.usage.join(', ') || 'Reconstructed for scientific use'
    : clusterSummary(selectedCluster) ?? undefined;
  const inspectorSecondary = selectedSuggestedColorId ? selectedSuggestedColor?.notes : clusterSuitability(selectedCluster, isZh);
  const suitabilitySummary = result ? deriveSuitabilitySummary(result.mergedClusters) : null;

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

  const handleSampleLoad = async () => {
    try {
      const response = await fetch('/examples/lab-spectrum.svg');
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
      left={<RouteNavigationPanel canInstall={canInstall} onInstall={() => void install()} />}
      center={
        <>
          <ImageDropzone
            hasImage={Boolean(previewUrl || result)}
            onReset={clear}
            onFile={(file) => void analyzeFile(file)}
            onSample={() => void handleSampleLoad()}
          />

          {!result && !isAnalyzing && !error ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('analyzer:startWithImage')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border/80 bg-muted/35 p-4 text-sm text-foreground/70">{t('analyzer:startWithImageBody')}</div>
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

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle className="mr-2 inline h-4 w-4" />
              {error}
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
              <ClusterTreemap clusters={result.mergedClusters} selectedClusterId={selectedCluster?.id ?? null} onSelect={(clusterId) => selectCluster(clusterId)} />
              {suitabilitySummary ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>{t('analyzer:analysisSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">{t('analyzer:categoricalSafe')}: {suitabilitySummary.categorical}</div>
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">{t('analyzer:textSafe')}: {suitabilitySummary.text}</div>
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">{t('analyzer:backgroundSafe')}: {suitabilitySummary.background}</div>
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-3 text-sm">{t('analyzer:accentSafe')}: {suitabilitySummary.accent}</div>
                  </CardContent>
                </Card>
              ) : null}
              <ClusterTable clusters={result.mergedClusters} selectedClusterId={selectedCluster?.id ?? null} onSelect={(clusterId) => selectCluster(clusterId)} />
              <ReplacementSuggestionList
                palette={result.suggestedPalette}
                selectedColorId={selectedSuggestedColor?.id ?? null}
                onSelect={(colorId) => selectSuggestedColor(colorId)}
              />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{t('analyzer:resultPalette')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {result.suggestedPalette.colors.map((color) => (
                      <ColorSwatchButton
                        key={color.id}
                        color={color}
                        selected={color.id === selectedSuggestedColor?.id}
                        onSelect={() => selectSuggestedColor(color.id)}
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
          {result ? <DiagnosticsPanel diagnostics={result.diagnostics} /> : null}
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
                    setCurrentPalette(result.suggestedPalette);
                    void remember('analyzer', result.imageId, result.suggestedPalette.name, '/analyzer');
                    navigate('/workspace');
                  }}
                >
                  {t('analyzer:adopt')}
                </Button>
                <Button className="w-full" variant="outline" onClick={() => clear()}>
                  {t('analyzer:startOver')}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </>
      }
    />
  );
}
