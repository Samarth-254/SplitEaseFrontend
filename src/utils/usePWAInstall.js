import { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('✅ Install prompt captured');
    };

    // Track installation
    const handleAppInstalled = () => {
      console.log('✅ App installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (source = 'unknown') => {
    if (!deferredPrompt) {
      console.log('❌ No install prompt available');
      return 'unavailable';
    }

    try {
      // Show native install prompt
      await deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`Install outcome: ${outcome} from ${source}`);
      
      if (outcome === 'accepted') {
        ReactGA.event({
          category: 'PWA',
          action: 'Installed',
          label: source
        });
        
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      } else {
        ReactGA.event({
          category: 'PWA',
          action: 'Dismissed',
          label: source
        });
        
        // Prompt consumed - won't work again
        setDeferredPrompt(null);
        return 'dismissed';
      }
    } catch (error) {
      console.error('Install error:', error);
      
      ReactGA.event({
        category: 'PWA',
        action: 'Install Failed',
        label: `${source} - ${error.message}`
      });
      
      setDeferredPrompt(null);
      return 'error';
    }
  };

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    promptInstall
  };
};
