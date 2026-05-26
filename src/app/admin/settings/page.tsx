'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Loader2, LogOut, Plus, Settings, Store, Tags, Trash2, Truck, X, Droplet, Sparkles, Sun, Moon, Flower2, Leaf, Waves, Wind, Beaker, FlaskConical, Feather, Heart, Gem, ShieldPlus, Edit2, CheckCircle2, MoreHorizontal, Syringe, Pill, Scale, Activity, Camera } from 'lucide-react';
import InstagramSettings from '@/components/admin/InstagramSettings';
import { useAuth } from '@/context/AuthContext';
import AdminConfirmSheet from '@/components/admin/AdminConfirmSheet';
import { SETTINGS_FALLBACK_FREE_SHIPPING_THRESHOLD, SETTINGS_FALLBACK_SHIPPING_COST, SETTINGS_SECTIONS, SYSTEM_INFO_ITEMS } from '@/lib/constants/admin';
import { useAdminCategories, useAdminSettings } from '@/lib/hooks/useAdmin';
import { formatMNT } from '@/lib/utils/format';

type Sheet = typeof SETTINGS_SECTIONS[number]['id'] | null;

const sectionIcon: Record<string, React.ElementType> = { store: Store, shipping: Truck, categories: Tags, instagram: Camera, system: Settings };

