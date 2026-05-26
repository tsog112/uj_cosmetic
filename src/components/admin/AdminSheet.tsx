'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type AdminSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function AdminSheet({ open, onClose, children }: AdminSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-[30px] bg-white pb-[env(safe-area-inset-bottom)]"
          >
            <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-[#ecd0dc]" />
            <div className="px-5 pb-7">
              <button
                type="button"
                onClick={onClose}
                className="mb-3 ml-auto flex rounded-full bg-[var(--color-brand-secondary)] p-2 text-[var(--color-brand-text)]"
                aria-label="Хаах"
              >
                <X size={18} />
              </button>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
