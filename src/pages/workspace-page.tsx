import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SplitPanelLayout } from '@/components/ui/split-panel-layout';
import { useToast } from '@/components/ui/toast-provider';
import { RouteNavigationPanel } from '@/app/route-navigation-panel';
import { ViewTabs } from '@/components/workspace/view-tabs';
import { PaletteStrip } from '@/components/workspace/palette-strip';
import { HighFrequencyAdjustmentPanel } from '@/components/workspace/high-frequency-adjustment-panel';
import { DiagnosticsPanel } from '@/components/workspace/diagnostics-panel';
import { InspectorPanel } from '@/components/workspace/inspector-panel';
import { WelcomeOverlay } from '@/components/workspace/welcome-overlay';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { scientificColorFromString } from '@/domain/color/convert';
import type { PaletteClass, WorkspaceView } from '@/domain/models';
import { useI18nStore } from '@/stores/i18n-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

const TemplateLibraryPanel = lazy(() => import('@/components/workspace/template-library-panel').then((module) => ({ default: module.TemplateLibraryPanel })));
const ToneRampPanel = lazy(() => import('@/components/workspace/tone-ramp-panel').then((module) => ({ default: module.ToneRampPanel })));
const PairingRecommendationPanel = lazy(() => import('@/components/workspace/pairing-recommendation-panel').then((module) => ({ default: module.PairingRecommendationPanel })));
const AdjustmentHistoryPanel = lazy(() => import('@/components/workspace/adjustment-history-panel').then((module) => ({ default: module.AdjustmentHistoryPanel })));
const ScientificMatrixPanel = lazy(() => import('@/components/workspace/scientific-matrix-panel').then((module) => ({ default: module.ScientificMatrixPanel })));
const GradientEditorPanel = lazy(() => import('@/components/workspace/gradient-editor-panel').then((module) => ({ default: module.GradientEditorPanel })));
const FigurePreviewPanel = lazy(() => import('@/components/workspace/figure-preview-panel').then((module) => ({ default: module.FigurePreviewPanel })));
const AccessibilityPanel = lazy(() => import('@/components/workspace/accessibility-panel').then((module) => ({ default: module.AccessibilityPanel })));

function PanelFallback({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-foreground/65">{label}</CardContent>
    </Card>
  );
}

