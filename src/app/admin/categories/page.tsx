'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/lib/uploadImage';
import type { Category } from '@/types';
import Pagination, { paginate } from '@/components/admin/Pagination';

type CategoryFormState = {
  id?: string;
  originalSlug?: string;
  name_mn: string;
  slug: string;
  imageUrl: string;
  order?: number;
  productCount?: number;
  createdAt?: unknown;
};

const emptyForm: CategoryFormState = { name_mn: '', slug: '', imageUrl: '' };

function transliterateName(value: string) {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i',
    ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return value.toLowerCase().split('').map(char => map[char] ?? char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)), [categories]);
  const filteredCategories = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return sortedCategories;
    return sortedCategories.filter(category =>
      category.name_mn.toLowerCase().includes(term) ||
      category.slug.toLowerCase().includes(term)
    );
  }, [sortedCategories, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginatedCategories = useMemo(() => paginate(filteredCategories, page, 10), [filteredCategories, page]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const [categorySnap, productSnap] = await Promise.all([
        getDocs(query(collection(db, 'categories'), orderBy('order', 'asc'))),
        getDocs(collection(db, 'products')),
      ]);
      const productCounts = productSnap.docs.reduce<Record<string, number>>((acc, productDoc) => {
        const slug = productDoc.data().category || 'other';
        acc[slug] = (acc[slug] || 0) + 1;
        return acc;
      }, {});

      const nextCategories = categorySnap.docs.map((categoryDoc, index) => {
        const data = categoryDoc.data();
        const slug = data.slug || categoryDoc.id;
        return {
          id: data.id || categoryDoc.id,
          name_mn: data.name_mn || '',
          slug,
          imageUrl: data.imageUrl || '',
          order: Number(data.order ?? index + 1),
          productCount: productCounts[slug] || 0,
          createdAt: data.createdAt,
        } as Category;
      });

      await Promise.all(nextCategories.map(category => setDoc(doc(db, 'categories', category.id), { productCount: category.productCount }, { merge: true })));
      setCategories(nextCategories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories().catch(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function handleNameChange(value: string) {
    setForm(prev => ({ ...prev, name_mn: value, slug: editingId ? prev.slug : transliterateName(value) }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !form.slug) return;
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, `categories/${form.slug}`);
      setForm(prev => ({ ...prev, imageUrl }));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit() {
    if (!form.name_mn.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const slug = form.slug.trim().toLowerCase();
      const categoryId = slug;
      await setDoc(
        doc(db, 'categories', categoryId),
        {
          id: categoryId,
          name_mn: form.name_mn.trim(),
          slug,
          imageUrl: form.imageUrl || '',
          order: form.order ?? sortedCategories.length + 1,
          productCount: form.productCount ?? 0,
          createdAt: editingId ? (form.createdAt || serverTimestamp()) : serverTimestamp(),
        },
        { merge: true }
      );

      if (editingId && form.originalSlug && form.originalSlug !== slug) {
        const productsSnap = await getDocs(query(collection(db, 'products'), where('category', '==', form.originalSlug)));
        const batch = writeBatch(db);
        productsSnap.docs.forEach(productDoc => batch.update(productDoc.ref, { category: slug }));
        await batch.commit();
      }
      if (editingId && editingId !== categoryId) await deleteDoc(doc(db, 'categories', editingId));

      resetForm();
      await fetchCategories();
      setToast('Ангилал хадгалагдлаа.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category: Category) {
    setForm({
      id: category.id,
      originalSlug: category.slug,
      name_mn: category.name_mn,
      slug: category.slug,
      imageUrl: category.imageUrl || '',
      order: category.order,
      productCount: category.productCount || 0,
      createdAt: category.createdAt,
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  async function handleDelete(category: Category) {
    const productsSnap = await getDocs(query(collection(db, 'products'), where('category', '==', category.slug)));
    const warning = productsSnap.size > 0
      ? `Энэ ангилалд ${productsSnap.size} бараа байна. Устгавал тэдгээр бараа "Бусад" ангилалд шилжинэ.`
      : 'Энэ ангиллыг устгах уу?';
    if (!confirm(`${warning}\n\nҮргэлжлүүлэх үү?`)) return;

    const batch = writeBatch(db);
    productsSnap.docs.forEach(productDoc => batch.update(productDoc.ref, { category: 'other' }));
    batch.delete(doc(db, 'categories', category.id));
    await batch.commit();
    await fetchCategories();
  }

  async function saveOrder(nextCategories: Category[]) {
    await Promise.all(nextCategories.map((category, index) => updateDoc(doc(db, 'categories', category.id), { order: index + 1 })));
  }

  async function handleDrop(targetId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const fromIndex = sortedCategories.findIndex(category => category.id === draggedId);
    const toIndex = sortedCategories.findIndex(category => category.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextCategories = [...sortedCategories];
    const [draggedCategory] = nextCategories.splice(fromIndex, 1);
    nextCategories.splice(toIndex, 0, draggedCategory);
    const ordered = nextCategories.map((category, index) => ({ ...category, order: index + 1 }));
    setCategories(ordered);
    setDraggedId(null);
    await saveOrder(ordered);
  }

  const inputClass = 'w-full min-h-11 rounded-xl border border-border-light/60 bg-sand px-3 text-sm outline-none focus:border-dusty-rose focus:bg-white';

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-4 overflow-hidden md:space-y-8">
      {toast && <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 z-[120] px-4 py-3 bg-white border border-dusty-rose text-sm shadow-[0_18px_45px_rgba(26,26,26,0.08)]">{toast}</div>}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-text-subtle">Ангиллын удирдлага</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-charcoal">Ангилал</h2>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="btn-primary h-12 w-12 shrink-0 px-0 shadow-brand-md transition-transform active:scale-95 sm:h-auto sm:w-auto sm:min-h-11 sm:px-5"
        >
          <span className="hidden sm:inline">Шинэ ангилал нэмэх</span>
          <span className="sm:hidden text-lg leading-none">+</span>
        </button>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="metric-card px-3 py-3">
          <p className="text-[10px] text-text-subtle">Нийт</p>
          <p className="mt-1 text-xl font-semibold">{sortedCategories.length}</p>
        </div>
        <div className="metric-card bg-blush px-3 py-3">
          <p className="text-[10px] text-text-subtle">Зурагтай</p>
          <p className="mt-1 text-xl font-semibold">{sortedCategories.filter(category => category.imageUrl).length}</p>
        </div>
        <div className="metric-card border-status-pending-border bg-status-pending-bg px-3 py-3">
          <p className="text-[10px] text-status-pending-text">Бараа</p>
          <p className="mt-1 text-xl font-semibold">{sortedCategories.reduce((sum, category) => sum + Number(category.productCount || 0), 0)}</p>
        </div>
      </div>

      {showForm && (
        <div className="surface-panel p-5 md:p-6">
          <h3 className="text-sm font-semibold text-charcoal mb-5">{editingId ? 'Ангилал засах' : 'Шинэ ангилал'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-subtle mb-1.5">Ангиллын нэр *</label>
              <input value={form.name_mn} onChange={event => handleNameChange(event.target.value)} className={inputClass} placeholder="Серум" />
            </div>
            <div>
              <label className="block text-sm text-text-subtle mb-1.5">Slug *</label>
              <input value={form.slug} onChange={event => setForm(prev => ({ ...prev, slug: transliterateName(event.target.value) }))} className={inputClass} placeholder="serum" />
            </div>
            <div>
              <label className="block text-sm text-text-subtle mb-1.5">Зураг</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={!form.slug || uploading} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border border-dashed border-border-light/70 bg-sand p-3">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt={form.name_mn || 'Category'} className="h-40 w-full rounded-[20px] object-cover sm:h-48" />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-[20px] bg-white text-sm text-text-subtle sm:h-48">
                Ангиллын зураг харагдана
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={resetForm} className="btn-secondary">Болих</button>
            <button onClick={handleSubmit} disabled={saving || uploading || !form.name_mn || !form.slug} className="btn-primary disabled:opacity-50">
              {editingId ? 'Хадгалах' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}

      <div className="surface-panel max-w-full">
        <div className="border-b border-border-light/40 p-4">
          <div className="relative">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Ангиллын нэр эсвэл slug-аар хайх..."
              className="w-full min-h-11 rounded-full border border-border-light/60 bg-sand pl-10 pr-4 text-sm outline-none placeholder:text-text-subtle/70 focus:border-dusty-rose focus:bg-white"
            />
            <svg className="absolute left-4 top-3.5 text-text-subtle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-text-subtle">Ачаалж байна...</div>
        ) : (
          <div className="space-y-3 bg-sand p-2.5 sm:p-3 md:space-y-0 md:bg-white md:p-0">
            <div className="hidden grid-cols-[56px_184px_minmax(220px,1fr)_120px_170px] items-center border-b border-border-light/35 bg-sand px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle md:grid">
              <span></span>
              <span>Зураг</span>
              <span>Ангилал</span>
              <span className="text-center">Бараа</span>
              <span className="text-right">Үйлдэл</span>
            </div>
            <div className="max-w-full md:divide-y md:divide-[#F2A8C8]/30">
            {paginatedCategories.map(category => (
              <div
                key={category.id}
                draggable
                onDragStart={() => setDraggedId(category.id)}
                onDragOver={event => event.preventDefault()}
                onDrop={event => handleDrop(category.id, event)}
                onDragEnd={() => setDraggedId(null)}
                className="grid max-w-full grid-cols-[18px_104px_minmax(0,1fr)] items-center gap-x-3 gap-y-4 overflow-hidden rounded-[24px] border border-border-light/35 bg-white p-3 shadow-brand-sm transition-colors hover:bg-sand sm:grid-cols-[18px_128px_minmax(0,1fr)] sm:p-4 md:grid md:grid-cols-[56px_184px_minmax(220px,1fr)_120px_170px] md:gap-4 md:overflow-visible md:rounded-none md:border-0 md:px-5 md:py-4 md:shadow-none"
              >
                <span className="hidden shrink-0 text-xs text-text-subtle cursor-move md:block">⠿</span>
                <span className="flex h-10 items-center justify-center text-xs text-text-subtle cursor-move md:hidden">⠿</span>
                <div className="contents md:contents">
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name_mn} className="h-[96px] w-full rounded-[22px] border border-border-light/50 object-cover sm:h-[108px] md:h-20 md:w-36 md:rounded-[14px]" />
                  ) : (
                    <div className="flex h-[96px] w-full items-center justify-center rounded-[22px] border border-dashed border-border-light/70 bg-blush text-xs text-text-subtle sm:h-[108px] md:h-20 md:w-36 md:rounded-[14px]">Зураггүй</div>
                  )}
                  <div className="min-w-0 self-center">
                    <p className="truncate text-[16px] font-semibold leading-6 text-charcoal md:text-base">{category.name_mn}</p>
                    <p className="mt-1 truncate text-sm text-text-subtle md:text-xs">{category.slug}</p>
                    <span className="mt-3 inline-flex min-h-7 items-center rounded-full border border-border-light/60 bg-sand px-3 text-[11px] font-semibold text-text-subtle md:hidden">
                      {category.productCount || 0} бараа
                    </span>
                  </div>
                </div>
                <div className="hidden text-center text-sm md:block">{category.productCount || 0}</div>
                <div className="col-span-3 grid min-w-0 grid-cols-2 gap-2 md:col-span-1 md:flex md:justify-end">
                  <button onClick={() => handleEdit(category)} className="btn-secondary min-w-0 px-3 md:min-h-10 md:px-4 md:text-xs">Засах</button>
                  <button onClick={() => handleDelete(category)} className="btn-danger min-w-0 px-3 md:min-h-10 md:px-4 md:text-xs">Устгах</button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
        <Pagination page={page} totalItems={filteredCategories.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
