import { useEffect, useState } from 'react';
import { promptInstall, subscribeToInstallPrompt, type BeforeInstallPromptEvent } from '@/services/pwa-install-service';

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => subscribeToInstallPrompt(setInstallPrompt), []);

  return {
    canInstall: Boolean(installPrompt),
    install: () => promptInstall(installPrompt),
  };
}
