'use client';

import Image from 'next/image';
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { doc, getDocs, collection, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app, db } from '@/lib/firebase';

type InstagramSlot = {
  id: string;
  imageUrl: string;
  instagramUrl: string;
  order: number;
  createdAt?: unknown;
};

const SLOT_COUNT = 6;
const storage = getStorage(app);

function createEmptySlots(): InstagramSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    id: `slot-${index + 1}`,
    imageUrl: '',
    instagramUrl: '',
    order: index,
  }));
}

export default function AdminInstagramPage() {
  const [slots, setSlots] = useState<InstagramSlot[]>(createEmptySlots);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      const snap = await getDocs(query(collection(db, 'instagramFeed'), orderBy('order', 'asc')));
      if (!mounted) return;

      const nextSlots = createEmptySlots();
      snap.docs.slice(0, SLOT_COUNT).forEach((docSnap, index) => {
        const data = docSnap.data();
        nextSlots[index] = {
          id: data.id || docSnap.id,
          imageUrl: data.imageUrl || '',
          instagramUrl: data.instagramUrl || '',
          order: Number(data.order ?? index),
          createdAt: data.createdAt,
        };
      });

      setSlots(nextSlots.map((slot, index) => ({ ...slot, order: index })));
      setLoading(false);
    }

    loadFeed().catch(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const saveSlot = async (slot: InstagramSlot, order = slot.order) => {
    await setDoc(
      doc(db, 'instagramFeed', slot.id),
      {
        id: slot.id,
        imageUrl: slot.imageUrl,
        instagramUrl: slot.instagramUrl,
        order,
        createdAt: slot.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  };

  const handleUpload = async (slotId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingSlotId(slotId);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `instagram/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      const nextSlots = slots.map(slot =>
        slot.id === slotId ? { ...slot, imageUrl } : slot
      );
      const updatedSlot = nextSlots.find(slot => slot.id === slotId);

      setSlots(nextSlots);
      if (updatedSlot) await saveSlot(updatedSlot);
      setToast('Зураг хадгалагдлаа');
      setTimeout(() => setToast(''), 2500);
    } catch (error) {
      alert('Зураг оруулахад алдаа гарлаа.');
    } finally {
      setUploadingSlotId(null);
      event.target.value = '';
    }
  };

  const handleUrlChange = (slotId: string, instagramUrl: string) => {
    setSlots(prev =>
      prev.map(slot => (slot.id === slotId ? { ...slot, instagramUrl } : slot))
    );
  };

  const handleDrop = (targetSlotId: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggedSlotId || draggedSlotId === targetSlotId) return;

    const draggedIndex = slots.findIndex(slot => slot.id === draggedSlotId);
    const targetIndex = slots.findIndex(slot => slot.id === targetSlotId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const nextSlots = [...slots];
    const [draggedSlot] = nextSlots.splice(draggedIndex, 1);
    nextSlots.splice(targetIndex, 0, draggedSlot);
    setSlots(nextSlots.map((slot, index) => ({ ...slot, order: index })));
    setDraggedSlotId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(slots.map((slot, index) => saveSlot({ ...slot, order: index }, index)));
      setToast('Хадгалагдлаа');
      setTimeout(() => setToast(''), 2500);
    } catch (error) {
      alert('Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: SLOT_COUNT }, (_, index) => (
            <div key={index} className="h-72 bg-gray-100 rounded-xl" />
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

      {toast && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm font-medium">
          {toast}
        </div>
      )}

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
            <button
              type="button"
              onClick={() => fileInputs.current[slot.id]?.click()}
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#FFD6E8] border border-dashed border-[#FFB7D5] flex items-center justify-center text-4xl font-light text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
              aria-label={`Instagram slot ${index + 1}`}
            >
              {slot.imageUrl ? (
                <Image
                  src={slot.imageUrl}
                  alt={`Instagram ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <span>+</span>
              )}
              {uploadingSlotId === slot.id && (
                <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-bold">
                  Оруулж байна...
                </span>
              )}
            </button>

            <input
              ref={input => {
                fileInputs.current[slot.id] = input;
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={event => handleUpload(slot.id, event)}
            />

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Slot {index + 1}
              </label>
              <input
                type="url"
                value={slot.instagramUrl}
                onChange={event => handleUrlChange(slot.id, event.target.value)}
                placeholder="https://instagram.com/p/xxx"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5] focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
