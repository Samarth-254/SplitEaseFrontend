import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Monitor, Chrome, MoreVertical, Share, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export const InstallInstructionsModal = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    // Detect platform
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
      icon: <Smartphone className="text-green-500" size={48} />,
      title: 'Install on Android',
      steps: [
        {
          icon: <MoreVertical size={24} />,
          text: 'Tap the three dots',
          detail: 'Top right corner of Chrome browser'
        },
        {
          icon: <Plus size={24} />,
          text: 'Tap "Add to Home screen"',
          detail: 'Or "Install app" if available'
        },
        {
          icon: <Chrome size={24} />,
          text: 'Tap "Install"',
          detail: 'Confirm installation'
        }
      ]
    },
    ios: {
      icon: <Smartphone className="text-blue-500" size={48} />,
      title: 'Install on iPhone/iPad',
      steps: [
        {
          icon: <Share size={24} />,
          text: 'Tap the Share button',
          detail: 'Bottom of Safari (square with arrow)'
        },
        {
          icon: <Plus size={24} />,
          text: 'Scroll and tap "Add to Home Screen"',
          detail: 'You may need to scroll down'
        },
        {
          icon: <Chrome size={24} />,
          text: 'Tap "Add"',
          detail: 'Top right to confirm'
        }
      ]
    },
    desktop: {
      icon: <Monitor className="text-orange-500" size={48} />,
      title: 'Install on Desktop',
      steps: [
        {
          icon: <MoreVertical size={24} />,
          text: 'Click browser menu',
          detail: 'Three dots (⋮) or (•••) at top right'
        },
        {
          icon: <Plus size={24} />,
          text: 'Click "Install SplitEase"',
          detail: 'Or "Install app" option'
        },
        {
          icon: <Chrome size={24} />,
          text: 'Click "Install"',
          detail: 'Confirm installation in popup'
        }
      ]
    }
  };

  const currentInstructions = instructions[platform];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors z-10"
          >
            <X size={20} className="text-neutral-400" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-b border-neutral-800 p-6 text-center">
            <div className="flex justify-center mb-4">
              {currentInstructions.icon}
            </div>
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">
              {currentInstructions.title}
            </h2>
            <p className="text-sm text-neutral-400">
              Follow these steps to install SplitEase
            </p>
          </div>

          {/* Steps */}
          <div className="p-6 space-y-4">
            {currentInstructions.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50 hover:border-neutral-600 transition-colors"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center border border-orange-500/30">
                  <span className="text-lg font-bold text-orange-500">{index + 1}</span>
                </div>

                {/* Step Icon & Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-orange-400">
                      {step.icon}
                    </div>
                  </div>
                  <p className="text-neutral-100 font-semibold mb-1">
                    {step.text}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-neutral-800/30 border-t border-neutral-800 p-4 text-center">
            <p className="text-xs text-neutral-500 mb-3">
              Can't find the option? Try refreshing the page or clearing browser cache.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
