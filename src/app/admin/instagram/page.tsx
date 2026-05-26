'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { Camera, Loader2, Save, Trash2 } from 'lucide-react';
import { INSTAGRAM_FEED_SLOT_COUNT } from '@/lib/constants/admin';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/lib/uploadImage';

type InstagramSlot = {
  id: string;
  instagramUrl: string;
  imageUrl: string;
};

function createEmptySlots(): InstagramSlot[] {
  return Array.from({ length: INSTAGRAM_FEED_SLOT_COUNT }, (_, index) => ({ id: `slot-${index + 1}`, instagramUrl: '', imageUrl: '' }));
}

export default function AdminInstagramPage() {
  const [slots, setSlots] = useState<InstagramSlot[]>(createEmptySlots);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'instagramFeed'), orderBy('order', 'asc')))
      .then((snap) => {
        if (snap.empty) return;
        const saved = snap.docs.slice(0, INSTAGRAM_FEED_SLOT_COUNT).map((slotDoc) => {
          const data = slotDoc.data();
          return { id: slotDoc.id, instagramUrl: data.instagramUrl || '', imageUrl: data.imageUrl || '' };
        });
        while (saved.length < INSTAGRAM_FEED_SLOT_COUNT) saved.push({ id: `slot-${saved.length + 1}`, instagramUrl: '', imageUrl: '' });
        setSlots(saved);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSlot = (index: number, patch: Partial<InstagramSlot>) => {
    setSlots((prev) => prev.map((slot, current) => current === index ? { ...slot, ...patch } : slot));
  };

  const uploadSlotImage = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingSlot(index);
    try {
      const imageUrl = await uploadImage(file, `instagram/slot-${index + 1}`);
      updateSlot(index, { imageUrl });
      setMessage('Зураг нэмэгдлээ');
    } catch {
      setMessage('Зураг оруулахад алдаа гарлаа');
    } finally {
      setUploadingSlot(null);
      event.target.value = '';
    }
  };

  const saveSlots = async () => {
    setSaving(true);
    try {
      for (const [index, slot] of slots.entries()) {
        await setDoc(doc(db, 'instagramFeed', slot.id), {
          id: slot.id,
          instagramUrl: slot.instagramUrl,
          imageUrl: slot.imageUrl,
          order: index + 1,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      setMessage('Instagram feed хадгалагдлаа');
    } catch {
      setMessage('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = slots.filter((slot) => slot.imageUrl).length;

  return (
    <div className="space-y-5 p-4 pb-[104px]">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Instagram</p>
          <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-brand-text)]">Instagram feed</h1>
          <p className="mt-2 text-[13px] text-[var(--color-brand-muted)]">{activeCount}/{INSTAGRAM_FEED_SLOT_COUNT} зураг идэвхтэй</p>
        </div>
        <button onClick={saveSlots} disabled={saving || uploadingSlot !== null} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-white shadow-lg disabled:opacity-60" aria-label="Хадгалах">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        </button>
      </section>

      {message && <div className="rounded-[18px] bg-white p-3 text-center text-[12px] font-extrabold shadow-[var(--shadow-mobile-card)]">{message}</div>}

      <div className="rounded-[22px] bg-white p-4 text-[12px] leading-relaxed text-[var(--color-brand-muted)] shadow-[var(--shadow-mobile-card)]">
        Public нүүр хэсэгт харагдах Instagram cover зураг болон дарахад нээгдэх post/reel URL-ийг удирдана.
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: INSTAGRAM_FEED_SLOT_COUNT }).map((_, index) => <div key={index} className="aspect-[4/5] rounded-[24px] animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {slots.map((slot, index) => (
            <article key={slot.id} className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
              <label className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-[var(--color-brand-secondary)]">
                {slot.imageUrl ? (
                  <img src={slot.imageUrl} alt={`Instagram ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--color-brand-accent)]">
                    {uploadingSlot === index ? <Loader2 className="animate-spin" /> : <Camera size={25} />}
                    <span className="text-[11px] font-extrabold">Зураг нэмэх</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadSlotImage(index, event)} />
              </label>
              <input value={slot.instagramUrl} onChange={(event) => updateSlot(index, { instagramUrl: event.target.value })} placeholder="Instagram URL" className="mt-3 h-10 w-full rounded-full bg-[var(--color-brand-bg)] px-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]" />
              {(slot.instagramUrl || slot.imageUrl) && (
                <button onClick={() => updateSlot(index, { instagramUrl: '', imageUrl: '' })} className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--status-error-bg)] text-[11px] font-extrabold text-[var(--status-error)]">
                  <Trash2 size={13} /> Цэвэрлэх
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
