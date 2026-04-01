import { useSyncExternalStore } from 'react';

export interface StorageStatusState {
  degraded: boolean;
  message: string | null;
}

let state: StorageStatusState = {
  degraded: false,
  message: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function markStorageDegraded(message: string) {
  state = {
    degraded: true,
    message,
  };
  emit();
}

export function clearStorageDegraded() {
  if (!state.degraded && !state.message) {
    return;
  }

  state = {
    degraded: false,
    message: null,
  };
  emit();
}

export function getStorageStatus() {
  return state;
}

export function subscribeToStorageStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStorageStatus() {
  return useSyncExternalStore(subscribeToStorageStatus, getStorageStatus, getStorageStatus);
}
