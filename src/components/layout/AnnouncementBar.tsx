'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS } from '@/types';
import { motion } from 'framer-motion';

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
    }).catch(() => {});
  }, []);

  if (!isVisible || !active) return null;

  return (
    <div className="relative bg-sand-dark border-b border-border text-text-primary overflow-hidden py-2">
      <div className="max-content relative flex items-center h-4">
        <motion.div 
          animate={{ x: ["100%", "-100%"] }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="whitespace-nowrap flex gap-12"
        >
          <span className="editorial-label text-[9px]">{text}</span>
          <span className="editorial-label text-[9px] opacity-30">•</span>
          <span className="editorial-label text-[9px]">{text}</span>
          <span className="editorial-label text-[9px] opacity-30">•</span>
          <span className="editorial-label text-[9px]">{text}</span>
          <span className="editorial-label text-[9px] opacity-30">•</span>
          <span className="editorial-label text-[9px]">{text}</span>
          <span className="editorial-label text-[9px] opacity-30">•</span>
        </motion.div>

        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-sand-dark pl-4 text-text-primary/70 hover:text-text-primary transition-colors z-10"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M1 1L13 13M13 1L1 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
