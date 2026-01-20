import { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
    };

    const handleAppInstalled = () => {
      
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
    // ✅ If browser prompt available, show it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        
        
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
    
    // ✅ No prompt? Show professional modal
    setShowInstructionsModal(true);
    
    ReactGA.event({
      category: 'PWA',
      action: 'Manual Instructions Modal Shown',
      label: source
    });
    
    return 'manual';
  };

  const closeInstructionsModal = () => {
    setShowInstructionsModal(false);
  };

  return {
    isInstallable: true,
    promptInstall,
    showInstructionsModal,
    closeInstructionsModal
  };
};
