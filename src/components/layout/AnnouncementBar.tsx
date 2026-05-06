'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS } from '@/types';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [text, setText] = useState(DEFAULT_SETTINGS.announcementText);
  const [active, setActive] = useState(true);

  useEffect(() => {
    getSiteSettings().then(s => {
      if (s) {
        setText(s.announcementText);
        setActive(s.announcementActive);
      }
    }).catch(() => {
      // Fallback to defaults silently
    });
  }, []);

  if (!isVisible || !active) return null;

  return (
    <div className="relative bg-accent text-text-primary text-center py-2.5 px-12 text-xs tracking-wider font-medium">
      <p>{text}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-primary/70 hover:text-text-primary transition-colors"
        aria-label="Мэдэгдлийг хаах"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1L13 13M13 1L1 13" />
        </svg>
      </button>
    </div>
  );
}
