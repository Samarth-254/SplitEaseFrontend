import { motion } from 'framer-motion';
import { Smartphone, X, Check, Download, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import ReactGA from 'react-ga4';
import { Card } from './ui';
import { usePWAInstall } from '../utils/usePWAInstall';

export const InstallPrompt = ({ onDismiss }) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const { promptInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    setStatus('loading');
    
    ReactGA.event({
      category: 'PWA',
      action: 'Install Clicked from Prompt',
      label: 'Bottom Banner'
    });

    const result = await promptInstall('Bottom Banner');
    
    if (result === 'accepted') {
      setStatus('success');
      setTimeout(() => {
        onDismiss();
      }, 2000);
    } else if (result === 'dismissed') {
      setStatus('idle');
    } else {
      setStatus('error');
      setTimeout(() => {
        onDismiss();
      }, 3000);
    }
  };

  const handleDismiss = () => {
    ReactGA.event({
      category: 'PWA',
      action: 'Install Prompt Dismissed',
      label: 'Bottom Banner'
    });
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-6 left-6 w-80 sm:w-72 z-50"
    >
      <Card className="bg-primary-800/95 backdrop-blur-xl border border-neutral-700 shadow-2xl">
        {status === 'idle' && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X size={14} className="text-neutral-500" />
          </button>
        )}

        <div className="p-4">
          {/* IDLE STATE */}
          {status === 'idle' && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={18} className="text-orange-500" />
                </div>
                <h3 className="font-semibold text-white text-sm">
                  Install SplitEase
                </h3>
              </div>

              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
               Add SplitEase to your home screen for fast access, offline support, and real-time notifications.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Later
                </button>
              </div>
            </>
          )}

          {/* LOADING STATE */}
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Download size={24} className="text-orange-500" />
                </motion.div>
              </div>
              <p className="text-sm text-neutral-300 font-medium">Installing app...</p>
              <p className="text-xs text-neutral-500 mt-1">Please confirm in your browser</p>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mb-3">
                <Check size={24} className="text-green-500" />
              </div>
              <p className="text-sm text-neutral-300 font-medium">App installed!</p>
              <p className="text-xs text-neutral-500 mt-1">You can now use it offline</p>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <p className="text-sm text-neutral-300 font-medium">Install unavailable</p>
              <p className="text-xs text-neutral-500 mt-1 text-center px-2">
                Try from your browser menu or check if already installed
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
