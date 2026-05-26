'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Search, Tags, Trash2, Droplet, Sparkles, Sun, Moon, Flower2, Leaf, Waves, Wind, Beaker, FlaskConical, Feather, Heart, Gem, ShieldPlus, Edit2, Check, CheckCircle2, MoreHorizontal, Syringe, Pill, Scale, Activity } from 'lucide-react';
import { useAdminCategories } from '@/lib/hooks/useAdmin';
import AdminConfirmSheet from '@/components/admin/AdminConfirmSheet';

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, mutate } = useAdminCategories();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState<any>(null);
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

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories || [];
    return (categories || []).filter((category: any) => category.name?.toLowerCase().includes(term));
  }, [categories, search]);
  const totalProducts = useMemo(() => (categories || []).reduce((sum: number, category: any) => sum + Number(category.productCount || 0), 0), [categories]);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2200);
  };

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const isEditing = Boolean(editingCategoryId);
      const url = isEditing ? `/api/admin/categories/${editingCategoryId}` : '/api/admin/categories';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon: selectedIcon, color: selectedColor, showOnHome }),
      });
      if (!response.ok) throw new Error();
      
      setName('');
      setSelectedIcon(ICONS[0].id);
      setSelectedColor(COLORS[0]);
      setShowOnHome(true);
      setEditingCategoryId(null);
      mutate();
      showMessage(isEditing ? 'Ангилал шинэчлэгдлээ' : 'Ангилал нэмэгдлээ');
    } catch {
      showMessage(editingCategoryId ? 'Ангилал шинэчлэхэд алдаа гарлаа' : 'Ангилал нэмэхэд алдаа гарлаа');
    } finally {
      setBusy(false);
    }
  };

  const handleEditCategory = (category: any) => {
    setName(category.name);
    setSelectedIcon(category.icon || ICONS[0].id);
    setSelectedColor(category.color || COLORS[0]);
    setShowOnHome(category.showOnHome !== false);
    setEditingCategoryId(category.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCategory = async (id: string) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Устгах боломжгүй');
      }
      mutate();
      showMessage('Ангилал устгагдлаа');
    } catch (error: any) {
      showMessage(error.message || 'Ангилал устгахад алдаа гарлаа');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 p-4 pb-[104px]">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Categories</p>
        <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-brand-text)]">Ангилал</h1>
        <p className="mt-2 text-[13px] text-[var(--color-brand-muted)]">Дэлгүүрийн барааг хурдан шүүх үндсэн ангиллуудаа эндээс удирдана.</p>
      </section>

      {message && <div className="rounded-[18px] bg-white p-3 text-center text-[12px] font-extrabold shadow-[var(--shadow-mobile-card)]">{message}</div>}

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-[20px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Нийт ангилал</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--color-brand-text)]">{categories?.length || 0}</p>
        </div>
        <div className="rounded-[20px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Бараа</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--color-brand-text)]">{totalProducts}</p>
        </div>
        <div className="rounded-[20px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Хайлтын үр дүн</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--color-brand-text)]">{filteredCategories.length}</p>
        </div>
      </section>

      <form onSubmit={createCategory} className="flex flex-col gap-3 rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
        <div className="flex gap-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ангиллын нэр" className="h-12 min-w-0 flex-1 rounded-full bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]" />
          <button disabled={busy || !name.trim()} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-5 text-sm font-bold text-white disabled:opacity-60" aria-label="Хадгалах">
            {busy ? <Loader2 size={18} className="animate-spin" /> : editingCategoryId ? <Check size={20} /> : <Plus size={20} />}
            <span className="hidden sm:inline">{editingCategoryId ? 'Хадгалах' : 'Нэмэх'}</span>
          </button>
        </div>
        
        {editingCategoryId && (
          <button type="button" onClick={() => { setEditingCategoryId(null); setName(''); setSelectedIcon(ICONS[0].id); setSelectedColor(COLORS[0]); setShowOnHome(true); }} className="text-[12px] font-bold text-[var(--color-brand-muted)] self-end hover:text-gray-800 mr-2">
            Цуцлах
          </button>
        )}
        
        <label className="flex cursor-pointer items-center gap-3 rounded-[16px] bg-[var(--color-brand-bg)] px-4 py-3 mt-1">
          <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand-accent)]" />
          <span className="text-sm font-bold text-[var(--color-brand-text)]">Нүүр хуудсанд харуулах</span>
        </label>
        
        <div className="mt-2 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand-muted)]">Icon сонгох</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedIcon(id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${selectedIcon === id ? 'bg-[var(--color-brand-accent)] text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand-muted)]">Өнгө сонгох</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </form>

      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ангиллын нэрээр хайх" className="h-12 w-full rounded-full border border-white bg-white pl-11 pr-4 text-[13px] font-semibold shadow-[var(--shadow-mobile-card)] outline-none focus:ring-2 focus:ring-[#f3b8cf]" />
      </div>

      <section className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-18 rounded-[22px] animate-shimmer" />)
        ) : filteredCategories.length ? (
          filteredCategories.map((category: any, index: number) => {
            const Icon = ICONS.find(i => i.id === category.icon)?.icon || Tags;
            return (
            <div key={category.id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[22px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
              <div 
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ color: category.color || 'var(--color-brand-accent)', background: `${category.color || '#E91E8C'}1A` }}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold text-[var(--color-brand-text)]">{category.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[11px] text-[var(--color-brand-muted)]">{category.productCount || 0} бүтээгдэхүүн</p>
                  {category.showOnHome !== false && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                      <CheckCircle2 size={10} /> Нүүрт
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => handleEditCategory(category)} disabled={busy} className="rounded-full bg-white p-3 text-blue-500 shadow-sm hover:bg-gray-50" aria-label={`${category.name} засах`}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setPendingDelete(category)} disabled={busy} className="rounded-full bg-[var(--status-error-bg)] p-3 text-[var(--status-error)]" aria-label={`${category.name} устгах`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            );
          })
        ) : (
          <div className="rounded-[24px] bg-white p-10 text-center text-sm font-bold text-[var(--color-brand-muted)] shadow-[var(--shadow-mobile-card)]">Ангилал олдсонгүй</div>
        )}
      </section>

      <AdminConfirmSheet
        open={Boolean(pendingDelete)}
        title="Ангилал устгах уу?"
        body="Ангиллыг устгахад холбогдсон бараануудын ангилал автоматаар 'Бусад' руу шилжих болно. Үргэлжлүүлэх үү?"
        confirmLabel="Устгах"
        destructive
        loading={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void deleteCategory(pendingDelete.id).then(() => setPendingDelete(null));
        }}
      />
    </div>
  );
}
