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
  imageUrl: string;
  order: number;
};

const SLOT_COUNT = 6;

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
            return {
              id: data.id || docSnap.id,
              instagramUrl: data.instagramUrl || '',
              imageUrl: data.imageUrl || '',
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

  const slots = useMemo(() => Array.from({ length: SLOT_COUNT }, (_, index) => items[index] || null), [items]);
  const instaHandle = settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic';

  return (
    <section ref={ref} className="fade-in-section border-t border-[#F2C7D8] bg-[#FFF0F6] py-16 md:py-28 lg:py-32" id="instagram">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-12">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D994B5]">Instagram</p>
          <h2 className="font-serif text-4xl font-light text-[#241820] md:text-5xl lg:text-6xl">
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#D994B5]">
              @{instaHandle}
            </a>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#7E6472]">
            Шинэ ирэлт, хэрэглээний санаа, өөртөө анхаарах жижигхэн мөчүүдийг эндээс хараарай.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
          {slots.map((slot, index) => {
            const hasImage = Boolean(slot?.imageUrl);
            const content = (
              <>
                {hasImage ? (
                  <img
                    src={slot!.imageUrl}
                    alt={`UJ Cosmetic Instagram ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF8FB] via-[#FFE6F0] to-[#FFF0F6]">
                    <span className="font-serif text-3xl text-[#D994B5]">UJ</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[#241820]/0 transition-colors duration-300 group-hover:bg-[#241820]/18" />
                <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="flex min-h-9 items-center justify-center rounded-[8px] bg-white/92 px-3 text-[11px] font-semibold text-[#241820] shadow-[0_10px_24px_rgba(91,46,67,0.12)]">
                    Instagram дээр үзэх
                  </span>
                </div>
              </>
            );

            return slot?.instagramUrl && hasImage ? (
              <a
                key={slot.id}
                href={slot.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-[12px] border border-white/70 bg-white shadow-[0_12px_28px_rgba(91,46,67,0.08)] md:rounded-[4px]"
              >
                {content}
              </a>
            ) : (
              <div
                key={`instagram-placeholder-${index}`}
                className="group relative aspect-square overflow-hidden rounded-[12px] border border-white/70 bg-white shadow-[0_12px_28px_rgba(91,46,67,0.06)] md:rounded-[4px]"
                aria-label="Instagram placeholder"
              >
                {content}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-[8px] bg-[#241820] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#D994B5] md:w-auto md:min-w-[240px]"
          >
            @{instaHandle} дагах
          </a>
        </div>
      </div>
    </section>
  );
}
