import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export const InstallInstructionsModal = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const instructions = {
    android: {
      icon: <Smartphone className="text-green-500" size={32} />,
      title: 'Install on Android',
      steps: [
        'Tap the three dots (⋮) at top right',
        'Tap "Add to Home screen"',
        'Tap "Install" to confirm'
      ]
    },
    ios: {
      icon: <Smartphone className="text-blue-500" size={32} />,
      title: 'Install on iPhone',
      steps: [
        'Tap the Share button (⎙) at bottom',
        'Scroll and tap "Add to Home Screen"',
        'Tap "Add" to confirm'
      ]
    },
    desktop: {
      icon: <Monitor className="text-orange-500" size={32} />,
      title: 'Install on Desktop',
      steps: [
        'Click menu (⋮) at top right',
        'Click "Install SplitEase"',
        'Click "Install" to confirm'
      ]
    }
  };

  const currentInstructions = instructions[platform];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-b border-neutral-800 p-4 text-center">
            <div className="flex justify-center mb-2">
              {currentInstructions.icon}
            </div>
            <h2 className="text-lg font-bold text-neutral-100">
              {currentInstructions.title}
            </h2>
          </div>

          {/* Steps */}
          <div className="p-4 space-y-3">
            {currentInstructions.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <span className="text-sm font-bold text-orange-500">{index + 1}</span>
                </div>

                {/* Step Text */}
                <p className="text-sm text-neutral-200 leading-relaxed pt-0.5">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-800 p-4">
            <p className="text-xs text-neutral-500 text-center mb-3">
              Can't find the option? Try refreshing the page.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
