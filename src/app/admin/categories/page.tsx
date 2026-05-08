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

const emptyForm: CategoryFormState = {
  name_mn: '',
  slug: '',
  imageUrl: '',
};

const storage = getStorage(app);

function transliterateName(value: string) {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i',
    ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return value
    .toLowerCase()
    .split('')
    .map(char => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
    [categories]
  );

  const fetchCategories = async () => {
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

      await Promise.all(
        nextCategories.map(category =>
          setDoc(
            doc(db, 'categories', category.id),
            { productCount: category.productCount },
            { merge: true }
          )
        )
      );
      setCategories(nextCategories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories().catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      name_mn: value,
      slug: editingId ? prev.slug : transliterateName(value),
    }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSubmit = async () => {
    if (!form.name_mn.trim() || !form.slug.trim()) return;

    setSaving(true);
    try {
      const slug = form.slug.trim().toLowerCase();
      const categoryId = slug;
      const order = form.order ?? sortedCategories.length + 1;
      await setDoc(
        doc(db, 'categories', categoryId),
        {
          id: categoryId,
          name_mn: form.name_mn.trim(),
          slug,
          imageUrl: form.imageUrl || '',
          order,
          productCount: form.productCount ?? 0,
          createdAt: editingId ? (form.createdAt || serverTimestamp()) : serverTimestamp(),
        },
        { merge: true }
      );

      if (editingId && form.originalSlug && form.originalSlug !== slug) {
        const productsSnap = await getDocs(query(collection(db, 'products'), where('category', '==', form.originalSlug)));
        const batch = writeBatch(db);
        productsSnap.docs.forEach(productDoc => {
          batch.update(productDoc.ref, { category: slug });
        });
        await batch.commit();
      }

      if (editingId && editingId !== categoryId) {
        await deleteDoc(doc(db, 'categories', editingId));
      }

      resetForm();
      await fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
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
  };

  const handleDelete = async (category: Category) => {
    const productsSnap = await getDocs(query(collection(db, 'products'), where('category', '==', category.slug)));
    const message = productsSnap.size > 0
      ? `Энэ ангилалд ${productsSnap.size} бараа байна. Устгасан тохиолдолд тэдгээр бараа 'Бусад' ангилалд шилжинэ.`
      : 'Энэ ангиллыг устгах уу?';

    if (!confirm(`${message}\n\nҮргэлжлүүлэх үү?`)) return;

    const batch = writeBatch(db);
    productsSnap.docs.forEach(productDoc => {
      batch.update(productDoc.ref, { category: 'other' });
    });
    batch.delete(doc(db, 'categories', category.id));
    await batch.commit();
    await fetchCategories();
  };

  const saveOrder = async (nextCategories: Category[]) => {
    await Promise.all(
      nextCategories.map((category, index) =>
        updateDoc(doc(db, 'categories', category.id), { order: index + 1 })
      )
    );
  };

  const handleDrop = async (targetId: string, event: DragEvent<HTMLTableRowElement>) => {
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
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ангилал удирдлага</h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="bg-[#FFB7D5] hover:bg-[#f5a0c5] text-[#1A1A1A] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          ШИНЭ АНГИЛАЛ НЭМЭХ
        </button>
      </div>

      {showForm && (
        <div className="bg-sand border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ангилын нэр *</label>
              <input
                value={form.name_mn}
                onChange={event => handleNameChange(event.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]"
                placeholder="Серум"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={event => setForm(prev => ({ ...prev, slug: transliterateName(event.target.value) }))}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB7D5]"
                placeholder="serum"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Зураг upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={!form.slug || uploading}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {form.imageUrl && (
            <img src={form.imageUrl} alt={form.name_mn || 'Category'} className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
          )}

          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">
              Болих
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || uploading || !form.name_mn || !form.slug}
              className="bg-[#1A1A1A] text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {editingId ? 'Хадгалах' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-sand border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Ачаалж байна...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Эрэмбэ</th>
                <th className="px-4 py-3 text-left">Зураг</th>
                <th className="px-4 py-3 text-left">Нэр</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-center">Бараа</th>
                <th className="px-4 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCategories.map(category => (
                <tr
                  key={category.id}
                  draggable
                  onDragStart={() => setDraggedId(category.id)}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => handleDrop(category.id, event)}
                  onDragEnd={() => setDraggedId(null)}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-400 cursor-move">⠿</td>
                  <td className="px-4 py-3">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name_mn} className="h-10 w-10 object-cover rounded border border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[#FFD6E8]" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{category.name_mn}</td>
                  <td className="px-4 py-3 text-gray-500">{category.slug}</td>
                  <td className="px-4 py-3 text-center">{category.productCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(category)} className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200">
                        Засах
                      </button>
                      <button onClick={() => handleDelete(category)} className="px-3 py-1.5 rounded bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100">
                        Устгах
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
