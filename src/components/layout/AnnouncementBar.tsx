'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS } from '@/types';
import { motion } from 'framer-motion';

function normalizeAnnouncement(value: string) {
  if (!value || value.includes('?')) {
    return 'Солонгосын чанартай beauty & wellness бүтээгдэхүүнийг таны гарт';
  }
  return value;
}

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [text, setText] = useState(normalizeAnnouncement(DEFAULT_SETTINGS.announcementText));
  const [active, setActive] = useState(true);

  useEffect(() => {
    getSiteSettings()
      .then(settings => {
        if (settings) {
          setText(normalizeAnnouncement(settings.announcementText));
          setActive(settings.announcementActive);
        }
      })
      .catch(() => {});
  }, []);

  if (!isVisible || !active) return null;

  return (
    <div className="relative overflow-hidden border-b border-[#F2C7D8] bg-[#FFE6F0] py-1.5 text-[#1F191C] md:py-2">
      <div className="max-content relative flex h-4 items-center">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap"
        >
          {[...Array(6)].map((_, index) => (
            <span key={index} className="mr-12 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7B6670]">
              {text} · Korea to Mongolia ·
            </span>
          ))}
        </motion.div>

        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-0 top-1/2 z-10 flex h-6 w-8 -translate-y-1/2 items-center justify-end bg-[#FFE6F0] text-[#7B6670] transition-colors hover:text-[#1F191C]"
          aria-label="Мэдэгдэл хаах"
        >
          <X size={12} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
