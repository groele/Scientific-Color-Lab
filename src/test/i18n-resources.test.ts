import { describe, expect, it } from 'vitest';
import { enResources } from '@/i18n/resources-en';
import { zhCnResources } from '@/i18n/resources-zh-cn';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n resources', () => {
  it('keeps the en and zh-CN keysets aligned', () => {
    const enKeys = flattenKeys(enResources).sort();
    const zhKeys = flattenKeys(zhCnResources).sort();

    expect(zhKeys).toEqual(enKeys);
  });

  it('ships readable Chinese copy for core screens', () => {
    expect(zhCnResources.settings.title).toBe('偏好设置');
    expect(zhCnResources.exports.title).toBe('导出中心');
    expect(zhCnResources.analyzer.title).toBe('图像配色分析器');
    expect(zhCnResources.common.loadingWorkspace).toBe('正在恢复本地工作区...');
  });
});
