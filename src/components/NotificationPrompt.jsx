import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button, Card } from './ui';

export const NotificationPrompt = ({ onEnable, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-6 right-6 w-80 z-50"
    >
      <Card className="bg-primary-800/95 backdrop-blur-xl border border-neutral-700 shadow-2xl">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <X size={14} className="text-neutral-500" />
        </button>

        <div className="p-4">
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
              onClick={onEnable}
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
        </div>
      </Card>
    </motion.div>
  );
};
