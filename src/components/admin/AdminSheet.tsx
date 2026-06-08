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
            className="admin-sheet fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          >
            <div className="admin-sheet-handle" />
            <div className="admin-sheet-body px-5 pb-7 md:px-8 md:pb-10">
              <button
                type="button"
                onClick={onClose}
                className="mb-3 ml-auto flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
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
