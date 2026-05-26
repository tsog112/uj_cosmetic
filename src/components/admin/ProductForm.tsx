'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Check, GripVertical, Loader2, Minus, Plus, Save, Trash2, X } from 'lucide-react';
import AdminConfirmSheet from '@/components/admin/AdminConfirmSheet';
import { useAdminCategories } from '@/lib/hooks/useAdmin';

type SpecRow = { key: string; value: string };
type EditorTab = 'basic' | 'stock' | 'specs' | 'visibility';

type ProductInitialData = {
  id?: string;
  name?: string;
  brand?: string;
  categoryId?: string;
  description?: string;
  ingredients?: string;
  howToUse?: string;
  price?: string | number;
  salePrice?: string | number | null;
  saleUntil?: string | Date | null;
  costPrice?: string | number | null;
  stock?: string | number;
  lowStockThreshold?: string | number;
  isVisible?: boolean;
  isFeatured?: boolean;
  showOnHome?: boolean;
  showInSearch?: boolean;
  slug?: string;
  images?: string[] | string;
  specs?: Record<string, string>;
};

type FormState = {
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  ingredients: string;
  howToUse: string;
  price: string;
  salePrice: string;
  saleUntil: string;
  costPrice: string;
  stock: string;
  lowStockThreshold: string;
  isVisible: boolean;
  isFeatured: boolean;
  showOnHome: boolean;
  showInSearch: boolean;
  slug: string;
  images: string[];
  specs: SpecRow[];
};

const tabs: Array<{ id: EditorTab; label: string }> = [
  { id: 'basic', label: 'Үндсэн мэдээлэл' },
  { id: 'stock', label: 'Нөөц & Үнэ' },
  { id: 'specs', label: 'Дэлгэрэнгүй' },
  { id: 'visibility', label: 'Promote' },
];

const specSuggestions = ['Брэнд', 'Хэмжээ', 'Хугацаа', 'Гүйцэтгэл', 'Найрлага', 'Орон', 'Батлагдсан'];

function parseImages(value: ProductInitialData['images']) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function toDateInput(value: ProductInitialData['saleUntil']) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function makeForm(initialData?: ProductInitialData): FormState {
  return {
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    categoryId: initialData?.categoryId || '',
    description: initialData?.description || '',
    ingredients: initialData?.ingredients || '',
    howToUse: initialData?.howToUse || '',
    price: String(initialData?.price || ''),
    salePrice: initialData?.salePrice ? String(initialData.salePrice) : '',
    saleUntil: toDateInput(initialData?.saleUntil),
    costPrice: initialData?.costPrice ? String(initialData.costPrice) : '',
    stock: String(initialData?.stock || ''),
    lowStockThreshold: String(initialData?.lowStockThreshold || 5),
    isVisible: initialData?.isVisible ?? true,
    isFeatured: Boolean(initialData?.isFeatured),
    showOnHome: initialData?.showOnHome ?? true,
    showInSearch: initialData?.showInSearch ?? true,
    slug: initialData?.slug || '',
    images: parseImages(initialData?.images),
    specs: initialData?.specs ? Object.entries(initialData.specs).map(([key, value]) => ({ key, value: String(value) })) : [],
  };
}

