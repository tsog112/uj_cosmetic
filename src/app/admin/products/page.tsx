'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { formatPrice } from '@/types';
import ProductForm from '@/components/admin/ProductForm';
import Pagination, { paginate } from '@/components/admin/Pagination';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Quick Edit
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditData, setQuickEditData] = useState<any>({});
  
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const q = query(collection(db, "products"));
        const snap = await getDocs(q);
        const fetched: any[] = [];
        snap.forEach(doc => {
          fetched.push({ _id: doc.id, ...doc.data() });
        });
        fetched.sort((a, b) => {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
           return timeB - timeA;
        });
        setProducts(fetched);
      } else {
        const mockProds = JSON.parse(localStorage.getItem('mock_products') || '[]');
        setProducts(mockProds.reverse());
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product: any = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Энэ барааг бүр мөсөн устгах уу?')) return;
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await deleteDoc(doc(db, "products", id));
      } else {
        const mockProds = JSON.parse(localStorage.getItem('mock_products') || '[]');
        localStorage.setItem('mock_products', JSON.stringify(mockProds.filter((p:any) => p.id !== id && p._id !== id)));
      }
      setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (error) {
      console.error(error);
      alert('Устгаж чадсангүй');
    }
  };

  const updateProductField = async (id: string, updates: any) => {
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await updateDoc(doc(db, "products", id), updates);
      } else {
        const mockProds = JSON.parse(localStorage.getItem('mock_products') || '[]');
        const updated = mockProds.map((p:any) => (p.id === id || p._id === id) ? {...p, ...updates} : p);
        localStorage.setItem('mock_products', JSON.stringify(updated));
      }
      setProducts(prev => prev.map(p => (p.id === id || p._id === id) ? {...p, ...updates} : p));
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkAction = async (action: 'outOfStock' | 'publish' | 'hide' | 'delete') => {
    if (selectedIds.size === 0) return;
    
    if (action === 'delete') {
      if (!confirm(`${selectedIds.size} барааг бүр мөсөн устгах уу?`)) return;
    }

    try {
      for (const id of selectedIds) {
        if (action === 'delete') {
          if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            await deleteDoc(doc(db, "products", id));
          }
        } else {
          let updates: any = {};
          if (action === 'outOfStock') {
            updates.inStock = false;
            updates.stockQuantity = 0;
          }
          if (action === 'publish') updates.published = true;
          if (action === 'hide') updates.published = false;
          
          if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            await updateDoc(doc(db, "products", id), updates);
          }
        }
      }

      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        let mockProds = JSON.parse(localStorage.getItem('mock_products') || '[]');
        if (action === 'delete') {
          mockProds = mockProds.filter((p:any) => !selectedIds.has(p.id) && !selectedIds.has(p._id));
        } else {
          mockProds = mockProds.map((p:any) => {
            if (selectedIds.has(p.id) || selectedIds.has(p._id)) {
              if (action === 'outOfStock') {
                p.inStock = false;
                p.stockQuantity = 0;
              }
              if (action === 'publish') p.published = true;
              if (action === 'hide') p.published = false;
            }
            return p;
          });
        }
        localStorage.setItem('mock_products', JSON.stringify(mockProds));
      }
      
      setSelectedIds(new Set());
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert('Үйлдэл амжилтгүй');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchProducts();
  };

  const getSaleCountdown = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    if (end < now) return "Хугацаа дууссан";
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}х ${hours}ц үлдлээ`;
    return `${hours}ц үлдлээ`;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openQuickEdit = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickEditId(p._id || p.id);
    setQuickEditData({
      price: p.price,
      inStock: p.inStock !== false,
      featured: p.featured || false,
      published: p.published !== false
    });
  };

  const saveQuickEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = products.find(prod => (prod._id === id || prod.id === id));
    if (!p) return;
    
    const updates: any = {};
    if (quickEditData.price !== p.price) updates.price = Number(quickEditData.price);
    if (quickEditData.inStock !== (p.inStock !== false)) updates.inStock = quickEditData.inStock;
    if (quickEditData.featured !== (p.featured || false)) updates.featured = quickEditData.featured;
    if (quickEditData.published !== (p.published !== false)) updates.published = quickEditData.published;
    
    if (Object.keys(updates).length > 0) {
      await updateProductField(id, updates);
    }
    setQuickEditId(null);
  };

  const productSummary = useMemo(() => {
    const outOfStock = products.filter(product => Number(product.stockQuantity ?? product.stock ?? (product.inStock === false ? 0 : 999)) <= 0 || product.inStock === false).length;
    const hidden = products.filter(product => product.published === false).length;
    const lowStock = products.filter(product => {
      const stockQuantity = Number(product.stockQuantity ?? product.stock ?? (product.inStock === false ? 0 : 999));
      return stockQuantity > 0 && stockQuantity <= 5;
    }).length;

    return { total: products.length, outOfStock, hidden, lowStock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return products;
    return products.filter(product =>
      (product.name_mn || '').toLowerCase().includes(term) ||
      (product.name_en || '').toLowerCase().includes(term) ||
      (product.category || '').toLowerCase().includes(term) ||
      (product.slug || '').toLowerCase().includes(term)
    );
  }, [products, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginatedProducts = useMemo(() => paginate(filteredProducts, page, 10), [filteredProducts, page]);

  return (
    <div className="space-y-4 md:space-y-8 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Барааны удирдлага</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Бүтээгдэхүүн</h2>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="shrink-0 min-h-11 px-4 md:px-5 rounded-[10px] bg-[#1A1A1A] text-white text-sm shadow-[0_10px_24px_rgba(26,26,26,0.12)]"
        >
          <span className="hidden sm:inline">Бараа нэмэх</span>
          <span className="sm:hidden text-lg leading-none">+</span>
        </button>
      </div>

      <div className="md:hidden grid grid-cols-4 gap-2">
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Нийт</p>
          <p className="mt-1 text-xl font-semibold">{productSummary.total}</p>
        </div>
        <div className="rounded-[14px] border border-[#F1D28A]/70 bg-[#FFF9EC] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#9A6A14]">Бага</p>
          <p className="mt-1 text-xl font-semibold">{productSummary.lowStock}</p>
        </div>
        <div className="rounded-[14px] border border-[#F1B8B8]/70 bg-[#FFF0F0] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#A14E4E]">Дууссан</p>
          <p className="mt-1 text-xl font-semibold">{productSummary.outOfStock}</p>
        </div>
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-[#FFF0F6] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Нуусан</p>
          <p className="mt-1 text-xl font-semibold">{productSummary.hidden}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-8 h-8 border border-charcoal border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-[#F2A8C8]/40 p-12 md:p-20 text-center shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <p className="font-serif text-xl text-[#8B6B78] mb-6">Бүтээгдэхүүн олдсонгүй.</p>
          <button onClick={() => handleOpenForm()} className="text-xs tracking-[0.14em] uppercase border-b border-[#FFB7D5] pb-1">Эхний барааг нэмэх</button>
        </div>
      ) : (
        <>
        <div className="rounded-[16px] border border-[#F2A8C8]/40 bg-white p-4 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Бүтээгдэхүүний нэр, ангилал, slug-аар хайх..."
              className="w-full min-h-11 rounded-[10px] border border-[#F2A8C8]/60 bg-[#FFF8FB] pl-10 pr-4 text-sm outline-none placeholder:text-[#8B6B78]/70 focus:border-[#FFB7D5] focus:bg-white"
            />
            <svg className="absolute left-4 top-3.5 text-[#8B6B78]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-[#F2C7D8] bg-[#FFF8FB] px-4 text-sm font-semibold text-[#241820] transition-colors hover:bg-[#FFF0F6]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#D994B5]"
              checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
              onChange={(e) => {
                if (e.target.checked) setSelectedIds(new Set(filteredProducts.map(p => p._id || p.id)));
                else setSelectedIds(new Set());
              }}
            />
            Бүгдийг сонгох
          </label>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {paginatedProducts.map(p => {
            const docId = p._id || p.id;
            const stockQuantity = Number(p.stockQuantity ?? p.stock ?? (p.inStock === false ? 0 : 999));
            const inStock = stockQuantity > 0 && p.inStock !== false;
            
            let isSaleActive = !!p.salePrice;
            if (isSaleActive && p.saleEndDate) {
              const end = new Date(p.saleEndDate).getTime();
              if (end < now) isSaleActive = false;
            }

            return (
            <div key={docId} className={`bg-white border flex flex-col relative overflow-hidden rounded-[14px] transition-all duration-300 shadow-[0_8px_24px_rgba(26,26,26,0.045)] ${selectedIds.has(docId) ? 'border-[#FFB7D5]' : 'border-[#F2A8C8]/40'}`}>
              
              {/* Checkbox */}
              <div className="absolute top-3 right-3 z-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(docId)}
                  onChange={() => toggleSelect(docId)}
                  className="w-5 h-5 rounded-[6px] accent-[#FFB7D5] cursor-pointer"
                />
              </div>

              {/* Hover Quick Edit Overlay */}
              <div className={`absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-5 flex flex-col transition-opacity duration-300 ${quickEditId === docId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <h4 className="text-lg font-semibold text-[#1A1A1A] mb-5 border-b border-[#F2A8C8]/40 pb-3">Хурдан засах</h4>
                <div className="space-y-6 flex-1">
                  <div>
                    <label className="editorial-label block mb-2">Үнэ (₮)</label>
                    <input 
                      type="number"
                      value={quickEditData.price}
                      onChange={e => setQuickEditData({...quickEditData, price: e.target.value})}
                      className="w-full p-3 bg-[#FFF8FB] border border-[#F2A8C8]/60 text-sm focus:outline-none focus:border-[#FFB7D5]"
                    />
                  </div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-sans text-sm text-charcoal">Нөөцтэй</span>
                    <input type="checkbox" checked={quickEditData.inStock} onChange={e => setQuickEditData({...quickEditData, inStock: e.target.checked})} className="w-4 h-4 text-charcoal border-border rounded-none" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-sans text-sm text-charcoal">Онцлох</span>
                    <input type="checkbox" checked={quickEditData.featured} onChange={e => setQuickEditData({...quickEditData, featured: e.target.checked})} className="w-4 h-4 text-charcoal border-border rounded-none" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-sans text-sm text-charcoal">Нийтлэгдсэн</span>
                    <input type="checkbox" checked={quickEditData.published} onChange={e => setQuickEditData({...quickEditData, published: e.target.checked})} className="w-4 h-4 text-charcoal border-border rounded-none" />
                  </label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={(e) => {e.stopPropagation(); setQuickEditId(null);}} className="flex-1 min-h-11 rounded-[10px] border border-[#F2A8C8] text-sm hover:bg-[#FFF8FB] transition-colors">Цуцлах</button>
                  <button onClick={(e) => saveQuickEdit(docId, e)} className="flex-1 min-h-11 rounded-[10px] bg-[#1A1A1A] text-white text-sm">Хадгалах</button>
                </div>
              </div>

              <div className="aspect-[4/5] relative bg-[#FFF0F6] border-b border-[#F2A8C8]/40 overflow-hidden cursor-pointer" onClick={() => handleOpenForm(p)}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name_mn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out-expo" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center editorial-label text-neutral-400">
                    Зураггүй
                  </div>
                )}
                
                {/* Status Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
                  {isSaleActive && (
                    <span className="rounded-[7px] bg-[#1A1A1A] text-white text-[9px] tracking-[0.12em] uppercase px-2 py-1">
                      ХЯМДРАЛ
                    </span>
                  )}
                  {!p.published && (
                    <span className="rounded-[7px] bg-[#1A1A1A]/80 backdrop-blur-md text-white text-[9px] tracking-[0.12em] uppercase px-2 py-1">
                      Нууцлагдсан
                    </span>
                  )}
                  <span className={`rounded-[7px] border px-2 py-1 text-[9px] tracking-[0.08em] uppercase bg-white/90 ${stockQuantity === 0 ? 'border-[#F1B8B8] text-[#A14E4E]' : stockQuantity <= 5 ? 'border-[#F1D28A] text-[#9A6A14]' : 'border-[#F2A8C8]/50 text-[#1A1A1A]'}`}>
                    Нөөц: {stockQuantity}
                  </span>
                </div>

                {isSaleActive && p.saleEndDate && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#E8D5D0]/90 backdrop-blur-md text-charcoal editorial-label text-center py-2 pointer-events-none">
                    {getSaleCountdown(p.saleEndDate)}
                  </div>
                )}
              </div>
              
              <div className="p-4 md:p-5 flex-1 flex flex-col group cursor-pointer" onClick={() => handleOpenForm(p)}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">{p.category || 'Ангилалгүй'}</p>
                  <button onClick={(e) => openQuickEdit(p, e)} className="text-neutral-400 hover:text-charcoal transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                </div>
                
                <h3 className="text-[15px] font-semibold text-[#1A1A1A] leading-snug mb-4 flex-1">{p.name_mn}</h3>
                
                <div className="flex items-center gap-3 mb-6">
                  <p className="font-sans text-sm font-medium tracking-wide text-charcoal">
                    {formatPrice(isSaleActive ? p.salePrice : p.price)}
                  </p>
                  {isSaleActive && (
                    <p className="font-sans text-xs text-neutral-400 line-through">{formatPrice(p.price)}</p>
                  )}
                </div>
                
                <div className="mt-auto border-t border-[#F2A8C8]/35 pt-4 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <span className={`text-[10px] tracking-[0.1em] uppercase ${inStock ? 'text-[#1A1A1A]' : 'text-[#A14E4E]'}`}>
                    {inStock ? 'Боломжтой' : 'Дууссан'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={() => updateProductField(docId, {
                        inStock: !inStock,
                        stockQuantity: !inStock ? Math.max(stockQuantity, 1) : 0
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#E9DDE2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#F2A8C8]/60 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A1A1A]"></div>
                  </label>
                </div>
              </div>
            </div>
          )})}
        </div>
        <Pagination page={page} totalItems={filteredProducts.length} onPageChange={setPage} />
        </>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-[62px] md:bottom-0 left-0 md:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-[#F2A8C8]/40 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 z-40 shadow-[0_-12px_28px_rgba(26,26,26,0.06)]">
          <div className="flex items-center gap-4">
            <span className="font-serif italic text-xl text-charcoal">{selectedIds.size}</span>
            <span className="editorial-label text-charcoal mt-1">Бараа сонгогдсон</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleBulkAction('outOfStock')} className="editorial-label border-b border-transparent hover:border-charcoal pb-1 transition-all text-charcoal">Нөөц дуусгах</button>
            <button onClick={() => handleBulkAction('publish')} className="editorial-label border-b border-transparent hover:border-charcoal pb-1 transition-all text-charcoal">Нийтлэх</button>
            <button onClick={() => handleBulkAction('hide')} className="editorial-label border-b border-transparent hover:border-charcoal pb-1 transition-all text-charcoal">Нуух</button>
            <button onClick={() => handleBulkAction('delete')} className="editorial-label border-b border-transparent hover:border-red-500 pb-1 transition-all text-red-500">Устгах</button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl flex justify-center max-h-full">
            <ProductForm 
              initialData={editingProduct} 
              onCancel={() => setIsModalOpen(false)} 
              onSuccess={handleFormSuccess} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
