'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { formatPrice } from '@/types';
import ProductForm from '@/components/admin/ProductForm';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <h2 className="font-serif text-3xl text-charcoal tracking-wide">Бүтээгдэхүүн</h2>
          <label className="flex items-center gap-3 text-sm text-neutral-500 cursor-pointer editorial-label mt-1">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-charcoal border-border rounded-none focus:ring-0"
              checked={products.length > 0 && selectedIds.size === products.length}
              onChange={(e) => {
                if (e.target.checked) setSelectedIds(new Set(products.map(p => p._id || p.id)));
                else setSelectedIds(new Set());
              }}
            />
            Бүгдийг сонгох
          </label>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="btn-premium"
        >
          Бараа нэмэх
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-8 h-8 border border-charcoal border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-sand border border-border p-24 text-center">
          <p className="font-serif italic text-xl text-neutral-500 mb-6">Бүтээгдэхүүн олдсонгүй.</p>
          <button onClick={() => handleOpenForm()} className="editorial-label border-b border-charcoal pb-1 text-charcoal hover:opacity-50 transition-opacity">Эхний барааг нэмэх</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(p => {
            const docId = p._id || p.id;
            const stockQuantity = Number(p.stockQuantity ?? p.stock ?? (p.inStock === false ? 0 : 999));
            const inStock = stockQuantity > 0 && p.inStock !== false;
            
            let isSaleActive = !!p.salePrice;
            if (isSaleActive && p.saleEndDate) {
              const end = new Date(p.saleEndDate).getTime();
              if (end < now) isSaleActive = false;
            }

            return (
            <div key={docId} className={`bg-sand border flex flex-col relative transition-all duration-300 ${selectedIds.has(docId) ? 'border-charcoal' : 'border-border'}`}>
              
              {/* Checkbox */}
              <div className="absolute top-4 right-4 z-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(docId)}
                  onChange={() => toggleSelect(docId)}
                  className="w-4 h-4 text-charcoal border-border rounded-none shadow-none focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Hover Quick Edit Overlay */}
              <div className={`absolute inset-0 z-20 bg-sand/95 backdrop-blur-sm p-6 flex flex-col transition-opacity duration-300 ${quickEditId === docId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <h4 className="font-serif text-xl text-charcoal mb-6 border-b border-border pb-2">Хурдан засах</h4>
                <div className="space-y-6 flex-1">
                  <div>
                    <label className="editorial-label block mb-2">Үнэ (₮)</label>
                    <input 
                      type="number"
                      value={quickEditData.price}
                      onChange={e => setQuickEditData({...quickEditData, price: e.target.value})}
                      className="w-full p-3 bg-sand border border-border text-sm focus:outline-none focus:border-charcoal rounded-none"
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
                <div className="flex gap-4 mt-6">
                  <button onClick={(e) => {e.stopPropagation(); setQuickEditId(null);}} className="flex-1 py-3 border border-charcoal text-charcoal editorial-label hover:bg-charcoal hover:text-sand transition-colors">Цуцлах</button>
                  <button onClick={(e) => saveQuickEdit(docId, e)} className="flex-1 py-3 bg-charcoal border border-charcoal text-sand editorial-label hover:bg-transparent hover:text-charcoal transition-colors">Хадгалах</button>
                </div>
              </div>

              <div className="aspect-[4/5] relative bg-[#F9F8F6] border-b border-border overflow-hidden cursor-pointer" onClick={() => handleOpenForm(p)}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name_mn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out-expo" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center editorial-label text-neutral-400">
                    Зураггүй
                  </div>
                )}
                
                {/* Status Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 items-start pointer-events-none">
                  {isSaleActive && (
                    <span className="bg-[#E8D5D0] text-charcoal editorial-label px-3 py-1">
                      ХЯМДРАЛ
                    </span>
                  )}
                  {!p.published && (
                    <span className="bg-charcoal/80 backdrop-blur-md text-white editorial-label px-3 py-1">
                      Нууцлагдсан
                    </span>
                  )}
                  <span className={`editorial-label px-3 py-1 bg-sand border border-border ${stockQuantity === 0 ? 'text-red-500' : 'text-charcoal'}`}>
                    Нөөц: {stockQuantity}
                  </span>
                </div>

                {isSaleActive && p.saleEndDate && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#E8D5D0]/90 backdrop-blur-md text-charcoal editorial-label text-center py-2 pointer-events-none">
                    {getSaleCountdown(p.saleEndDate)}
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col group cursor-pointer" onClick={() => handleOpenForm(p)}>
                <div className="flex justify-between items-start mb-2">
                  <p className="editorial-label">{p.category || 'Ангилалгүй'}</p>
                  <button onClick={(e) => openQuickEdit(p, e)} className="text-neutral-400 hover:text-charcoal transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                </div>
                
                <h3 className="font-serif text-lg text-charcoal leading-snug tracking-wide mb-4 flex-1">{p.name_mn}</h3>
                
                <div className="flex items-center gap-3 mb-6">
                  <p className="font-sans text-sm font-medium tracking-wide text-charcoal">
                    {formatPrice(isSaleActive ? p.salePrice : p.price)}
                  </p>
                  {isSaleActive && (
                    <p className="font-sans text-xs text-neutral-400 line-through">{formatPrice(p.price)}</p>
                  )}
                </div>
                
                <div className="mt-auto border-t border-border pt-4 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <span className={`editorial-label ${inStock ? 'text-charcoal' : 'text-red-500'}`}>
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
                    <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-sand after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-charcoal"></div>
                  </label>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-sand border-t border-border p-6 flex flex-col sm:flex-row items-center justify-between gap-6 z-40">
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
