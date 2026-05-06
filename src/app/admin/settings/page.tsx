'use client';

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then(s => {
        if (s) setSettings(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteSettings(settings);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (error) {
      alert('Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 w-48 rounded" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Тохиргоо</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FFB7D5] hover:bg-[#f5a0c5] text-[#1A1A1A] px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in text-sm font-medium flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          Хадгалагдлаа ✓
        </div>
      )}

      <div className="space-y-8">
        {/* Мэдэгдлийн мөр */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Мэдэгдлийн мөр</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Мэдэгдлийн текст</label>
              <input type="text" name="announcementText" value={settings.announcementText} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5] focus:border-transparent" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="announcementActive" checked={settings.announcementActive} onChange={handleChange}
                className="w-5 h-5 rounded accent-[#FFB7D5]" />
              <span className="text-sm text-gray-700">Мэдэгдлийг идэвхжүүлэх</span>
            </label>
          </div>
        </section>

        {/* Хүргэлт */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Хүргэлтийн тохиргоо</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Үнэгүй хүргэлтийн босго (₮)</label>
              <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Хүргэлтийн төлбөр (₮)</label>
              <input type="number" name="shippingCost" value={settings.shippingCost} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
          </div>
        </section>

        {/* Банкны мэдээлэл */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Банкны мэдээлэл</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Банкны нэр</label>
              <input type="text" name="bankName" value={settings.bankName} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дансны дугаар</label>
              <input type="text" name="bankAccount" value={settings.bankAccount} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Хүлээн авагчийн нэр</label>
              <input type="text" name="bankAccountName" value={settings.bankAccountName} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
          </div>
        </section>

        {/* Холбоо барих */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Холбоо барих</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Утасны дугаар</label>
              <input type="text" name="phone" value={settings.phone} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Имэйл</label>
              <input type="email" name="email" value={settings.email} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Instagram URL</label>
              <input type="url" name="instagramUrl" value={settings.instagramUrl} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]" />
            </div>
          </div>
        </section>
      </div>

      {/* Bottom save button */}
      <div className="mt-8 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FFB7D5] hover:bg-[#f5a0c5] text-[#1A1A1A] w-full py-3.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          {saving ? 'Хадгалж байна...' : 'Тохиргоо хадгалах'}
        </button>
      </div>
    </div>
  );
}
