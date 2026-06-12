import { useState, useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Проверяем, установлено ли приложение уже
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true; // iOS Safari
      setIsAppInstalled(isStandalone);
    };

    checkInstalled();

    const handleBeforeInstall = (e: Event) => {
      // Предотвращаем показ стандартного промпта браузера
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed', error);
      return false;
    }
  };

  const canInstall = !!deferredPrompt && !isAppInstalled;

  return { canInstall, promptInstall, isAppInstalled };
}
