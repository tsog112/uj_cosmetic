'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Camera, Image as ImageIcon, Link2, Loader2, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/admin/Toast';

import { authFetch } from '@/lib/auth/clientFetch';

const fetcher = (url: string) => authFetch(url).then((res) => res.json());

export default function InstagramSettings() {
  const { data: initialSlots, mutate, isLoading } = useSWR('/api/admin/instagram', fetcher);
  const { showToast } = useToast();
  
  // Local state for edits
  const [slots, setSlots] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Initialize local state when data loads
  if (initialSlots && !isInitialized) {
    // Ensure we have exactly 6 slots
    const padded = Array.from({ length: 6 }).map((_, i) => {
      const existing = initialSlots[i] || {};
      return {
        id: existing.id || `slot${Date.now()}_${i}`,
        imageUrl: existing.imageUrl || '',
        instagramUrl: existing.instagramUrl || '',
        order: existing.order ?? (i + 1),
      };
    });
    setSlots(padded);
    setIsInitialized(true);
  }

  const handleUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      const newSlots = [...slots];
      newSlots[index].imageUrl = data.url;
      setSlots(newSlots);
      showToast('Зураг амжилттай хуулагдлаа');
    } catch (e) {
      showToast('Зураг хуулахад алдаа гарлаа');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/instagram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slots),
      });
      if (!res.ok) throw new Error();
      mutate();
      showToast('Амжилттай хадгалагдлаа');
    } catch {
      showToast('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-brand-text)]">Instagram зургууд</p>
          <p className="text-[11px] text-[var(--color-brand-muted)]">Нүүр хуудсанд харагдах 6 зураг болон холбоосыг тохируулна уу.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-10 items-center gap-2 rounded-[14px] bg-[var(--color-brand-accent)] px-4 text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Хадгалах
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {slots.map((slot, index) => (
          <div key={slot.id} className="group relative flex flex-col gap-2 rounded-[20px] border border-[var(--color-border)] bg-white p-2 shadow-sm transition-all hover:shadow-md">
            {/* Image Box */}
            <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#fff5f9]">
              {slot.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slot.imageUrl} alt={`Slot ${index + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#f3b8cf]">
                  <ImageIcon size={24} />
                  <span className="text-[10px] font-bold">Зураггүй</span>
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition-all group-hover:opacity-100">
                <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[var(--color-brand-accent)] shadow-lg hover:scale-110 active:scale-95 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleUpload(e.target.files[0], index);
                    }}
                  />
                  {uploadingIndex === index ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                </label>
                
                {slot.imageUrl && (
                  <button
                    onClick={() => {
                      const newSlots = [...slots];
                      newSlots[index].imageUrl = '';
                      setSlots(newSlots);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--status-error)] shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Link Input */}
            <div className="flex items-center gap-2 rounded-[12px] bg-[#fdf5f8] px-3 py-2">
              <Link2 size={14} className="shrink-0 text-[#f3b8cf]" />
              <input
                type="url"
                placeholder="Instagram Link"
                value={slot.instagramUrl}
                onChange={(e) => {
                  const newSlots = [...slots];
                  newSlots[index].instagramUrl = e.target.value;
                  setSlots(newSlots);
                }}
                className="w-full bg-transparent text-[11px] font-medium text-gray-700 outline-none placeholder:text-[#f3b8cf]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
