import type {
  ColorToken,
  FigureContext,
  LanguageCode,
  PairingRecommendation,
  PairingRecommendationGroup,
  PairingStyleBucket,
  ToneLabel,
} from '@/domain/models';
import { createId, normalizeHue, scientificColorFromOklch } from '@/domain/color/convert';

interface PairingCopy {
  label: string;
  scenarioFit: string;
  explanation: string;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function pairingText(language: LanguageCode, bucket: PairingStyleBucket, name: string): PairingCopy {
  const zh: Record<PairingStyleBucket, PairingCopy> = {
    'most-natural': {
      label: '最自然',
      scenarioFit: '适合论文主图、在线文档和低噪声说明图。',
      explanation: `${name} 以中低饱和支撑色和安静中性色为主，更接近高端科研出版的用色习惯。`,
    },
    safest: {
      label: '最稳妥',
      scenarioFit: '适合色觉缺陷友好、需要长期复用的图表系统。',
      explanation: `${name} 优先保证对比和结构稳定性，避免红绿冲突与过强色相跳变。`,
    },
    'most-vivid': {
      label: '最有张力',
      scenarioFit: '适合展示页、摘要图或需要更强视觉区分的场景。',
      explanation: `${name} 保留一定视觉张力，但仍避免滑入彩虹式科学误导表达。`,
    },
    'line-plots': {
      label: '线图优先',
      scenarioFit: '适合细线、多序列折线图和带图例的趋势图。',
      explanation: `${name} 提高细线在浅背景下的辨识度，同时压住无关视觉噪声。`,
    },
    'mechanism-figures': {
      label: '机制图优先',
      scenarioFit: '适合机制示意图、概念图和模块关系图。',
      explanation: `${name} 采用主色 + 支持色 + 中性色结构，便于建立层级和语义角色。`,
    },
    'heatmap-endpoints': {
      label: '热图端点',
      scenarioFit: '适合发散热图端点、冷暖对照和中心化数据。',
      explanation: `${name} 保持两端均衡，同时为中点留出安静缓冲区。`,
    },
  };

  const en: Record<PairingStyleBucket, PairingCopy> = {
    'most-natural': {
      label: 'Most Natural',
      scenarioFit: 'Best for manuscript figures, online documents, and restrained explanatory diagrams.',
      explanation: `${name} uses low-noise support colors and quiet neutrals that fit editorial scientific layouts.`,
    },
    safest: {
      label: 'Safest',
      scenarioFit: 'Best for accessibility-conscious charts and long-lived palette systems.',
      explanation: `${name} prioritizes contrast stability and avoids red/green collapse or aggressive hue swings.`,
    },
    'most-vivid': {
      label: 'Most Vivid',
      scenarioFit: 'Best for summary figures, presentation states, and stronger category separation.',
      explanation: `${name} keeps stronger energy without slipping into rainbow-like scientific misuse.`,
    },
    'line-plots': {
      label: 'Line Plots',
      scenarioFit: 'Best for thin-line trend plots with legends and subtle gridlines.',
      explanation: `${name} improves thin-line visibility while keeping the chart field restrained.`,
    },
    'mechanism-figures': {
      label: 'Mechanism Figures',
      scenarioFit: 'Best for concept figures, pathway diagrams, and structured annotations.',
      explanation: `${name} uses a base + support + neutral structure that reads well in scientific diagrams.`,
    },
    'heatmap-endpoints': {
      label: 'Heatmap Endpoints',
      scenarioFit: 'Best for diverging endpoints, cool-warm comparisons, and centered measurements.',
      explanation: `${name} balances both ends and preserves room for a quieter midpoint.`,
    },
  };

  return language === 'zh-CN' ? zh[bucket] : en[bucket];
}

function deriveColor(
  base: ColorToken,
  hueOffset: number,
  lightnessShift: number,
  chromaScale: number,
  name: string,
  tags: string[],
) {
  return scientificColorFromOklch(
    {
      h: normalizeHue(base.oklch.h + hueOffset),
      l: clamp(base.oklch.l + lightnessShift, 0.12, 0.92),
      c: clamp(base.oklch.c * chromaScale, 0.012, 0.22),
      alpha: base.alpha,
    },
    {
      id: createId('pair'),
      name,
      source: { kind: 'generated', detail: 'pairing-engine' },
      tags: [...new Set([...base.tags, ...tags])],
      usage: base.usage,
      notes: base.notes,
    },
  );
}

function neutral(name: string) {
  return scientificColorFromOklch(
    {
      l: 0.87,
      c: 0.014,
      h: 250,
      alpha: 1,
    },
    {
      id: createId('pair'),
      name,
      source: { kind: 'generated', detail: 'pairing-neutral' },
      tags: ['pairing', 'neutral'],
      usage: ['background', 'label'],
      notes: '',
    },
  );
}

function recommendation(
  language: LanguageCode,
  base: ColorToken,
  bucket: PairingStyleBucket,
  name: string,
  colors: ColorToken[],
  contrastStrength: PairingRecommendation['contrastStrength'],
  tone: ToneLabel,
): PairingRecommendation {
  const copy = pairingText(language, bucket, name);

  return {
    id: createId('pairing'),
    name,
    hex: colors[1]?.hex ?? base.hex,
    copyLabel: name,
    favoriteable: true,
    insertable: true,
    colors,
    baseColorId: base.id,
    styleBucket: bucket,
    contrastStrength,
    tone,
    scenarioFit: copy.scenarioFit,
    explanation: copy.explanation,
  };
}

export function buildPairingRecommendationGroups(
  base: ColorToken,
  figureContext: FigureContext,
  language: LanguageCode = 'en',
): PairingRecommendationGroup[] {
  const sharedNeutral = neutral(language === 'zh-CN' ? '编辑中性' : 'Editorial Neutral');
  const backgroundLift = figureContext.backgroundMode === 'dark' ? 0.08 : -0.02;

  const groups: Array<{ bucket: PairingStyleBucket; items: PairingRecommendation[] }> = [
    {
      bucket: 'most-natural',
      items: [
        recommendation(
          language,
          base,
          'most-natural',
          language === 'zh-CN' ? '主色 + 冷静支撑' : 'Base + Calm Support',
          [
            base,
            deriveColor(base, 28, backgroundLift, 0.62, language === 'zh-CN' ? '冷静蓝' : 'Calm Blue', ['pairing', 'support']),
            sharedNeutral,
          ],
          'medium',
          'restrained',
        ),
        recommendation(
          language,
          base,
          'most-natural',
          language === 'zh-CN' ? '主色 + 温暖辅助' : 'Base + Warm Support',
          [
            base,
            deriveColor(base, -22, 0.05, 0.56, language === 'zh-CN' ? '温暖沙色' : 'Warm Sand', ['pairing', 'support']),
            sharedNeutral,
          ],
          'medium',
          'balanced',
        ),
      ],
    },
    {
      bucket: 'safest',
      items: [
        recommendation(
          language,
          base,
          'safest',
          language === 'zh-CN' ? '安全蓝灰组' : 'Safe Blue-Gray',
          [
            base,
            deriveColor(base, 108, -0.04, 0.68, language === 'zh-CN' ? '安全蓝' : 'Safe Blue', ['pairing', 'safe']),
            sharedNeutral,
          ],
          'high',
          'restrained',
        ),
        recommendation(
          language,
          base,
          'safest',
          language === 'zh-CN' ? '低噪声双主色' : 'Low-Noise Dual Anchor',
          [
            base,
            deriveColor(base, 150, 0.02, 0.52, language === 'zh-CN' ? '石板青' : 'Slate Teal', ['pairing', 'safe']),
            deriveColor(base, 0, 0.2, 0.2, language === 'zh-CN' ? '浅底色' : 'Light Neutral', ['pairing', 'safe']),
          ],
          'high',
          'restrained',
        ),
      ],
    },
    {
      bucket: 'most-vivid',
      items: [
        recommendation(
          language,
          base,
          'most-vivid',
          language === 'zh-CN' ? '高张力冷暖对照' : 'Vivid Cool-Warm Counterpoint',
          [
            base,
            deriveColor(base, 165, -0.06, 0.9, language === 'zh-CN' ? '高张力冷端' : 'Vivid Cool End', ['pairing', 'vivid']),
            deriveColor(base, -35, 0.12, 0.74, language === 'zh-CN' ? '高张力暖端' : 'Vivid Warm End', ['pairing', 'vivid']),
          ],
          'high',
          'bold',
        ),
        recommendation(
          language,
          base,
          'most-vivid',
          language === 'zh-CN' ? '强调双色 + 中性' : 'Accent Pair + Neutral',
          [
            base,
            deriveColor(base, 78, 0.08, 0.82, language === 'zh-CN' ? '强调辅色' : 'Accent Counterpoint', ['pairing', 'vivid']),
            sharedNeutral,
          ],
          'high',
          'bold',
        ),
      ],
    },
    {
      bucket: 'line-plots',
      items: [
        recommendation(
          language,
          base,
          'line-plots',
          language === 'zh-CN' ? '细线图三色组' : 'Thin-Line Trio',
          [
            deriveColor(base, 0, -0.08, 0.9, language === 'zh-CN' ? '深主线' : 'Primary Line', ['line']),
            deriveColor(base, 118, -0.04, 0.74, language === 'zh-CN' ? '对照线' : 'Counter Line', ['line']),
            deriveColor(base, -145, 0.02, 0.66, language === 'zh-CN' ? '第三线' : 'Third Line', ['line']),
          ],
          'high',
          'balanced',
        ),
      ],
    },
    {
      bucket: 'mechanism-figures',
      items: [
        recommendation(
          language,
          base,
          'mechanism-figures',
          language === 'zh-CN' ? '机制图主辅中性' : 'Mechanism Base + Support + Neutral',
          [
            base,
            deriveColor(base, 58, 0.12, 0.65, language === 'zh-CN' ? '机制辅助' : 'Mechanism Support', ['mechanism']),
            sharedNeutral,
          ],
          'medium',
          'restrained',
        ),
        recommendation(
          language,
          base,
          'mechanism-figures',
          language === 'zh-CN' ? '模块区分扩展' : 'Module Expansion',
          [
            base,
            deriveColor(base, 95, 0.05, 0.62, language === 'zh-CN' ? '模块二' : 'Module Two', ['mechanism']),
            deriveColor(base, -48, -0.02, 0.58, language === 'zh-CN' ? '模块三' : 'Module Three', ['mechanism']),
          ],
          'medium',
          'balanced',
        ),
      ],
    },
    {
      bucket: 'heatmap-endpoints',
      items: [
        recommendation(
          language,
          base,
          'heatmap-endpoints',
          language === 'zh-CN' ? '冷暖端点' : 'Cool-Warm Endpoints',
          [
            deriveColor(base, -95, -0.08, 0.92, language === 'zh-CN' ? '冷端' : 'Cool Endpoint', ['heatmap']),
            scientificColorFromOklch(
              { l: 0.9, c: 0.016, h: base.oklch.h, alpha: 1 },
              {
                id: createId('pair'),
                name: language === 'zh-CN' ? '中点' : 'Midpoint',
                source: { kind: 'generated', detail: 'pairing-midpoint' },
                tags: ['heatmap', 'midpoint'],
                usage: ['heatmap'],
                notes: '',
              },
            ),
            deriveColor(base, 115, 0.02, 0.88, language === 'zh-CN' ? '暖端' : 'Warm Endpoint', ['heatmap']),
          ],
          'high',
          'balanced',
        ),
      ],
    },
  ];

  return groups.map((group) => ({
    id: `${group.bucket}-${figureContext.type}`,
    label: pairingText(language, group.bucket, '').label,
    styleBucket: group.bucket,
    items: group.items,
  }));
}
