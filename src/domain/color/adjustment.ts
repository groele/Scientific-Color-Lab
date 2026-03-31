import type { AdjustmentHistoryEntry, AdjustmentState, ColorToken } from '@/domain/models';
import { createId, normalizeHue, scientificColorFromOklch } from '@/domain/color/convert';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createAdjustmentState(color: ColorToken): AdjustmentState {
  return {
    hue: color.oklch.h,
    lightness: color.oklch.l,
    chroma: color.oklch.c,
    alpha: color.alpha,
    locks: {
      hue: false,
      lightness: false,
      chroma: false,
      alpha: false,
    },
  };
}

export function applyAdjustmentState(color: ColorToken, state: AdjustmentState) {
  const next = scientificColorFromOklch(
    {
      h: normalizeHue(state.locks.hue ? color.oklch.h : state.hue),
      l: clamp(state.locks.lightness ? color.oklch.l : state.lightness, 0.04, 0.98),
      c: clamp(state.locks.chroma ? color.oklch.c : state.chroma, 0, 0.28),
      alpha: clamp(state.locks.alpha ? color.alpha : state.alpha, 0, 1),
    },
    {
      id: color.id,
      name: color.name,
      source: color.source,
      tags: color.tags,
      usage: color.usage,
      notes: color.notes,
    },
  );

  return {
    ...next,
    copyLabel: color.copyLabel,
    favoriteable: color.favoriteable,
    insertable: color.insertable,
    createdAt: color.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export function nudgeAdjustment(state: AdjustmentState, key: keyof Omit<AdjustmentState, 'locks'>, delta: number): AdjustmentState {
  if (key === 'hue') {
    return { ...state, hue: normalizeHue(state.hue + delta) };
  }

  if (key === 'alpha') {
    return { ...state, alpha: clamp(state.alpha + delta, 0, 1) };
  }

  return {
    ...state,
    [key]: clamp(state[key] + delta, 0, key === 'lightness' ? 1 : 0.28),
  };
}

export function createAdjustmentHistoryEntry(
  colorId: string,
  before: ColorToken,
  after: ColorToken,
): AdjustmentHistoryEntry {
  return {
    id: createId('history'),
    colorId,
    before: {
      l: before.oklch.l,
      c: before.oklch.c,
      h: before.oklch.h,
      alpha: before.alpha,
    },
    after: {
      l: after.oklch.l,
      c: after.oklch.c,
      h: after.oklch.h,
      alpha: after.alpha,
    },
    createdAt: new Date().toISOString(),
  };
}
