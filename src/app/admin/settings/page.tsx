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
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 bg-blush" />)}
      </div>
    );
  }

  const inputClass = 'w-full min-h-11 rounded-xl border border-border-light/60 bg-sand px-3 text-sm outline-none focus:border-dusty-rose focus:bg-white';
  const labelClass = 'block text-sm text-text-subtle mb-1.5';

  return (
    <div className="space-y-4 md:space-y-8 max-w-3xl">
      {toast && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[120] px-4 py-3 bg-white border border-dusty-rose text-sm shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-text-subtle">Сайтын тохиргоо</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-charcoal">Тохиргоо</h2>
        </div>
      </div>

      <div className="space-y-5">
        <section className="surface-card p-5 md:p-6">
          <h3 className="text-sm font-semibold text-charcoal mb-5">Мэдэгдлийн мөр</h3>
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

        <section className="surface-card p-5 md:p-6">
          <h3 className="text-sm font-semibold text-charcoal mb-5">Хүргэлт</h3>
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

        <section className="surface-card p-5 md:p-6">
          <h3 className="text-sm font-semibold text-charcoal mb-5">Банкны мэдээлэл</h3>
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

        <section className="surface-card p-5 md:p-6">
          <h3 className="text-sm font-semibold text-charcoal mb-5">Холбоо барих</h3>
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

      <div className="sticky bottom-[72px] lg:bottom-0 bg-sand/95 backdrop-blur-sm py-4 -mx-4 px-4 md:mx-0 md:px-0">
        <button onClick={handleSave} disabled={saving} className="w-full min-h-12 rounded-full bg-charcoal text-white text-sm disabled:opacity-50 transition-colors hover:bg-black">
          {saving ? 'Хадгалж байна...' : 'Тохиргоо хадгалах'}
        </button>
      </div>
    </div>
  );
}