export default function AdminSettingsPage() {
  const { signOut } = useAuth();
  const { data: settings, mutate: mutateSettings } = useAdminSettings();
  const { data: categories, mutate: mutateCategories } = useAdminCategories();
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(SETTINGS_FALLBACK_FREE_SHIPPING_THRESHOLD);
  const [shippingCost, setShippingCost] = useState(SETTINGS_FALLBACK_SHIPPING_COST);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<any>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const ICONS = [
    { id: 'Sparkles', icon: Sparkles },
    { id: 'Droplet', icon: Droplet },
    { id: 'Sun', icon: Sun },
    { id: 'Moon', icon: Moon },
    { id: 'Flower2', icon: Flower2 },
    { id: 'Leaf', icon: Leaf },
    { id: 'Waves', icon: Waves },
    { id: 'Wind', icon: Wind },
    { id: 'Beaker', icon: Beaker },
    { id: 'FlaskConical', icon: FlaskConical },
    { id: 'Feather', icon: Feather },
    { id: 'Heart', icon: Heart },
    { id: 'Gem', icon: Gem },
    { id: 'ShieldPlus', icon: ShieldPlus },
    { id: 'Syringe', icon: Syringe },
    { id: 'Pill', icon: Pill },
    { id: 'Scale', icon: Scale },
    { id: 'Activity', icon: Activity },
    { id: 'MoreHorizontal', icon: MoreHorizontal },
  ];

  const COLORS = [
    '#E91E8C', '#7C5CBF', '#D4820A', '#C2185B', 
    '#E67E22', '#0EA5E9', '#16A34A', '#EF4444'
  ];

  const [selectedIcon, setSelectedIcon] = useState(ICONS[0].id);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [showOnHome, setShowOnHome] = useState(true);

  useEffect(() => {
    if (!settings) return;
    setStoreName(settings.storeName || '');
    setStorePhone(settings.storePhone || settings.phone || '');
    setStoreEmail(settings.storeEmail || settings.email || '');
    setInstagramUrl(settings.instagramUrl || '');
    setAnnouncementText(settings.announcementText || '');
    setAnnouncementActive(settings.announcementActive !== false);
    setFreeShippingThreshold(settings.freeShippingThreshold ?? SETTINGS_FALLBACK_FREE_SHIPPING_THRESHOLD);
    setShippingCost(settings.shippingCost ?? SETTINGS_FALLBACK_SHIPPING_COST);
    setBankName(settings.bankName || '');
    setBankAccount(settings.bankAccount || '');
    setBankAccountName(settings.bankAccountName || '');
  }, [settings]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      ...settings,
      storeName,
      storePhone,
      storeEmail,
      phone: storePhone,
      email: storeEmail,
      instagramUrl,
      announcementText,
      announcementActive,
      freeShippingThreshold: Number(freeShippingThreshold),
      shippingCost: Number(shippingCost),
      bankName,
      bankAccount,
      bankAccountName,
    };
    mutateSettings(payload, false);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error();
      mutateSettings();
      setActiveSheet(null);
      showToast('Тохиргоо хадгалагдлаа');
    } catch {
      mutateSettings();
      showToast('Тохиргоо хадгалахад алдаа гарлаа');
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setCategoryBusy(true);
    try {
      const isEditing = Boolean(editingCategoryId);
      const url = isEditing ? `/api/admin/categories/${editingCategoryId}` : '/api/admin/categories';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim(), icon: selectedIcon, color: selectedColor, showOnHome }),
      });
      if (!response.ok) throw new Error();
      
      setCategoryName('');
      setSelectedIcon(ICONS[0].id);
      setSelectedColor(COLORS[0]);
      setShowOnHome(true);
      setEditingCategoryId(null);
      mutateCategories();
      showToast(isEditing ? 'Ангилал шинэчлэгдлээ' : 'Ангилал нэмэгдлээ');
    } catch {
      showToast(editingCategoryId ? 'Ангилал шинэчлэхэд алдаа гарлаа' : 'Ангилал нэмэхэд алдаа гарлаа');
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleEditCategory = (category: any) => {
    setCategoryName(category.name);
    setSelectedIcon(category.icon || ICONS[0].id);
    setSelectedColor(category.color || COLORS[0]);
    setShowOnHome(category.showOnHome !== false);
    setEditingCategoryId(category.id);
    // Since this is inside a fixed bottom sheet, scroll the sheet container to top
    const sheetContainer = document.getElementById('admin-settings-sheet');
    if (sheetContainer) {
      sheetContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const deleteCategory = async (id: string) => {
    setCategoryBusy(true);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Ангилал устгах боломжгүй');
      }
      mutateCategories();
      showToast('Ангилал устгагдлаа');
    } catch (error: any) {
      showToast(error.message || 'Ангилал устгахад алдаа гарлаа');
    } finally {
      setCategoryBusy(false);
    }
  };

  const threshold = settings?.freeShippingThreshold ?? freeShippingThreshold;
  const currentShippingCost = settings?.shippingCost ?? shippingCost;
  const sectionSubtitle = {
    store: settings?.storeName || 'Дэлгүүрийн мэдээлэл тохируулаагүй',
    shipping: threshold > 0 ? `${formatMNT(threshold)}-өөс дээш үнэгүй · Хүргэлт ${formatMNT(currentShippingCost)}` : `Үнэгүй хүргэлтийн босго тохируулаагүй · Хүргэлт ${formatMNT(currentShippingCost)}`,
    categories: `${categories?.length || 0} ангилал`,
    instagram: 'Нүүр хуудасны 6 зураг',
    system: 'Runtime, өгөгдлийн сан, медиа үйлчилгээ',
  } as Record<string, string>;

  const activeTitle = SETTINGS_SECTIONS.find((section) => section.id === activeSheet)?.title;
  const inputClass = 'h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]';

  return (
    <div className="space-y-6 p-4 pb-[104px]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="fixed left-4 right-4 top-16 z-[100] rounded-[18px] bg-white p-3 text-center text-[12px] font-extrabold text-[var(--color-brand-text)] shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Settings</p>
        <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-brand-text)]">Тохиргоо</h1>
        <p className="mt-2 text-[13px] text-[var(--color-brand-muted)]">Дэлгүүрийн мэдээлэл, хүргэлт, ангилал, системийн төлвөө нэг дороос удирдана.</p>
      </section>

      <section className="overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-mobile-card)]">
        {SETTINGS_SECTIONS.map((row, index) => {
          const Icon = sectionIcon[row.id];
          return (
            <button key={row.id} onClick={() => setActiveSheet(row.id)} className={`flex w-full items-center gap-3 p-4 text-left active:bg-[var(--color-brand-bg)] ${index ? 'border-t border-[#f8dbe8]' : ''}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-extrabold text-[var(--color-brand-text)]">{row.title}</span>
                <span className="mt-1 block truncate text-[12px] text-[var(--color-brand-muted)]">{sectionSubtitle[row.id]}</span>
              </span>
              <ChevronRight size={18} className="text-[var(--color-brand-muted)]" />
            </button>
          );
        })}
      </section>

      <button onClick={signOut} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[var(--status-error-bg)] text-sm font-extrabold text-[var(--status-error)]">
        <LogOut size={17} /> Гарах
      </button>

      <AnimatePresence>
        {activeSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm" onClick={() => !isSaving && setActiveSheet(null)} />
            <motion.div id="admin-settings-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }} className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-[30px] bg-white pb-[env(safe-area-inset-bottom)]">
              <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-[#ecd0dc]" />
              <div className="px-5 pb-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-[var(--color-brand-text)]">{activeTitle}</h2>
                  <button onClick={() => setActiveSheet(null)} className="rounded-full bg-[var(--color-brand-secondary)] p-2 text-[var(--color-brand-text)]" aria-label="Хаах">
                    <X size={18} />
                  </button>
                </div>

                {activeSheet === 'store' && (
                  <form onSubmit={saveSettings} className="space-y-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Дэлгүүрийн нэр *</span>
                      <input required value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Дэлгүүрийн нэр" className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Утас</span>
                      <input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+976 xxxx-xxxx" className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Email</span>
                      <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} placeholder="info@example.mn" className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Instagram URL</span>
                      <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/uj_cosmetic" className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Мэдэгдлийн текст</span>
                      <input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Хүргэлт, урамшууллын богино мэдэгдэл..." className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Банкны нэр</span>
                      <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Жишээ: Хаан банк" className={inputClass} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Дансны дугаар" className={inputClass} />
                      <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Дансны нэр" className={inputClass} />
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-[16px] bg-[var(--color-brand-bg)] px-4 py-3">
                      <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand-accent)]" />
                      <span className="text-sm font-bold text-[var(--color-brand-text)]">Мэдэгдлийн баннер идэвхтэй</span>
                    </label>
                    <button disabled={isSaving} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white disabled:opacity-60">
                      {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Хадгалах
                    </button>
                  </form>
                )}

                {activeSheet === 'shipping' && (
                  <form onSubmit={saveSettings} className="space-y-4">
                    <p className="rounded-[18px] bg-[var(--color-brand-bg)] p-4 text-[12px] leading-relaxed text-[var(--color-brand-muted)]">Checkout дээр ашиглагдах үнэгүй хүргэлтийн босго болон хүргэлтийн үндсэн төлбөр.</p>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Үнэгүй хүргэлтийн босго</span>
                      <input required type="number" min="0" step="1000" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(Number(e.target.value))} className={inputClass} />
                      <div className="mt-2 rounded-[18px] bg-[var(--color-brand-secondary)] p-3 text-center text-sm font-extrabold text-[var(--color-brand-text)]">{formatMNT(freeShippingThreshold)}-өөс дээш үнэгүй хүргэлт</div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Хүргэлтийн төлбөр</span>
                      <input required type="number" min="0" step="500" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className={inputClass} />
                      <div className="mt-2 rounded-[18px] bg-[var(--color-brand-secondary)] p-3 text-center text-sm font-extrabold text-[var(--color-brand-text)]">Хүргэлт: {formatMNT(shippingCost)}</div>
                    </label>
                    <button disabled={isSaving} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white disabled:opacity-60">
                      {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Хадгалах
                    </button>
                  </form>
                )}

                {activeSheet === 'categories' && (
                  <div className="space-y-4">
                    <form onSubmit={addCategory} className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-sm border border-[#f8dbe8]">
                      <div className="flex gap-2">
                        <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Ангиллын нэр" className="h-12 min-w-0 flex-1 rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]" />
                        <button disabled={categoryBusy || !categoryName.trim()} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[var(--color-brand-accent)] px-4 text-sm font-bold text-white disabled:opacity-60" aria-label="Хадгалах">
                          {categoryBusy ? <Loader2 size={17} className="animate-spin" /> : editingCategoryId ? <Check size={18} /> : <Plus size={18} />}
                          {editingCategoryId ? 'Хадгалах' : 'Нэмэх'}
                        </button>
                      </div>

                      {editingCategoryId && (
                        <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryName(''); setSelectedIcon(ICONS[0].id); setSelectedColor(COLORS[0]); setShowOnHome(true); }} className="text-[12px] font-bold text-[var(--color-brand-muted)] self-end hover:text-gray-800">
                          Цуцлах
                        </button>
                      )}
                      
                      <label className="flex cursor-pointer items-center gap-2 rounded-[16px] bg-[var(--color-brand-bg)] px-3 py-2 mt-1">
                        <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand-accent)]" />
                        <span className="text-[12px] font-bold text-[var(--color-brand-text)]">Нүүр хуудсанд харуулах</span>
                      </label>

                      <div className="mt-1 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-muted)]">Icon сонгох</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ICONS.map(({ id, icon: Icon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSelectedIcon(id)}
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${selectedIcon === id ? 'bg-[var(--color-brand-accent)] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                              <Icon size={14} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-muted)]">Өнгө сонгох</p>
                        <div className="flex flex-wrap gap-1.5">
                          {COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSelectedColor(c)}
                              className={`h-6 w-6 rounded-full border-2 transition-all ${selectedColor === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </form>
                    <div className="space-y-2">
                      {categories?.length ? (
                        categories.map((category: any) => {
                          const Icon = ICONS.find(i => i.id === category.icon)?.icon || Tags;
                          return (
                          <div key={category.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-brand-bg)] p-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ color: category.color || 'var(--color-brand-accent)', background: `${category.color || '#E91E8C'}1A` }}>
                                <Icon size={14} />
                              </div>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-sm font-extrabold text-[var(--color-brand-text)]">{category.name}</span>
                              {category.showOnHome !== false && (
                                <span className="flex items-center gap-1 mt-0.5 text-[9px] font-bold text-blue-500">
                                  <CheckCircle2 size={10} /> Нүүрт
                                </span>
                              )}
                            </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleEditCategory(category)} disabled={categoryBusy} className="rounded-full bg-white p-2 text-blue-500 shadow-sm" aria-label={`${category.name} засах`}>
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => setPendingDeleteCategory(category)} disabled={categoryBusy} className="rounded-full bg-white p-2 text-[var(--status-error)] shadow-sm" aria-label={`${category.name} устгах`}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                          );
                        })
                      ) : (
                        <p className="py-4 text-center text-sm text-[var(--color-brand-muted)]">Ангилал байхгүй байна</p>
                      )}
                    </div>
                  </div>
                )}

                {activeSheet === 'instagram' && <InstagramSettings />}

                {activeSheet === 'system' && (
                  <div className="space-y-3 text-[13px]">
                    {SYSTEM_INFO_ITEMS.map(([label, value]) => (
                      <div key={label} className="flex justify-between rounded-[18px] bg-[var(--color-brand-bg)] p-4">
                        <span className="font-bold text-[var(--color-brand-muted)]">{label}</span>
                        <span className="font-extrabold text-[var(--color-brand-text)]">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between rounded-[18px] bg-[var(--color-brand-bg)] p-4">
                      <span className="font-bold text-[var(--color-brand-muted)]">Reviews</span>
                      <span className="font-extrabold text-[var(--color-brand-text)]">Firebase Firestore</span>
                    </div>
                    <div className="flex justify-between rounded-[18px] bg-[var(--color-brand-bg)] p-4">
                      <span className="font-bold text-[var(--color-brand-muted)]">Instagram</span>
                      <span className="font-extrabold text-[var(--color-brand-text)]">Firebase Firestore</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdminConfirmSheet
        open={Boolean(pendingDeleteCategory)}
        title="Ангилал устгах уу?"
        body="Ангиллыг устгахад холбогдсон бараануудын ангилал автоматаар 'Бусад' руу шилжих болно. Үргэлжлүүлэх үү?"
        confirmLabel="Устгах"
        destructive
        loading={categoryBusy}
        onClose={() => setPendingDeleteCategory(null)}
        onConfirm={() => {
          if (pendingDeleteCategory) void deleteCategory(pendingDeleteCategory.id).then(() => setPendingDeleteCategory(null));
        }}
      />
    </div>
  );
}
