'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export default function AnnouncementBar() {
  const { messages } = useLocale();
  const [visible, setVisible] = useState(true);
  const items = messages.announcement?.items?.length
    ? messages.announcement.items
    : [
        '50,000₮-өөс дээш захиалгад үнэгүй хүргэлт',
        'Улаанбаатар болон орон нутагт хүргэлттэй',
      ];

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('announcement-visibility-change', { detail: visible }));
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[80] flex h-9 w-full items-center overflow-hidden"
      style={{ background: 'var(--color-brand)' }}
      aria-label="Announcement"
    >
      <div
        className="pointer-events-none absolute right-0 top-0 z-[1] h-full w-14"
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-brand) 55%)' }}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 whitespace-nowrap pr-12" style={{ animation: 'marqueeBar 28s linear infinite' }}>
        <div className="flex shrink-0">
          {items.map((item, index) => (
            <span key={`a-${index}`} className="inline-flex items-center px-8 text-white text-xs font-semibold tracking-wide">
              {item}
              <span className="mx-6 opacity-40">&middot;</span>
            </span>
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {items.map((item, index) => (
            <span key={`b-${index}`} className="inline-flex items-center px-8 text-white text-xs font-semibold tracking-wide">
              {item}
              <span className="mx-6 opacity-40">&middot;</span>
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-2 top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-brand)] text-white/90 transition hover:bg-white/15"
        aria-label="Мэдэгдэл хаах"
      >
        <X size={15} strokeWidth={2} />
      </button>

      <style>{`
        @keyframes marqueeBar {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