export default function ProductForm({ initialData }: { initialData?: ProductInitialData }) {
  const router = useRouter();
  const { data: categories } = useAdminCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormState>(() => makeForm(initialData));
  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [dirtyTabs, setDirtyTabs] = useState<Set<EditorTab>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setFormData(makeForm(initialData)), [initialData]);

  const inputClass = 'h-12 w-full rounded-[16px] border border-white bg-white px-4 text-[14px] font-semibold text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)] outline-none focus:ring-2 focus:ring-[#f3b8cf]';
  const labelClass = 'mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]';

  const updateField = <K extends keyof FormState>(name: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setDirtyTabs((prev) => new Set(prev).add(activeTab));
  };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 8 - formData.images.length);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        body.append('folder', 'products');
        const response = await fetch('/api/admin/upload', { method: 'POST', body });
        if (!response.ok) throw new Error();
        const data = await response.json() as { url?: string };
        if (data.url) uploaded.push(data.url);
      }
      updateField('images', [...formData.images, ...uploaded]);
      setStatusMessage('Зураг амжилттай нэмэгдлээ');
    } catch {
      setStatusMessage('Зураг оруулахад алдаа гарлаа');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage('');
    const payload = {
      ...formData,
      specs: Object.fromEntries(formData.specs.filter((spec) => spec.key.trim()).map((spec) => [spec.key.trim(), spec.value.trim()])),
    };
    try {
      const response = await fetch(initialData?.id ? `/api/admin/products/${initialData.id}` : '/api/admin/products', {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error();
      router.push('/admin/products');
      router.refresh();
    } catch {
      setStatusMessage('Бүтээгдэхүүн хадгалахад алдаа гарлаа');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!initialData?.id) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/products/${initialData.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      router.push('/admin/products');
      router.refresh();
    } catch {
      setStatusMessage('Бүтээгдэхүүн устгахад алдаа гарлаа');
    } finally {
      setIsSaving(false);
      setConfirmDelete(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 p-4 pb-[128px]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button type="button" onClick={() => router.push('/admin/products')} className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)]" aria-label="Буцах">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Product editor</p>
            <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-brand-text)]">{initialData ? 'Бараа засах' : 'Шинэ бараа'}</h1>
          </div>
        </div>
      </header>

      {statusMessage && <div className="rounded-[18px] bg-white p-3 text-[12px] font-bold text-[var(--color-brand-muted)] shadow-[var(--shadow-mobile-card)]"><Check size={15} className="mr-2 inline text-[var(--color-brand-accent)]" />{statusMessage}</div>}

      <nav className="grid grid-cols-2 gap-2 rounded-[24px] bg-white p-2 shadow-[var(--shadow-mobile-card)]">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`relative min-h-11 rounded-full px-3 text-[12px] font-extrabold ${activeTab === tab.id ? 'bg-[var(--color-brand-accent)] text-white' : 'bg-[var(--color-brand-bg)] text-[var(--color-brand-text)]'}`}>
            {tab.label}
            {dirtyTabs.has(tab.id) && <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-[var(--status-warning)]" />}
          </button>
        ))}
      </nav>

      {activeTab === 'basic' && (
        <section className="space-y-5">
          <div>
            <p className={labelClass}>Зураг</p>
            <div className="grid grid-cols-3 gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || formData.images.length >= 8} className="flex aspect-square min-h-28 flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#f3b8cf] bg-white text-[var(--color-brand-accent)] disabled:opacity-50">
                {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                <span className="mt-2 text-[10px] font-extrabold">{isUploading ? 'Оруулж байна' : 'Зураг нэмэх'}</span>
              </button>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={uploadImages} />
              {formData.images.map((image, index) => (
                <div key={`${image}-${index}`} className="relative aspect-square min-h-28 overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-mobile-card)]">
                  <Image src={image} alt="" fill className="object-cover" />
                  {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[9px] font-extrabold text-[var(--color-brand-accent)]">Thumb</span>}
                  <button type="button" onClick={() => updateField('images', formData.images.filter((_, current) => current !== index))} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white" aria-label="Зураг устгах">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label className="block"><span className={labelClass}>Бүтээгдэхүүний нэр *</span><input required value={formData.name} onChange={(event) => updateField('name', event.target.value)} className={`${inputClass} text-[18px]`} /></label>
          <div>
            <p className={labelClass}>Ангилал *</p>
            <div className="mobile-chip-grid">
              {categories?.map((category: { id: string; name: string }) => (
                <button key={category.id} type="button" onClick={() => updateField('categoryId', category.id)} className={`mobile-chip ${formData.categoryId === category.id ? 'bg-[var(--color-brand-accent)] text-white' : 'bg-white text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)]'}`}>{category.name}</button>
              ))}
            </div>
          </div>
          <label className="block"><span className={labelClass}>Үнэ *</span><input required type="number" min="0" value={formData.price} onChange={(event) => updateField('price', event.target.value)} className={inputClass} placeholder="₮" /></label>
          <label className="block"><span className={labelClass}>Тайлбар</span><textarea value={formData.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className="w-full rounded-[18px] border border-white bg-white p-4 text-[15px] font-semibold leading-6 text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)] outline-none focus:ring-2 focus:ring-[#f3b8cf]" /></label>
          <label className="flex min-h-12 items-center justify-between rounded-[18px] bg-white px-4 shadow-[var(--shadow-mobile-card)]"><span className="text-sm font-extrabold">Апп дээр харуулах</span><input type="checkbox" checked={formData.isVisible} onChange={(event) => updateField('isVisible', event.target.checked)} className="accent-[var(--color-brand-accent)]" /></label>
        </section>
      )}

      {activeTab === 'stock' && (
        <section className="space-y-4">
          <div>
            <span className={labelClass}>Одоогийн нөөц</span>
            <div className="grid grid-cols-[52px_1fr_52px] gap-2">
              <button type="button" onClick={() => updateField('stock', String(Math.max(0, Number(formData.stock || 0) - 1)))} className="h-13 rounded-full bg-white shadow-[var(--shadow-mobile-card)]"><Minus className="mx-auto" size={18} /></button>
              <input required type="number" min="0" value={formData.stock} onChange={(event) => updateField('stock', event.target.value)} className="h-13 rounded-[18px] bg-white text-center text-[28px] font-extrabold shadow-[var(--shadow-mobile-card)] outline-none" />
              <button type="button" onClick={() => updateField('stock', String(Number(formData.stock || 0) + 1))} className="h-13 rounded-full bg-white shadow-[var(--shadow-mobile-card)]"><Plus className="mx-auto" size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label><span className={labelClass}>Анхааруулах</span><input type="number" min="0" value={formData.lowStockThreshold} onChange={(event) => updateField('lowStockThreshold', event.target.value)} className={inputClass} /></label>
            <label><span className={labelClass}>Зардлын үнэ</span><input type="number" min="0" value={formData.costPrice} onChange={(event) => updateField('costPrice', event.target.value)} className={inputClass} /></label>
          </div>
          <label className="flex min-h-12 items-center justify-between rounded-[18px] bg-white px-4 shadow-[var(--shadow-mobile-card)]"><span className="text-sm font-extrabold">Хямдралтай үнэ</span><input type="checkbox" checked={Boolean(formData.salePrice)} onChange={(event) => updateField('salePrice', event.target.checked ? formData.price : '')} className="accent-[var(--color-brand-accent)]" /></label>
          {formData.salePrice && <div className="grid grid-cols-2 gap-3"><input type="number" min="0" value={formData.salePrice} onChange={(event) => updateField('salePrice', event.target.value)} className={inputClass} /><input type="date" value={formData.saleUntil} onChange={(event) => updateField('saleUntil', event.target.value)} className={inputClass} /></div>}
          <div className="rounded-[20px] bg-white p-4 shadow-[var(--shadow-mobile-card)]"><p className={labelClass}>Нөөц засварлах түүх</p><p className="text-sm leading-6 text-[var(--color-brand-muted)]">Сүүлийн 5 өөрчлөлт audit log холбогдсоны дараа энд харагдана.</p></div>
        </section>
      )}

      {activeTab === 'specs' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">{specSuggestions.map((item) => <button key={item} type="button" onClick={() => updateField('specs', [...formData.specs, { key: item, value: '' }])} className="h-10 rounded-full bg-white px-3 text-[12px] font-extrabold shadow-[var(--shadow-mobile-card)]">{item}</button>)}</div>
          <div className="space-y-2">
            {formData.specs.map((spec, index) => (
              <div key={`${spec.key}-${index}`} className="grid grid-cols-[24px_1fr_1fr_38px] items-center gap-2 rounded-[18px] bg-white p-2 shadow-[var(--shadow-mobile-card)]">
                <GripVertical size={16} className="text-[var(--color-brand-muted)]" />
                <input value={spec.key} onChange={(event) => { const next = [...formData.specs]; next[index] = { ...next[index], key: event.target.value }; updateField('specs', next); }} className="h-11 min-w-0 rounded-[14px] bg-[var(--color-brand-bg)] px-3 text-sm font-bold outline-none" placeholder="Нэр" />
                <input value={spec.value} onChange={(event) => { const next = [...formData.specs]; next[index] = { ...next[index], value: event.target.value }; updateField('specs', next); }} className="h-11 min-w-0 rounded-[14px] bg-[var(--color-brand-bg)] px-3 text-sm font-bold outline-none" placeholder="Утга" />
                <button type="button" onClick={() => updateField('specs', formData.specs.filter((_, current) => current !== index))} className="h-10 rounded-full bg-[var(--status-error-bg)] text-[var(--status-error)]"><Trash2 className="mx-auto" size={15} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => updateField('specs', [...formData.specs, { key: '', value: '' }])} className="h-12 w-full rounded-full bg-[var(--color-brand-secondary)] text-sm font-extrabold text-[var(--color-brand-text)]">+ Шинж чанар нэмэх</button>
        </section>
      )}

      {activeTab === 'visibility' && (
        <section className="space-y-4">
          {[
            ['isFeatured', 'Featured / Promote хийх'],
            ['showOnHome', 'Нүүр хуудсанд харуулах'],
            ['showInSearch', 'Хайлтад харуулах'],
          ].map(([key, label]) => <label key={key} className="flex min-h-12 items-center justify-between rounded-[18px] bg-white px-4 shadow-[var(--shadow-mobile-card)]"><span className="text-sm font-extrabold">{label}</span><input type="checkbox" checked={Boolean(formData[key as keyof FormState])} onChange={(event) => updateField(key as keyof FormState, event.target.checked as never)} className="accent-[var(--color-brand-accent)]" /></label>)}
          <label><span className={labelClass}>SEO / slug</span><input value={formData.slug} onChange={(event) => updateField('slug', event.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Найрлага</span><input value={formData.ingredients} onChange={(event) => updateField('ingredients', event.target.value)} className={inputClass} /></label>
          <label><span className={labelClass}>Хэрэглэх заавар</span><input value={formData.howToUse} onChange={(event) => updateField('howToUse', event.target.value)} className={inputClass} /></label>
        </section>
      )}

      <section className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[430px] grid-cols-[112px_1fr] gap-2 border-t border-[#f8dbe8] bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur">
        <button disabled={!initialData?.id || isSaving || isUploading} type="button" onClick={() => setConfirmDelete(true)} className="flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--status-error)] bg-white text-sm font-extrabold text-[var(--status-error)] disabled:opacity-40"><Trash2 size={16} /> Устгах</button>
        <button disabled={isSaving || isUploading} type="submit" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white shadow-lg disabled:opacity-60">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={17} />} Хадгалах</button>
      </section>

      <AdminConfirmSheet open={confirmDelete} title="Бараа устгах уу?" body="Энэ үйлдлийг буцаах боломжгүй. Барааг устгахдаа итгэлтэй байна уу?" confirmLabel="Устгах" destructive loading={isSaving} onClose={() => setConfirmDelete(false)} onConfirm={() => void deleteProduct()} />
    </form>
  );
}
