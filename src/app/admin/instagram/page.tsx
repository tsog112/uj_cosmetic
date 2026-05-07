'use client';

import { ChangeEvent, DragEvent, useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app, db } from '@/lib/firebase';

type InstagramSlot = {
  id: string;
  instagramUrl: string;
  imageUrl: string;
  loading: boolean;
  error: string;
};

const SLOT_COUNT = 6;
const storage = getStorage(app);

function createEmptySlots(): InstagramSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    id: `slot-${index + 1}`,
    instagramUrl: '',
    imageUrl: '',
    loading: false,
    error: '',
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

        const saved = snap.docs.slice(0, SLOT_COUNT).map(d => ({
          id: d.id,
          instagramUrl: d.data().instagramUrl || '',
          imageUrl: d.data().imageUrl || '',
          loading: false,
          error: '',
        }));

        while (saved.length < SLOT_COUNT) {
          saved.push({
            id: `slot-${saved.length + 1}`,
            instagramUrl: '',
            imageUrl: '',
            loading: false,
            error: '',
          });
        }

        setSlots(saved);
      } finally {
        setLoading(false);
      }
    }

    fetchSaved().catch(() => setLoading(false));
  }, []);

  async function fetchInstagramPreview(slotIndex: number, url: string) {
    if (!url || !url.includes('instagram.com')) return;

    setSlots(prev => prev.map((slot, index) =>
      index === slotIndex ? { ...slot, loading: true, error: '' } : slot
    ));

    try {
      const res = await fetch(`/api/instagram-preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.thumbnailUrl) {
        setSlots(prev => prev.map((slot, index) =>
          index === slotIndex ? { ...slot, imageUrl: data.thumbnailUrl, loading: false } : slot
        ));
      } else {
        setSlots(prev => prev.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                loading: false,
                error: 'Зураг автоматаар татагдсангүй. Доороос зургаа гараар оруулна уу.',
              }
            : slot
        ));
      }
    } catch {
      setSlots(prev => prev.map((slot, index) =>
        index === slotIndex ? { ...slot, loading: false, error: 'Алдаа гарлаа' } : slot
      ));
    }
  }

  useEffect(() => {
    const timers = slots.map((slot, index) => {
      if (!slot.instagramUrl) return null;
      return setTimeout(() => fetchInstagramPreview(index, slot.instagramUrl), 800);
    });

    return () => timers.forEach(timer => timer && clearTimeout(timer));
  }, [slots.map(slot => slot.instagramUrl).join(',')]);

  async function handleManualUpload(slotIndex: number, file: File | undefined) {
    if (!file) return;

    setSlots(prev => prev.map((slot, index) =>
      index === slotIndex ? { ...slot, loading: true, error: '' } : slot
    ));

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `instagram/slot-${slotIndex + 1}/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      setSlots(prev => prev.map((slot, index) =>
        index === slotIndex ? { ...slot, imageUrl, loading: false, error: '' } : slot
      ));
    } catch {
      setSlots(prev => prev.map((slot, index) =>
        index === slotIndex ? { ...slot, loading: false, error: 'Зураг оруулахад алдаа гарлаа.' } : slot
      ));
    }
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
            imageUrl: slot.imageUrl || '',
            instagramUrl: slot.instagramUrl || '',
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
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#FFD6E8] border border-dashed border-[#FFB7D5] flex items-center justify-center">
              {slot.loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FFB7D5] rounded-full animate-spin" />
                </div>
              )}

              {slot.imageUrl && !slot.loading && (
                <img
                  src={slot.imageUrl}
                  alt={`Instagram ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              )}

              {!slot.imageUrl && !slot.loading && (
                <div className="text-center text-[#1A1A1A] px-4">
                  <div className="text-4xl font-light leading-none mb-2">+</div>
                  <p className="text-xs font-medium">Instagram URL оруулна уу</p>
                </div>
              )}

              {slot.error && (
                <label className="absolute bottom-3 left-3 right-3 bg-white/95 border border-[#FFB7D5] text-[#1A1A1A] text-xs font-bold py-2 px-3 rounded cursor-pointer text-center hover:bg-[#FFF0F6]">
                  📁 Зургаа оруулах
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleManualUpload(index, event.target.files?.[0])}
                  />
                </label>
              )}
            </div>

            {slot.error && (
              <p className="text-xs text-red-500 mt-2">
                {slot.error}
              </p>
            )}

            <input
              type="url"
              value={slot.instagramUrl}
              onChange={event => {
                const value = event.target.value;
                setSlots(prev => prev.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, instagramUrl: value, error: '' } : item
                ));
              }}
              placeholder="https://instagram.com/p/xxx"
              className="w-full mt-2 px-3 py-2 text-xs border border-pink-200 rounded focus:outline-none focus:border-pink-400"
            />

            {(slot.imageUrl || slot.instagramUrl) && (
              <button
                type="button"
                onClick={() => setSlots(prev => prev.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, imageUrl: '', instagramUrl: '', error: '', loading: false } : item
                ))}
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
