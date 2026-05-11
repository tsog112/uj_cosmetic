'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app, db } from '@/lib/firebase';
import type { Category } from '@/types';

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
const storage = getStorage(app);

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

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)), [categories]);

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
      const storageRef = ref(storage, `categories/${form.slug}/image`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
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

  const inputClass = 'w-full min-h-11 rounded-[10px] border border-[#F2A8C8]/60 bg-[#FFF8FB] px-3 text-sm outline-none focus:border-[#FFB7D5] focus:bg-white';

  return (
    <div className="space-y-4 md:space-y-8">
      {toast && <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 z-[120] px-4 py-3 bg-white border border-[#FFB7D5] text-sm shadow-[0_18px_45px_rgba(26,26,26,0.08)]">{toast}</div>}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Ангиллын удирдлага</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Ангилал</h2>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="shrink-0 min-h-11 px-4 md:px-5 rounded-[10px] bg-[#1A1A1A] text-white text-sm shadow-[0_10px_24px_rgba(26,26,26,0.12)]"
        >
          <span className="hidden sm:inline">Шинэ ангилал нэмэх</span>
          <span className="sm:hidden text-lg leading-none">+</span>
        </button>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Нийт</p>
          <p className="mt-1 text-xl font-semibold">{sortedCategories.length}</p>
        </div>
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-[#FFF0F6] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Зурагтай</p>
          <p className="mt-1 text-xl font-semibold">{sortedCategories.filter(category => category.imageUrl).length}</p>
        </div>
        <div className="rounded-[14px] border border-[#F1D28A]/70 bg-[#FFF9EC] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#9A6A14]">Бараа</p>
          <p className="mt-1 text-xl font-semibold">{sortedCategories.reduce((sum, category) => sum + Number(category.productCount || 0), 0)}</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">{editingId ? 'Ангилал засах' : 'Шинэ ангилал'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#8B6B78] mb-1.5">Ангиллын нэр *</label>
              <input value={form.name_mn} onChange={event => handleNameChange(event.target.value)} className={inputClass} placeholder="Серум" />
            </div>
            <div>
              <label className="block text-sm text-[#8B6B78] mb-1.5">Slug *</label>
              <input value={form.slug} onChange={event => setForm(prev => ({ ...prev, slug: transliterateName(event.target.value) }))} className={inputClass} placeholder="serum" />
            </div>
            <div>
              <label className="block text-sm text-[#8B6B78] mb-1.5">Зураг</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={!form.slug || uploading} className={inputClass} />
            </div>
          </div>

          {form.imageUrl && <img src={form.imageUrl} alt={form.name_mn || 'Category'} className="mt-4 h-20 w-20 rounded-[12px] object-cover border border-[#F2A8C8]/50" />}

          <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={resetForm} className="min-h-11 px-4 rounded-[10px] border border-[#F2A8C8] text-sm">Болих</button>
            <button onClick={handleSubmit} disabled={saving || uploading || !form.name_mn || !form.slug} className="min-h-11 px-5 rounded-[10px] bg-[#1A1A1A] text-white text-sm disabled:opacity-50">
              {editingId ? 'Хадгалах' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[16px] bg-white border border-[#F2A8C8]/40 shadow-[0_10px_30px_rgba(26,26,26,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#8B6B78]">Ачаалж байна...</div>
        ) : (
          <div className="space-y-3 bg-[#FFF8FB] p-3 md:divide-y md:divide-[#F2A8C8]/30 md:space-y-0 md:bg-white md:p-0">
            {sortedCategories.map(category => (
              <div
                key={category.id}
                draggable
                onDragStart={() => setDraggedId(category.id)}
                onDragOver={event => event.preventDefault()}
                onDrop={event => handleDrop(category.id, event)}
                onDragEnd={() => setDraggedId(null)}
                className="rounded-[14px] border border-[#F2A8C8]/35 bg-white p-4 md:rounded-none md:border-0 md:p-5 hover:bg-[#FFF8FB] transition-colors shadow-[0_8px_24px_rgba(26,26,26,0.04)] md:shadow-none"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="shrink-0 text-xs text-[#8B6B78] cursor-move">⠿</span>
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name_mn} className="h-14 w-14 md:h-12 md:w-12 rounded-[12px] object-cover border border-[#F2A8C8]/50" />
                  ) : (
                    <div className="h-14 w-14 md:h-12 md:w-12 shrink-0 rounded-[12px] bg-[#FFD6E8]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-[15px] md:text-base">{category.name_mn}</p>
                    <p className="text-xs text-[#8B6B78] mt-1 break-all md:break-normal md:truncate">{category.slug}</p>
                    <p className="text-xs text-[#8B6B78] mt-0.5">{category.productCount || 0} бараа</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 md:mt-0 md:flex md:justify-end">
                  <button onClick={() => handleEdit(category)} className="min-h-10 px-3 rounded-[10px] border border-[#F2A8C8] bg-[#FFF8FB] text-xs">Засах</button>
                  <button onClick={() => handleDelete(category)} className="min-h-10 px-3 rounded-[10px] border border-[#F1B8B8] bg-[#FFF0F0] text-[#A14E4E] text-xs">Устгах</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
