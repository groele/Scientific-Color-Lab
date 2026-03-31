import { useEffect, useState } from 'react';
import { promptInstall, subscribeToInstallPrompt, type BeforeInstallPromptEvent } from '@/services/pwa-install-service';

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
    setIsInstalled(standalone);

    const handleInstalled = () => setIsInstalled(true);
    window.addEventListener('appinstalled', handleInstalled);
    const unsubscribe = subscribeToInstallPrompt(setInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
      unsubscribe();
    };
  }, []);

  return {
    canInstall: Boolean(installPrompt) && !isInstalled,
    isInstalled,
    install: () => promptInstall(installPrompt),
  };
}
