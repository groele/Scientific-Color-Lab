import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { Select } from '@/components/ui/select';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import { deriveScientificTemplateMeta, rankTemplateCatalog } from '@/domain/templates/scientific-guidance';
import { filterTemplateCatalog, templateToPalette } from '@/domain/templates/query-service';
import { useTemplateStore } from '@/stores/template-store';

interface TemplateLibraryPanelProps {
  onApplyTemplate: (templateId: string) => void;
}

export function TemplateLibraryPanel({ onApplyTemplate }: TemplateLibraryPanelProps) {
  const { t, i18n } = useTranslation(['common', 'workspace', 'templates']);
  const isZh = i18n.language === 'zh-CN';
  const query = useTemplateStore((state) => state.query);
  const setQuery = useTemplateStore((state) => state.setQuery);
  const filters = useTemplateStore((state) => state.filters);
  const setFilter = useTemplateStore((state) => state.setFilter);
  const templates = useTemplateStore((state) => state.templates);
  const recentTemplateIds = useTemplateStore((state) => state.recentTemplateIds);
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

  const chartTypeLabel = (value: string) =>
    isZh
      ? {
          'line-plot': '折线图',
          'scatter-plot': '散点图',
          'bar-chart': '柱状图',
          heatmap: '热图',
          'concept-figure': '概念图',
          'presentation-slide': '演示幻灯片',
        }[value] ?? value
      : {
          'line-plot': 'Line plot',
          'scatter-plot': 'Scatter plot',
          'bar-chart': 'Bar chart',
          heatmap: 'Heatmap',
          'concept-figure': 'Concept figure',
          'presentation-slide': 'Presentation slide',
        }[value] ?? value;

  const structureLabel = (value: string) =>
    isZh
      ? {
          monochromatic: '单色系',
          'cool-warm-balanced': '冷暖平衡',
          'high-contrast-categorical': '高对比分类型',
          'low-saturation-editorial': '低饱和编辑风',
          'sequential-gradient': '顺序渐变',
          'diverging-gradient': '发散渐变',
          'cyclic-gradient': '周期渐变',
        }[value] ?? value
      : {
          monochromatic: 'Monochromatic',
          'cool-warm-balanced': 'Cool-warm balanced',
          'high-contrast-categorical': 'High-contrast categorical',
          'low-saturation-editorial': 'Low-saturation editorial',
          'sequential-gradient': 'Sequential gradient',
          'diverging-gradient': 'Diverging gradient',
          'cyclic-gradient': 'Cyclic gradient',
        }[value] ?? value;

  const usageLabel = (value: string) =>
    isZh
      ? {
          manuscript: '论文',
          'lab meeting': '组会',
          poster: '海报',
          'course slides': '课程幻灯片',
          'online document': '在线文档',
        }[value] ?? value
      : value;

  const backgroundLabel = (value: string) => (isZh ? (value === 'light' ? '浅色背景' : '深色背景') : value);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{t('workspace:templateLibrary')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <SearchFilterBar value={query} onChange={setQuery} placeholder={isZh ? '搜索模板、语气或学术用途' : 'Search templates, tones, or academic use'} />
          <Select value={filters.chartType ?? 'all'} onChange={(event) => setFilter('chartType', event.target.value as typeof filters.chartType)}>
            <option value="all">{isZh ? '全部图表类型' : 'All chart types'}</option>
            <option value="line-plot">{chartTypeLabel('line-plot')}</option>
            <option value="scatter-plot">{chartTypeLabel('scatter-plot')}</option>
            <option value="bar-chart">{chartTypeLabel('bar-chart')}</option>
            <option value="heatmap">{chartTypeLabel('heatmap')}</option>
            <option value="concept-figure">{chartTypeLabel('concept-figure')}</option>
            <option value="presentation-slide">{chartTypeLabel('presentation-slide')}</option>
          </Select>
          <Select value={filters.structure ?? 'all'} onChange={(event) => setFilter('structure', event.target.value as typeof filters.structure)}>
            <option value="all">{isZh ? '全部结构' : 'All structures'}</option>
            <option value="monochromatic">{structureLabel('monochromatic')}</option>
            <option value="cool-warm-balanced">{structureLabel('cool-warm-balanced')}</option>
            <option value="high-contrast-categorical">{structureLabel('high-contrast-categorical')}</option>
            <option value="low-saturation-editorial">{structureLabel('low-saturation-editorial')}</option>
            <option value="sequential-gradient">{structureLabel('sequential-gradient')}</option>
            <option value="diverging-gradient">{structureLabel('diverging-gradient')}</option>
            <option value="cyclic-gradient">{structureLabel('cyclic-gradient')}</option>
          </Select>
          <Select value={filters.backgroundMode ?? 'all'} onChange={(event) => setFilter('backgroundMode', event.target.value as typeof filters.backgroundMode)}>
            <option value="all">{isZh ? '全部背景' : 'All backgrounds'}</option>
            <option value="light">{isZh ? '浅色' : 'Light'}</option>
            <option value="dark">{isZh ? '深色' : 'Dark'}</option>
          </Select>
          <Select value={String(filters.size ?? 'all')} onChange={(event) => setFilter('size', event.target.value === 'all' ? 'all' : Number(event.target.value))}>
            <option value="all">{isZh ? '全部规模' : 'All sizes'}</option>
            <option value="5">{isZh ? '5 色' : '5 colors'}</option>
            <option value="7">{isZh ? '7 色' : '7 colors'}</option>
            <option value="9">{isZh ? '9 色' : '9 colors'}</option>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/25 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-foreground">{t('workspace:scientificGuidance')}</div>
            <p className="mt-1 text-sm text-foreground/65">{t('workspace:scientificGuidanceBody')}</p>
          </div>
          <div className="text-sm text-foreground/55">{visibleTemplates.length} {isZh ? '个模板' : 'templates'}</div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleTemplates.map((template) => {
            const palette = templateToPalette(template);
            const scientificMeta = deriveScientificTemplateMeta(template);
            return (
              <div key={template.id} className="rounded-2xl border border-border/80 bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{template.name}</div>
                    <p className="mt-1 text-sm text-foreground/65">{template.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/55">
                      <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{chartTypeLabel(template.chartType)}</span>
                      <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{structureLabel(template.structure)}</span>
                      <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{usageLabel(template.academicUsage)}</span>
                      <span className="rounded-full border border-border/80 bg-muted/45 px-2 py-1">{backgroundLabel(template.backgroundMode)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scientificMeta.labels.map((label) => (
                        <span key={label} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          {t(`templates:${label}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onApplyTemplate(template.id)}>
                    {t('common:apply')}
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {palette.colors.slice(0, 5).map((color) => (
                    <ColorSwatchButton key={color.id} color={color} compact />
                  ))}
                </div>
                <div className="mt-4 text-xs uppercase tracking-[0.16em] text-foreground/45">
                  {recentTemplateIds.includes(template.id) ? t('workspace:recentlyUsedTemplate') : t('workspace:readyToApply')}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
