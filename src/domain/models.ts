export type LanguageCode = 'en' | 'zh-CN';
export type BackgroundMode = 'light' | 'dark';
export type PaletteClass = 'qualitative' | 'sequential' | 'diverging' | 'cyclic' | 'concept';
export type MatrixMode = 'hue-lightness' | 'chroma-lightness';
export type MatrixDensity = 5 | 7 | 9;
export type WorkspaceView =
  | 'swatches'
  | 'templates'
  | 'tone-ramp'
  | 'scientific-grid'
  | 'gradient'
  | 'pairing'
  | 'chart-preview'
  | 'accessibility'
  | 'inspector';
export type FigureType =
  | 'line'
  | 'scatter'
  | 'bar'
  | 'heatmap'
  | 'sequential-gradient'
  | 'diverging-gradient'
  | 'cyclic-colormap'
  | 'concept-figure';
export type CopyFormat = 'hex' | 'rgb' | 'hsl' | 'lab' | 'oklch' | 'css';
export type DiagnosticSeverity = 'info' | 'warning' | 'error';
export type PaletteDiagnosticsStatus = 'healthy' | 'needs-attention' | 'high-risk';
export type GamutStatus = 'in-gamut' | 'mapped';
export type FavoriteKind = 'color' | 'palette' | 'pairing';
export type AssetKind = 'color' | 'palette' | 'pairing' | 'image-analysis' | 'project';
export type ExportScope = 'color' | 'palette' | 'project';
export type ExportFormat = 'json' | 'csv' | 'css' | 'tailwind' | 'matplotlib' | 'plotly' | 'matlab' | 'summary';
export type NotesBehavior = 'inline' | 'separate' | 'omit';
export type WelcomeAction = 'new-palette' | 'extract-image' | 'open-library' | 'open-recent';
export type AnalyzerDetailLevel = 'compact' | 'balanced' | 'complete';
export type AnalyzerClusterLayer = 'summary' | 'detail';
export type TemplateChartType =
  | 'line-plot'
  | 'scatter-plot'
  | 'bar-chart'
  | 'heatmap'
  | 'concept-figure'
  | 'presentation-slide';
export type TemplateStructure =
  | 'monochromatic'
  | 'cool-warm-balanced'
  | 'high-contrast-categorical'
  | 'low-saturation-editorial'
  | 'sequential-gradient'
  | 'diverging-gradient'
  | 'cyclic-gradient';
export type TemplateTone =
  | 'Editorial Minimal'
  | 'Nature-like'
  | 'Publication Clean'
  | 'Scientific Neutral'
  | 'Presentation Strong';
export type AcademicUsage =
  | 'manuscript'
  | 'lab meeting'
  | 'poster'
  | 'course slides'
  | 'online document';
export type PairingStyleBucket =
  | 'most-natural'
  | 'safest'
  | 'most-vivid'
  | 'line-plots'
  | 'mechanism-figures'
  | 'heatmap-endpoints';
export type ContrastStrength = 'low' | 'medium' | 'high';
export type ToneLabel = 'restrained' | 'balanced' | 'bold';
export type AdjustmentDimension = 'hue' | 'lightness' | 'chroma' | 'alpha';
export type DiagnosticQuickFixId =
  | 'reduce-chroma'
  | 'increase-categorical-spacing'
  | 'replace-red-green-pair'
  | 'rebuild-sequential-ramp'
  | 'rebalance-diverging-midpoint'
  | 'close-cyclic-endpoints'
  | 'suggest-safer-template';

export interface NumericRgb {
  r: number;
  g: number;
  b: number;
}

export interface NumericHsl {
  h: number;
  s: number;
  l: number;
}

export interface NumericLab {
  l: number;
  a: number;
  b: number;
}

export interface NumericOklch {
  l: number;
  c: number;
  h: number;
}

export interface ColorSource {
  kind: 'preset' | 'generated' | 'image' | 'imported' | 'manual';
  detail?: string;
}

export interface SwatchEntity {
  id: string;
  hex: string;
  name: string;
  copyLabel: string;
  favoriteable: boolean;
  insertable: boolean;
}

