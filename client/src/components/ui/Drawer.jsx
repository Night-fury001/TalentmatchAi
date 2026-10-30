import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function Drawer({ isOpen, onClose, title, children, side = 'right', widthClassName = 'max-w-md' }) {
  if (typeof document === 'undefined') return null;

  const offscreenX = side === 'right' ? '100%' : '-100%';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className={`relative ml-auto ${side === 'left' ? 'mr-auto ml-0' : ''} h-full w-full ${widthClassName} bg-white shadow-2xl overflow-y-auto`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/95 backdrop-blur px-6 py-4">
              {title && <h3 className="text-lg font-semibold text-ink-900">{title}</h3>}
              <button
                onClick={onClose}
                className="ml-auto rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
