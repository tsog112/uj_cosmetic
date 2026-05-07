'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

type InstagramFeedItem = {
  id: string;
  imageUrl: string;
  instagramUrl?: string;
  order: number;
};

const SLOT_COUNT = 6;

export default function InstagramSection() {
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
              imageUrl: data.imageUrl || '',
              instagramUrl: data.instagramUrl || '',
              order: Number(data.order ?? 0),
            };
          })
          .filter(item => item.imageUrl)
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
    <section className="py-20 md:py-28 border-thin-t bg-white" id="instagram">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <p className="section-label">Instagram</p>
          <h2 className="section-heading">
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
          {slots.map((item, index) => {
            if (!item) {
              return (
                <div
                  key={`instagram-placeholder-${index}`}
                  className="aspect-square bg-[#FFD6E8] border border-[#FFB7D5]/40"
                  aria-label="Instagram placeholder"
                />
              );
            }

            const image = (
              <>
                <Image
                  src={item.imageUrl}
                  alt={`UJ Cosmetic Instagram ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </>
            );

            if (!item.instagramUrl) {
              return (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden bg-[#FFD6E8]"
                >
                  {image}
                </div>
              );
            }

            return (
              <a
                key={item.id}
                href={item.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden bg-[#FFD6E8]"
              >
                {image}
              </a>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-6 py-3 text-sm font-bold hover:bg-[#FFB7D5] hover:text-[#1A1A1A] transition-colors"
          >
            @uj_cosmetic дагаарай
          </a>
        </div>
      </div>
    </section>
  );
}
