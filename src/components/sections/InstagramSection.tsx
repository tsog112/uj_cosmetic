'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';
import { useFadeIn } from '@/hooks/useFadeIn';

type InstagramFeedItem = {
  id: string;
  instagramUrl: string;
  embedUrl: string | null;
  order: number;
};

const SLOT_COUNT = 6;

function getEmbedUrl(instagramUrl: string): string | null {
  const match = instagramUrl.match(
    /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/
  );
  if (!match) return null;
  return `https://www.instagram.com/p/${match[1]}/embed/`;
}

export default function InstagramSection() {
  const ref = useFadeIn();
  const [items, setItems] = useState<InstagramFeedItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let mounted = true;

    async function loadInstagramFeed() {
      const [settingsData, feedSnap] = await Promise.all([
        getSiteSettings(),
        getDocs(query(collection(db, 'instagramFeed'), orderBy('order', 'asc'))),
      ]);

      if (!mounted) return;

      if (settingsData) setSettings(settingsData);
      setItems(
        feedSnap.docs
          .map(docSnap => {
            const data = docSnap.data();
            const instagramUrl = data.instagramUrl || '';
            return {
              id: data.id || docSnap.id,
              instagramUrl,
              embedUrl: data.embedUrl || getEmbedUrl(instagramUrl),
              order: Number(data.order ?? 0),
            };
          })
          .slice(0, SLOT_COUNT)
      );
    }

    loadInstagramFeed().catch(() => {
      if (mounted) setItems([]);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const slots = useMemo(
    () => Array.from({ length: SLOT_COUNT }, (_, index) => items[index] || null),
    [items]
  );
  const instaHandle = settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic';

  return (
    <section ref={ref} className="py-16 md:py-28 lg:py-32 fade-in-section border-t border-[#F2A8C8]/40 bg-[#FFF0F6]" id="instagram">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-left md:text-center mb-8 md:mb-14">
          <p className="editorial-label mb-3 md:mb-5">Instagram</p>
          <h2 className="text-[28px] md:font-serif md:text-4xl lg:text-5xl font-semibold md:font-light text-charcoal">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              @{instaHandle}
            </a>
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {slots.map((slot, index) => (
            slot?.embedUrl && slot.instagramUrl ? (
              <a
                key={slot.id}
                href={slot.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden relative group bg-pink-100 rounded-[12px] md:rounded-none"
              >
                <iframe
                  src={slot.embedUrl}
                  className="w-full border-0 pointer-events-none"
                  style={{
                    height: '300%',
                    marginTop: '-50%',
                    transform: 'scale(1)',
                  }}
                  scrolling="no"
                  allowTransparency={true}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">
                    Instagram-д үзэх ↗
                  </span>
                </div>
              </a>
            ) : (
              <div
                key={`instagram-placeholder-${index}`}
                className="aspect-square bg-pink-100 rounded-[12px] md:rounded-none"
                aria-label="Instagram placeholder"
              />
            )
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full md:w-auto items-center justify-center rounded-[10px] md:rounded-none bg-[#1A1A1A] text-white px-6 py-3 text-sm font-bold hover:bg-[#FFB7D5] hover:text-[#1A1A1A] transition-colors"
          >
            @uj_cosmetic дагаарай
          </a>
        </div>
      </div>
    </section>
  );
}
