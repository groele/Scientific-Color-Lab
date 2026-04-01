import { registerSW } from 'virtual:pwa-register';
import { setPwaRuntimeState } from '@/services/pwa-runtime-service';

export function registerScientificColorLabPwa() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setPwaRuntimeState({
          needRefresh: true,
          updateAvailableAt: new Date().toISOString(),
          applyUpdate: async () => {
            await updateSW(true);
          },
        });
      },
      onOfflineReady() {
        setPwaRuntimeState({
          offlineReady: true,
        });
      },
    });
  }
}
