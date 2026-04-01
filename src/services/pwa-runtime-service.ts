import { useSyncExternalStore } from 'react';

export interface PwaRuntimeState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateAvailableAt?: string;
  applyUpdate: (() => Promise<void>) | null;
}

let state: PwaRuntimeState = {
  needRefresh: false,
  offlineReady: false,
  applyUpdate: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setPwaRuntimeState(partial: Partial<PwaRuntimeState>) {
  state = {
    ...state,
    ...partial,
  };
  emit();
}

export function resetPwaRuntimeState() {
  state = {
    needRefresh: false,
    offlineReady: false,
    applyUpdate: null,
  };
  emit();
}

export function getPwaRuntimeState() {
  return state;
}

export function subscribeToPwaRuntime(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePwaRuntimeStatus() {
  return useSyncExternalStore(subscribeToPwaRuntime, getPwaRuntimeState, getPwaRuntimeState);
}
