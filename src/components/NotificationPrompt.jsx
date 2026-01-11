import { motion } from 'framer-motion';
import { Bell, X, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button, Card } from './ui';

export const NotificationPrompt = ({ onEnable, onDismiss }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'denied'

  const handleEnable = async () => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await onEnable();
      
      // Check if user blocked or granted permission
      if (result === 'granted') {
        setStatus('success');
        // Auto dismiss after showing success
        setTimeout(() => {
          onDismiss();
        }, 1500);
      } else if (result === 'denied') {
        setStatus('denied');
        // Auto dismiss after showing error
        setTimeout(() => {
          onDismiss();
        }, 3000);
      } else {
        // Default permission (user closed prompt without action)
        setStatus('idle');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Notification enable error:', error);
      setStatus('denied');
      setTimeout(() => {
        onDismiss();
      }, 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-6 right-6 w-80 z-50"
    >
      <Card className="bg-primary-800/95 backdrop-blur-xl border border-neutral-700 shadow-2xl">
        {status === 'idle' && (
          <button
            onClick={onDismiss}
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
                  <Bell size={18} className="text-orange-500" />
                </div>
                <h3 className="font-semibold text-white text-sm">
                  Never miss an expense!
                </h3>
              </div>

              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Get notified when expenses are added, even when app is closed.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={handleEnable}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-3"
                >
                  Enable
                </Button>
                <Button
                  onClick={onDismiss}
                  variant="secondary"
                  className="px-4 text-sm py-2"
                >
                  Later
                </Button>
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
                  <Bell size={24} className="text-orange-500" />
                </motion.div>
              </div>
              <p className="text-sm text-neutral-300 font-medium">Enabling notifications...</p>
              <p className="text-xs text-neutral-500 mt-1">Please allow in your browser</p>
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
              <p className="text-sm text-neutral-300 font-medium">Notifications enabled!</p>
              <p className="text-xs text-neutral-500 mt-1">You'll be notified of new expenses</p>
            </motion.div>
          )}

          {/* DENIED STATE */}
          {status === 'denied' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <p className="text-sm text-neutral-300 font-medium">Notifications blocked</p>
              <p className="text-xs text-neutral-500 mt-1 text-center px-2">
                Enable in browser settings to get notifications
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
