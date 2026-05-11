'use client';

import { useEffect, useState } from 'react';
import { getSiteSettings, updateSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getSiteSettings()
      .then(siteSettings => {
        if (siteSettings) setSettings(siteSettings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      await updateSiteSettings(settings);
      setToast('Тохиргоо хадгалагдлаа.');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-[#FFD6E8] w-48" />
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 bg-[#FFF0F6]" />)}
      </div>
    );
  }

  const inputClass = 'w-full min-h-11 rounded-[10px] border border-[#F2A8C8]/60 bg-[#FFF8FB] px-3 text-sm outline-none focus:border-[#FFB7D5] focus:bg-white';
  const labelClass = 'block text-sm text-[#8B6B78] mb-1.5';

  return (
    <div className="space-y-4 md:space-y-8 max-w-3xl">
      {toast && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[120] px-4 py-3 bg-white border border-[#FFB7D5] text-sm shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Сайтын тохиргоо</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Тохиргоо</h2>
        </div>
        <button onClick={handleSave} disabled={saving} className="shrink-0 min-h-11 px-4 md:px-5 rounded-[10px] bg-[#1A1A1A] text-white text-sm disabled:opacity-50 shadow-[0_10px_24px_rgba(26,26,26,0.12)]">
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      <div className="space-y-5">
        <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Мэдэгдлийн мөр</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Мэдэгдлийн текст</label>
              <input name="announcementText" value={settings.announcementText} onChange={handleChange} className={inputClass} />
            </div>
            <label className="flex items-center gap-3 min-h-11 text-sm">
              <input type="checkbox" name="announcementActive" checked={settings.announcementActive} onChange={handleChange} className="w-4 h-4 accent-[#FFB7D5]" />
              Мэдэгдлийг идэвхжүүлэх
            </label>
          </div>
        </section>

        <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Хүргэлт</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Үнэгүй хүргэлтийн босго</label>
              <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Хүргэлтийн төлбөр</label>
              <input type="number" name="shippingCost" value={settings.shippingCost} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </section>

        <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Банкны мэдээлэл</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Банкны нэр</label>
              <input name="bankName" value={settings.bankName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Дансны дугаар</label>
              <input name="bankAccount" value={settings.bankAccount} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Хүлээн авагчийн нэр</label>
              <input name="bankAccountName" value={settings.bankAccountName} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </section>

        <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">Холбоо барих</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Утасны дугаар</label>
              <input name="phone" value={settings.phone} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Имэйл</label>
              <input type="email" name="email" value={settings.email} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Instagram URL</label>
              <input type="url" name="instagramUrl" value={settings.instagramUrl} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-[64px] lg:bottom-0 bg-[#FFF8FB]/95 backdrop-blur-sm py-4">
        <button onClick={handleSave} disabled={saving} className="w-full min-h-12 rounded-[10px] bg-[#1A1A1A] text-white text-sm disabled:opacity-50">
          {saving ? 'Хадгалж байна...' : 'Тохиргоо хадгалах'}
        </button>
      </div>
    </div>
  );
}
