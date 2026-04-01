import type { AdjustmentDelta, AdjustmentHistoryEntry, AdjustmentState, ColorToken } from '@/domain/models';
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

export function shortestHueDelta(from: number, to: number) {
  let delta = normalizeHue(to) - normalizeHue(from);

  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }

  return delta;
}

export function createAdjustmentDelta(color: ColorToken, state: AdjustmentState): AdjustmentDelta {
  return {
    hue: state.locks.hue ? 0 : shortestHueDelta(color.oklch.h, state.hue),
    lightness: state.locks.lightness ? 0 : state.lightness - color.oklch.l,
    chroma: state.locks.chroma ? 0 : state.chroma - color.oklch.c,
    alpha: state.locks.alpha ? 0 : state.alpha - color.alpha,
  };
}

export function isZeroAdjustmentDelta(delta: AdjustmentDelta, epsilon = 0.0001) {
  return (
    Math.abs(delta.hue) < epsilon &&
    Math.abs(delta.lightness) < epsilon &&
    Math.abs(delta.chroma) < epsilon &&
    Math.abs(delta.alpha) < epsilon
  );
}

export function applyAdjustmentDelta(color: ColorToken, delta: AdjustmentDelta) {
  const next = scientificColorFromOklch(
    {
      h: normalizeHue(color.oklch.h + delta.hue),
      l: clamp(color.oklch.l + delta.lightness, 0.04, 0.98),
      c: clamp(color.oklch.c + delta.chroma, 0, 0.28),
      alpha: clamp(color.alpha + delta.alpha, 0, 1),
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

export function applyAdjustmentState(color: ColorToken, state: AdjustmentState) {
  return applyAdjustmentDelta(color, createAdjustmentDelta(color, state));
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
  anchorColor: ColorToken,
  before: ColorToken,
  after: ColorToken,
  delta: AdjustmentDelta,
): AdjustmentHistoryEntry {
  return {
    id: createId('history'),
    scope: 'palette',
    anchorColorId: anchorColor.id,
    anchorColorName: anchorColor.name,
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
    delta,
    createdAt: new Date().toISOString(),
  };
}
