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
  const match = instagramUrl.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
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
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function fetchSaved() {
      try {
        const snap = await getDocs(query(collection(db, 'instagramFeed'), orderBy('order', 'asc')));
        if (snap.empty) return;

        const saved = snap.docs.slice(0, SLOT_COUNT).map(slotDoc => {
          const data = slotDoc.data();
          const instagramUrl = data.instagramUrl || '';
          return {
            id: slotDoc.id,
            instagramUrl,
            embedUrl: data.embedUrl || getEmbedUrl(instagramUrl),
          };
        });

        while (saved.length < SLOT_COUNT) {
          saved.push({ id: `slot-${saved.length + 1}`, instagramUrl: '', embedUrl: null });
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
    setSlots(prev => prev.map((slot, index) => index === slotIndex ? { ...slot, instagramUrl: value, embedUrl } : slot));
  }

  function clearSlot(slotIndex: number) {
    setSlots(prev => prev.map((slot, index) => index === slotIndex ? { ...slot, instagramUrl: '', embedUrl: null } : slot));
  }

  function handleDrop(targetSlotId: string, event: DragEvent<HTMLDivElement>) {
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
  }

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
      setToast('Instagram зураг хадгалагдлаа.');
      setTimeout(() => setToast(''), 3000);
    } catch (error: any) {
      setToast(`Алдаа гарлаа: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#FFD6E8] w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: SLOT_COUNT }, (_, index) => <div key={index} className="aspect-square bg-[#FFF0F6]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {toast && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[120] px-4 py-3 bg-white border border-[#FFB7D5] text-sm shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Нүүр хуудасны feed</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Instagram</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 min-h-11 px-4 md:px-5 rounded-[10px] bg-[#1A1A1A] text-white text-sm disabled:opacity-50 shadow-[0_10px_24px_rgba(26,26,26,0.12)]"
        >
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Слот</p>
          <p className="mt-1 text-xl font-semibold">{SLOT_COUNT}</p>
        </div>
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-[#FFF0F6] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Идэвхтэй</p>
          <p className="mt-1 text-xl font-semibold">{slots.filter(slot => slot.embedUrl).length}</p>
        </div>
        <div className="rounded-[14px] border border-[#F1D28A]/70 bg-[#FFF9EC] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#9A6A14]">Хоосон</p>
          <p className="mt-1 text-xl font-semibold">{slots.filter(slot => !slot.embedUrl).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            draggable
            onDragStart={() => setDraggedSlotId(slot.id)}
            onDragOver={event => event.preventDefault()}
            onDrop={event => handleDrop(slot.id, event)}
            onDragEnd={() => setDraggedSlotId(null)}
            className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-3 md:p-4 shadow-[0_8px_24px_rgba(26,26,26,0.045)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-[#8B6B78]">Слот {index + 1}</span>
              <span className="text-[13px] text-[#8B6B78] cursor-move">⠿</span>
            </div>

            <div className="aspect-square rounded-[12px] bg-[#FFF0F6] overflow-hidden relative border border-[#F2A8C8]/30">
              {slot.embedUrl ? (
                <iframe
                  src={slot.embedUrl}
                  className="w-full h-full border-0 scale-[0.6] origin-top-left"
                  style={{ width: '167%', height: '167%' }}
                  scrolling="no"
                  allowTransparency
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#F2A8C8] gap-2">
                  <span className="text-4xl font-light">+</span>
                  <span className="text-xs text-center px-4">Instagram линк оруулна уу</span>
                </div>
              )}
            </div>

            <input
              type="url"
              placeholder="https://www.instagram.com/p/xxx/"
              value={slot.instagramUrl}
              onChange={event => handleUrlChange(index, event.target.value)}
              className="w-full mt-3 min-h-11 rounded-[10px] px-3 text-xs border border-[#F2A8C8]/60 bg-[#FFF8FB] outline-none focus:border-[#FFB7D5] focus:bg-white"
            />

            {slot.instagramUrl && (
              <button type="button" onClick={() => clearSlot(index)} className="mt-2 text-xs text-[#8B6B78] hover:text-[#A14E4E]">
                Цэвэрлэх
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