function SwatchSection({
  title,
  colors,
  selectedColorId,
  onSelect,
  onSetMainColor,
}: {
  title: string;
  colors: ReturnType<typeof useWorkspaceStore.getState>['currentPalette']['colors'];
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  onSetMainColor: (colorId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {colors.map((color) => (
            <ColorSwatchButton
              key={color.id}
              color={color}
              selected={selectedColorId === color.id}
              onSelect={() => onSelect(color.id)}
              onSetMainColor={() => onSetMainColor(color.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspacePage() {
  const { t } = useTranslation(['common', 'workspace', 'diagnostics']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pushToast } = useToast();
  const currentPalette = useWorkspaceStore((state) => state.currentPalette);
  const selectedColorId = useWorkspaceStore((state) => state.selectedColorId);
  const selectedColor = useWorkspaceStore((state) => state.getSelectedColor());
  const activeView = useWorkspaceStore((state) => state.activeView);
  const setActiveView = useWorkspaceStore((state) => state.setActiveView);
  const setCurrentPalette = useWorkspaceStore((state) => state.setCurrentPalette);
  const applyTemplatePalette = useWorkspaceStore((state) => state.applyTemplatePalette);
  const generatePaletteFromBaseHex = useWorkspaceStore((state) => state.generatePaletteFromBaseHex);
  const selectColor = useWorkspaceStore((state) => state.selectColor);
  const setMainColor = useWorkspaceStore((state) => state.setMainColor);
  const deleteColor = useWorkspaceStore((state) => state.deleteColor);
  const reorderColors = useWorkspaceStore((state) => state.reorderColors);
  const renamePalette = useWorkspaceStore((state) => state.renamePalette);
  const setPaletteNotes = useWorkspaceStore((state) => state.setPaletteNotes);
  const insertColorsIntoPalette = useWorkspaceStore((state) => state.insertColorsIntoPalette);
  const setSelectedColorName = useWorkspaceStore((state) => state.setSelectedColorName);
  const setSelectedColorTags = useWorkspaceStore((state) => state.setSelectedColorTags);
  const setSelectedColorNotes = useWorkspaceStore((state) => state.setSelectedColorNotes);
  const setFigureType = useWorkspaceStore((state) => state.setFigureType);
  const figureType = useWorkspaceStore((state) => state.figureContext.type);
  const figureContext = useWorkspaceStore((state) => state.figureContext);
  const matrixMode = useWorkspaceStore((state) => state.matrixMode);
  const matrixDensity = useWorkspaceStore((state) => state.matrixDensity);
  const showWelcome = usePreferencesStore((state) => state.showWelcome);
  const setShowWelcome = usePreferencesStore((state) => state.setShowWelcome);
  const language = useI18nStore((state) => state.language);

  const [baseHex, setBaseHex] = useState(selectedColor.hex);
  const [paletteClass, setPaletteClass] = useState<PaletteClass>(currentPalette.class);
  const [showDeferredSidebar, setShowDeferredSidebar] = useState(false);

  useEffect(() => {
    const view = searchParams.get('view') as WorkspaceView | null;
    if (view && view !== activeView) {
      setActiveView(view);
    }
  }, [activeView, searchParams, setActiveView]);

  useEffect(() => {
    if (selectedColor.hex !== baseHex) {
      setBaseHex(selectedColor.hex);
    }
  }, [selectedColor.hex]);

  useEffect(() => {
    performance.mark('workspace-interactive');
    try {
      performance.measure('workspace-interactive', 'app-shell-visible', 'workspace-interactive');
    } catch {
      // Ignore duplicate or missing marks in non-browser test environments.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDeferredSidebar(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const viewItems = [
    { id: 'swatches', label: t('workspace:swatches') },
    { id: 'templates', label: t('workspace:templates') },
    { id: 'tone-ramp', label: t('workspace:toneRamp') },
    { id: 'scientific-grid', label: t('workspace:scientificGrid') },
    { id: 'gradient', label: t('workspace:gradient') },
    { id: 'pairing', label: t('workspace:pairing') },
    { id: 'chart-preview', label: t('workspace:chartPreview') },
    { id: 'accessibility', label: t('workspace:accessibility') },
    { id: 'inspector', label: t('workspace:inspector') },
  ] as const;

  const diagnostics = currentPalette.diagnostics;

  const applyTemplate = async (templateId: string) => {
    const [{ templateCatalog }, { templateToPalette }, { useTemplateStore }, { useLibraryStore }] = await Promise.all([
      import('@/data/templates/catalog'),
      import('@/domain/templates/query-service'),
      import('@/stores/template-store'),
      import('@/stores/library-store'),
    ]);

    const template = templateCatalog.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    const palette = templateToPalette(template);
    applyTemplatePalette(palette);
    useTemplateStore.getState().markRecent(templateId);
    await useLibraryStore.getState().remember('template', templateId, template.name, '/workspace');
    await setShowWelcome(false);
  };

  const insertHexes = (hexes: string[]) => {
    const colors = hexes.map((hex, index) =>
      scientificColorFromString(hex, {
        name: `Inserted ${index + 1}`,
        source: { kind: 'manual', detail: 'inserted-hex' },
        tags: ['inserted'],
        usage: [],
        notes: '',
      }),
    );
    insertColorsIntoPalette(colors);
  };

  const handleSavePalette = async () => {
    const { useLibraryStore } = await import('@/stores/library-store');
    const libraryStore = useLibraryStore.getState();
    if (!libraryStore.coreHydrated) {
      await libraryStore.hydrate('core');
    }

    const projectId = libraryStore.projects[0]?.id;
    if (!projectId) {
      pushToast(t('common:storageUnavailable'));
      return;
    }

    await libraryStore.savePalette(currentPalette, projectId);
    await libraryStore.remember('palette', currentPalette.id, currentPalette.name, '/workspace');
  };

  const centerView = (() => {
    switch (activeView) {
      case 'swatches':
        return (
          <SwatchSection
            title={t('workspace:swatches')}
            colors={currentPalette.colors}
            selectedColorId={selectedColorId}
            onSelect={selectColor}
            onSetMainColor={setMainColor}
          />
        );
      case 'templates':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:browseTemplates')} />}>
            <TemplateLibraryPanel currentPalette={currentPalette} onApplyTemplate={applyTemplate} />
          </Suspense>
        );
      case 'tone-ramp':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:toneRamp')} />}>
            <ToneRampPanel
              baseColor={selectedColor}
              selectedColorId={selectedColorId}
              onSelect={selectColor}
              onSetMainColor={setMainColor}
            />
          </Suspense>
        );
      case 'scientific-grid':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:scientificGrid')} />}>
            <ScientificMatrixPanel
              baseColor={selectedColor}
              mode={matrixMode}
              density={matrixDensity}
              selectedColorId={selectedColorId}
              onSelect={selectColor}
              onInsert={(hex) => insertHexes([hex])}
            />
          </Suspense>
        );
      case 'gradient':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:gradient')} />}>
            <GradientEditorPanel palette={currentPalette} baseColor={selectedColor} />
          </Suspense>
        );
      case 'pairing':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:pairing')} />}>
            <PairingRecommendationPanel baseColor={selectedColor} figureContext={figureContext} language={language} onInsertColors={insertHexes} />
          </Suspense>
        );
      case 'chart-preview':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:chartPreview')} />}>
            <FigurePreviewPanel palette={currentPalette} />
          </Suspense>
        );
      case 'accessibility':
        return (
          <Suspense fallback={<PanelFallback label={t('workspace:accessibility')} />}>
            <AccessibilityPanel palette={currentPalette} />
          </Suspense>
        );
      case 'inspector':
      default:
        return <InspectorPanel color={selectedColor} onNameChange={setSelectedColorName} onNotesChange={setSelectedColorNotes} onTagsChange={setSelectedColorTags} />;
    }
  })();

  return (
    <div className="relative">
      <SplitPanelLayout
        left={
          <>
            <RouteNavigationPanel />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('workspace:paletteSetup')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={paletteClass} onChange={(event) => setPaletteClass(event.target.value as PaletteClass)}>
                  <option value="qualitative">{t('workspace:qualitative')}</option>
                  <option value="sequential">{t('workspace:sequential')}</option>
                  <option value="diverging">{t('workspace:diverging')}</option>
                  <option value="cyclic">{t('workspace:cyclic')}</option>
                  <option value="concept">{t('workspace:conceptFigure')}</option>
                </Select>
                <div className="grid gap-2 sm:grid-cols-[72px_1fr]">
                  <Input type="color" className="h-10 cursor-pointer p-1" value={baseHex} onChange={(event) => setBaseHex(event.target.value)} />
                  <Input value={baseHex} onChange={(event) => setBaseHex(event.target.value)} />
                </div>
                <Button className="w-full" variant="subtle" onClick={() => generatePaletteFromBaseHex(baseHex, paletteClass)}>
                  {t('workspace:generateFromBase')}
                </Button>
                <Select value={figureType} onChange={(event) => setFigureType(event.target.value as typeof figureType)}>
                  <option value="line">{t('workspace:linePlot')}</option>
                  <option value="scatter">{t('workspace:scatterPlot')}</option>
                  <option value="bar">{t('workspace:barChart')}</option>
                  <option value="heatmap">{t('workspace:heatmap')}</option>
                  <option value="concept-figure">{t('workspace:conceptFigure')}</option>
                </Select>
                <Button className="w-full" variant="outline" onClick={() => setActiveView('templates')}>
                  {t('workspace:openTemplates')}
                </Button>
              </CardContent>
            </Card>
          </>
        }
        center={
          <>
            {showWelcome ? (
              <WelcomeOverlay
                onAction={(action) => {
                  void setShowWelcome(false);
                  if (action === 'extract-image') {
                    navigate('/analyzer');
                  } else if (action === 'open-library') {
                    setActiveView('templates');
                    setSearchParams({ view: 'templates' });
                  } else if (action === 'open-recent') {
                    navigate('/library');
                  }
                }}
              />
            ) : null}
            <PaletteStrip
              palette={currentPalette}
              selectedColorId={selectedColorId}
              onSelect={selectColor}
              onSetMainColor={setMainColor}
              onDelete={deleteColor}
              onReorder={reorderColors}
            />
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
              <HighFrequencyAdjustmentPanel />
              <InspectorPanel
                minimal
                color={selectedColor}
                onNameChange={setSelectedColorName}
                onNotesChange={setSelectedColorNotes}
                onTagsChange={setSelectedColorTags}
              />
            </div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle>{t('workspace:title')}</CardTitle>
                    <p className="mt-2 text-sm text-foreground/65">{t('workspace:dragHint')}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => setActiveView('templates')}>
                      {t('workspace:browseTemplates')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/exports', { state: { scope: 'palette', paletteId: currentPalette.id, from: 'workspace' } })}
                    >
                      {t('common:exports')}
                    </Button>
                    <Button onClick={() => void handleSavePalette()}>{t('workspace:savePalette')}</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                  <Input value={currentPalette.name} onChange={(event) => renamePalette(event.target.value)} placeholder={t('workspace:paletteName')} />
                  <Input value={currentPalette.notes} onChange={(event) => setPaletteNotes(event.target.value)} placeholder={t('workspace:notes')} />
                </div>
                <ViewTabs
                  items={viewItems}
                  active={activeView}
                  onChange={(view) => {
                    setActiveView(view);
                    setSearchParams({ view });
                  }}
                />
              </CardContent>
            </Card>
            {centerView}
          </>
        }
        right={
          <>
            {showDeferredSidebar ? (
              <Suspense fallback={<PanelFallback label={t('common:history')} />}>
                <AdjustmentHistoryPanel />
              </Suspense>
            ) : null}
            <DiagnosticsPanel
              summaryOnly
              diagnostics={diagnostics}
              onQuickFix={async (fixId) => {
                const { applyDiagnosticQuickFix } = await import('@/domain/diagnostics/quick-fixes');
                const nextPalette = applyDiagnosticQuickFix(currentPalette, fixId);
                setCurrentPalette(nextPalette);
                pushToast(t(`diagnostics:fix.${fixId}.label`));
              }}
            />
          </>
        }
      />
    </div>
  );
}
