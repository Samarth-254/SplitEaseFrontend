import { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Capture install prompt when available
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('✅ Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const promptInstall = async (source = 'unknown') => {
    // ✅ If browser prompt available, show it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`User ${outcome} the install`);
        
        ReactGA.event({
          category: 'PWA',
          action: outcome === 'accepted' ? 'Installed' : 'Dismissed',
          label: source
        });
        
        setDeferredPrompt(null);
        return outcome;
      } catch (error) {
        console.error('Install prompt error:', error);
        return 'error';
      }
    }
    
    // ✅ No prompt? Show manual instructions
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);
    
    if (isIOS) {
      alert('📱 Install on iPhone:\n\n1. Tap Share (⎙)\n2. Add to Home Screen');
    } else if (isAndroid) {
      alert('📱 Install on Android:\n\n1. Tap menu (⋮)\n2. Install app');
    } else {
      alert('💻 Install:\n\n1. Click menu (⋮)\n2. Install SplitEase\n\nTip: Refresh page if option missing');
    }
    
    ReactGA.event({
      category: 'PWA',
      action: 'Manual Instructions',
      label: source
    });
    
    return 'manual';
  };

  return {
    isInstallable: true, // ✅ ALWAYS TRUE - button always shows
    promptInstall
  };
};
