'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type AdminBulkSelectionBarProps = {
  count: number;
  /** Жишээ: захиалга, бараа, хэрэглэгч */
  unitLabel: string;
  onClear: () => void;
  onAction: () => void;
  actionLabel?: string;
};

/** Захиалга хуудастай ижил — дээд ягаан bulk сонголтын мөр. */
export default function AdminBulkSelectionBar({
  count,
  unitLabel,
  onClear,
  onAction,
  actionLabel = 'Үйлдэл хийх',
}: AdminBulkSelectionBarProps) {
  if (count < 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className="fixed top-0 left-0 right-0 z-[200] flex h-14 items-center justify-between bg-[var(--color-brand)] px-4 text-white shadow-[var(--shadow-md)]"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Сонголт цуцлах"
          >
            <X size={16} />
          </button>
          <span className="text-[13px] font-bold tracking-wide">
            {count} {unitLabel} сонгогдсон
          </span>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="flex h-9 items-center rounded-full bg-white px-5 text-[12px] font-extrabold text-[var(--color-brand)] shadow-sm transition-transform active:scale-95"
        >
          {actionLabel}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
