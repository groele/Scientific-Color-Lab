export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function subscribeToInstallPrompt(
  onPrompt: (event: BeforeInstallPromptEvent | null) => void,
) {
  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    onPrompt(event as BeforeInstallPromptEvent);
  };

  const handleInstalled = () => onPrompt(null);

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleInstalled);

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleInstalled);
  };
}

export async function promptInstall(event: BeforeInstallPromptEvent | null) {
  if (!event) {
    return false;
  }

  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === 'accepted';
}
