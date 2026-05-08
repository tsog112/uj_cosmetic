'use client';

import { DragEvent, useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type InstagramSlot = {
  id: string;
  instagramUrl: string;
  embedUrl: string | null;
};

const SLOT_COUNT = 6;

function getEmbedUrl(instagramUrl: string): string | null {
  const match = instagramUrl.match(
    /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/
  );
  if (!match) return null;
  return `https://www.instagram.com/p/${match[1]}/embed/`;
}

function createEmptySlots(): InstagramSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    id: `slot-${index + 1}`,
    instagramUrl: '',
    embedUrl: null,
  }));
}

export default function AdminInstagramPage() {
  const [slots, setSlots] = useState<InstagramSlot[]>(createEmptySlots);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSaved() {
      try {
        const snap = await getDocs(query(collection(db, 'instagramFeed'), orderBy('order', 'asc')));
        if (snap.empty) return;

        const saved = snap.docs.slice(0, SLOT_COUNT).map(d => {
          const data = d.data();
          const instagramUrl = data.instagramUrl || '';
          return {
            id: d.id,
            instagramUrl,
            embedUrl: data.embedUrl || getEmbedUrl(instagramUrl),
          };
        });

        while (saved.length < SLOT_COUNT) {
          saved.push({
            id: `slot-${saved.length + 1}`,
            instagramUrl: '',
            embedUrl: null,
          });
        }

        setSlots(saved);
      } finally {
        setLoading(false);
      }
    }

    fetchSaved().catch(() => setLoading(false));
  }, []);

  function handleUrlChange(slotIndex: number, value: string) {
    const embedUrl = getEmbedUrl(value);
    setSlots(prev => prev.map((slot, index) =>
      index === slotIndex ? { ...slot, instagramUrl: value, embedUrl } : slot
    ));
  }

  function clearSlot(slotIndex: number) {
    setSlots(prev => prev.map((slot, index) =>
      index === slotIndex ? { ...slot, instagramUrl: '', embedUrl: null } : slot
    ));
  }

  const handleDrop = (targetSlotId: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggedSlotId || draggedSlotId === targetSlotId) return;

    const draggedIndex = slots.findIndex(slot => slot.id === draggedSlotId);
    const targetIndex = slots.findIndex(slot => slot.id === targetSlotId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const nextSlots = [...slots];
    const [draggedSlot] = nextSlots.splice(draggedIndex, 1);
    nextSlots.splice(targetIndex, 0, draggedSlot);
    setSlots(nextSlots);
    setDraggedSlotId(null);
  };

  async function handleSave() {
    setSaving(true);
    try {
      for (const [index, slot] of slots.entries()) {
        await setDoc(
          doc(db, 'instagramFeed', slot.id),
          {
            id: slot.id,
            instagramUrl: slot.instagramUrl || '',
            embedUrl: slot.embedUrl || null,
            order: index + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      alert('Хадгалагдлаа ✓');
    } catch (e: any) {
      alert(`Алдаа: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: SLOT_COUNT }, (_, index) => (
            <div key={index} className="h-80 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instagram зургууд</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FFB7D5] hover:bg-[#f5a0c5] text-[#1A1A1A] px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            draggable
            onDragStart={() => setDraggedSlotId(slot.id)}
            onDragOver={event => event.preventDefault()}
            onDrop={event => handleDrop(slot.id, event)}
            onDragEnd={() => setDraggedSlotId(null)}
            className="bg-sand border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <div className="aspect-square bg-pink-100 rounded-lg overflow-hidden relative">
              {slot.embedUrl ? (
                <iframe
                  src={slot.embedUrl}
                  className="w-full h-full border-0 scale-[0.6] origin-top-left"
                  style={{ width: '167%', height: '167%' }}
                  scrolling="no"
                  allowTransparency={true}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-300 gap-2">
                  <span className="text-4xl">+</span>
                  <span className="text-xs text-center px-4">Instagram линк оруулна уу</span>
                </div>
              )}
            </div>

            <input
              type="url"
              placeholder="https://www.instagram.com/p/xxx/"
              value={slot.instagramUrl}
              onChange={event => handleUrlChange(index, event.target.value)}
              className="w-full mt-2 px-3 py-2 text-xs border border-pink-200 rounded focus:outline-none focus:border-pink-400"
            />

            {slot.instagramUrl && (
              <button
                type="button"
                onClick={() => clearSlot(index)}
                className="text-xs text-gray-400 hover:text-red-400 mt-1"
              >
                × Цэвэрлэх
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