export interface ColorToken extends SwatchEntity {
  rgb: NumericRgb;
  hsl: NumericHsl;
  lab: NumericLab;
  oklch: NumericOklch;
  alpha: number;
  cssColor: string;
  source: ColorSource;
  gamutStatus: GamutStatus;
  tags: string[];
  usage: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ScientificColor = ColorToken;

export interface DiagnosticItem {
  id: string;
  code:
    | 'low-interface-contrast'
    | 'categorical-too-similar'
    | 'red-green-conflict'
    | 'oversaturation-risk'
    | 'too-many-qualitative-colors'
    | 'sequential-non-monotonic'
    | 'diverging-midpoint-chromatic'
    | 'cyclic-endpoints-open'
    | 'rainbow-risk'
    | 'analyzer-few-categorical'
    | 'analyzer-no-text-safe'
    | 'analyzer-no-background-safe'
    | 'analyzer-oversaturated'
    | 'analyzer-merged-near-duplicates'
    | 'analyzer-high-color-diversity'
    | 'analyzer-heavy-merge'
    | 'analyzer-long-tail-preserved'
    | 'analyzer-detail-layer-recommended';
  severity: DiagnosticSeverity;
  category:
    | 'palette-risk'
    | 'contrast'
    | 'categorical'
    | 'sequential'
    | 'diverging'
    | 'cyclic'
    | 'accessibility'
    | 'analyzer';
  title: string;
  message: string;
  suggestion?: string;
  relatedColorIds?: string[];
}

export interface DiagnosticQuickFix {
  id: DiagnosticQuickFixId;
  relatedColorIds?: string[];
}

export interface PaletteDiagnostics {
  score: number;
  status: PaletteDiagnosticsStatus;
  summary: string;
  quickFixes: DiagnosticQuickFix[];
  items: DiagnosticItem[];
}

export interface PaletteProvenance {
  source: 'preset' | 'base-color' | 'image-analysis' | 'manual' | 'import';
  reference?: string;
}

export interface PaletteCategory {
  chartType: TemplateChartType;
  structure: TemplateStructure;
  background: BackgroundMode;
  size: number;
  tone: TemplateTone;
  usage: AcademicUsage;
}

export interface Palette {
  id: string;
  name: string;
  class: PaletteClass;
  colors: ColorToken[];
  baseColorId?: string;
  diagnostics: PaletteDiagnostics;
  tags: string[];
  notes: string;
  projectId?: string;
  templateId?: string;
  categories?: PaletteCategory;
  provenance: PaletteProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface MatrixCell {
  id: string;
  row: number;
  column: number;
  xValue: number;
  yValue: number;
  clipped: boolean;
  diagnostics: string[];
  color: ColorToken;
}

export interface ColorMatrix {
  id: string;
  baseColorId: string;
  mode: MatrixMode;
  density: MatrixDensity;
  xAxis: string;
  yAxis: string;
  cells: MatrixCell[][];
}

export interface DivergingPair {
  left: ColorToken;
  midpoint: ColorToken;
  right: ColorToken;
}

export interface GradientDefinition {
  id: string;
  label: string;
  css: string;
  stops: ColorToken[];
  type: FigureType | 'palette';
}

export interface FigurePreviewSpec {
  lineSeriesCount: number;
  categories: string[];
  domainMin: number;
  domainMax: number;
  background: BackgroundMode;
}

export interface FigurePreset {
  id: string;
  type: FigureType;
  paletteId: string;
  previewSpec: FigurePreviewSpec;
  validation: PaletteDiagnostics;
}

export interface PairingRecommendation extends SwatchEntity {
  colors: ColorToken[];
  baseColorId: string;
  styleBucket: PairingStyleBucket;
  contrastStrength: ContrastStrength;
  tone: ToneLabel;
  scenarioFit: string;
  explanation: string;
}

export interface PairingRecommendationGroup {
  id: string;
  label: string;
  styleBucket: PairingStyleBucket;
  items: PairingRecommendation[];
}

export interface SuitabilityAssessment {
  categorical: boolean;
  gradientEndpoint: boolean;
  background: boolean;
  text: boolean;
  accent: boolean;
}

export interface ImageCluster {
  id: string;
  color: ColorToken;
  count: number;
  percentage: number;
  merged: boolean;
  assessment?: SuitabilityAssessment;
}

export interface AnalyzerOptions {
  detailLevel: AnalyzerDetailLevel;
  maxColors: 8 | 12 | 16 | 24;
}

export interface ImageAnalysisStats {
  processedPixels: number;
  opaquePixels: number;
  resizeScale: number;
  histogramBins: number;
  detailClusterCount: number;
  summaryClusterCount: number;
  droppedClusterCount: number;
}

export interface ImageAnalysisResult {
  imageId: string;
  width: number;
  height: number;
  clusters: ImageCluster[];
  percentages: number[];
  detailClusters: ImageCluster[];
  mergedClusters: ImageCluster[];
  suggestedPalette: Palette;
  diagnostics: PaletteDiagnostics;
  stats: ImageAnalysisStats;
}

export type ImportStatus = 'success' | 'partial' | 'failed';

export interface PaletteImportResult {
  status: ImportStatus;
  palette: Palette | null;
  importedRows: number;
  skippedRows: number;
  message?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tagIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  assetKind: AssetKind;
  targetId: string;
  name: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRef {
  id: string;
  kind: FavoriteKind;
  targetId: string;
  name?: string;
  createdAt: string;
}

export interface RecentEntry {
  id: string;
  type: 'palette' | 'color' | 'analyzer' | 'template' | 'project';
  targetId: string;
  label: string;
  route?: string;
  createdAt: string;
}

export interface SavedExport {
  id: string;
  paletteId?: string;
  projectId?: string;
  colorId?: string;
  profileId?: string;
  language: LanguageCode;
  format: ExportFormat;
  scope: ExportScope;
  content: string;
  filename: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  label: string;
}

export interface DiagnosticThresholds {
  categoricalDeltaE: number;
  minimumContrast: number;
  maxQualitativeColors: number;
  maximumChroma: number;
}

export interface AppPreferences {
  language: LanguageCode;
  copyFormat: CopyFormat;
  thresholds: DiagnosticThresholds;
  backgroundMode: BackgroundMode;
  recentProjectId?: string;
  showWelcome: boolean;
}

export interface PersistedSettings extends AppPreferences {}

export interface StartupSnapshot {
  version: number;
  language: LanguageCode;
  backgroundMode: BackgroundMode;
  copyFormat: CopyFormat;
  showWelcome: boolean;
  lastWorkspaceRoute?: string;
  updatedAt: string;
}

export interface AppBootstrapState {
  phase: 'shell-ready' | 'restoring' | 'ready' | 'degraded' | 'failed';
  issues: string[];
  storageMode: 'persistent' | 'memory';
  restoredFrom: 'snapshot' | 'dexie' | 'memory';
}

export interface ExportProfile {
  id: string;
  name: string;
  scope: ExportScope;
  format: ExportFormat;
  language: LanguageCode;
  includeMetadata: boolean;
  includeTags: boolean;
  notesBehavior: NotesBehavior;
  filenameTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateDescriptor {
  id: string;
  name: string;
  description: string;
  paletteClass: PaletteClass;
  chartType: TemplateChartType;
  structure: TemplateStructure;
  backgroundMode: BackgroundMode;
  size: number;
  tone: TemplateTone;
  academicUsage: AcademicUsage;
  tags: string[];
  favorite?: boolean;
  recentUseAt?: string;
  baseHex: string;
  hexes: string[];
}

export interface FigureContext {
  type: FigureType;
  backgroundMode: BackgroundMode;
  emphasizeThinLines: boolean;
}

export interface AdjustmentState {
  hue: number;
  lightness: number;
  chroma: number;
  alpha: number;
  locks: Record<AdjustmentDimension, boolean>;
}

export interface AdjustmentDelta {
  hue: number;
  lightness: number;
  chroma: number;
  alpha: number;
}

export interface AdjustmentHistoryEntry {
  id: string;
  scope: 'palette';
  anchorColorId: string;
  anchorColorName: string;
  before: NumericOklch & { alpha: number };
  after: NumericOklch & { alpha: number };
  delta: AdjustmentDelta;
  createdAt: string;
}

export interface LanguagePack {
  code: LanguageCode;
  label: string;
}

export interface RawPresetPalette {
  id: string;
  name: string;
  class: PaletteClass;
  description: string;
  tags: string[];
  colors: string[];
}

export interface AnalyzerWorkerRequest {
  requestId: string;
  imageId: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  pixels: ArrayBuffer;
  options: AnalyzerOptions;
}

export interface AnalyzerWorkerResponse {
  requestId: string;
  result: ImageAnalysisResult;
}
