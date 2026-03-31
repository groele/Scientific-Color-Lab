import { registerSW } from 'virtual:pwa-register';

export function registerScientificColorLabPwa() {
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
    });
  }
}
