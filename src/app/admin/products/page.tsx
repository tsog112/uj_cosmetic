'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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
    const interval = setInterval(() => setNow(new Date().getTime()), 60000); // update every minute
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
    if (!confirm('Энэ бүтээгдэхүүнийг устгах уу? Устгасны дараа сэргээх боломжгүй.')) return;
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
      alert('Устгахад алдаа гарлаа');
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
      if (!confirm(`Сонгосон ${selectedIds.size} барааг устгах уу?`)) return;
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
          } else {
            // Mock handled below in bulk
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
      alert('Алдаа гарлаа');
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
    if (days > 0) return `${days} хоног ${hours} цаг үлдлээ`;
    return `${hours} цаг үлдлээ`;
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
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Бүтээгдэхүүн</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
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
          className="bg-[#FFB7D5] text-[#1A1A1A] px-6 py-3 rounded-lg shadow-sm text-sm font-bold hover:bg-[#e89ebf] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          + Шинэ бараа нэмэх
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FFB7D5] rounded-full animate-spin"/>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-200 p-16 text-center rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </div>
          <p className="text-gray-500 font-medium text-lg mb-2">Бүтээгдэхүүн одоогоор алга байна</p>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">Нэмэх товчийг дарж дэлгүүртээ шинэ бараа нэмээрэй.</p>
          <button onClick={() => handleOpenForm()} className="text-[#FFB7D5] font-bold hover:underline">Шинэ бараа нэмэх</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => {
            const docId = p._id || p.id;
            const stockQuantity = Number(p.stockQuantity ?? p.stock ?? (p.inStock === false ? 0 : 999));
            const inStock = stockQuantity > 0 && p.inStock !== false;
            const stockBadgeClass = stockQuantity > 5
              ? 'bg-green-100 text-green-700 border-green-200'
              : stockQuantity > 0
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-red-100 text-red-700 border-red-200';
            
            // Auto expiry check
            let isSaleActive = !!p.salePrice;
            if (isSaleActive && p.saleEndDate) {
              const end = new Date(p.saleEndDate).getTime();
              if (end < now) isSaleActive = false; // client-side hide
            }

            return (
            <div key={docId} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all group flex flex-col relative ${selectedIds.has(docId) ? 'border-accent ring-2 ring-accent/20' : 'border-gray-200 hover:shadow-md'}`}>
              
              {/* Checkbox */}
              <div className="absolute top-3 right-3 z-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(docId)}
                  onChange={() => toggleSelect(docId)}
                  className="w-5 h-5 text-accent border-gray-300 rounded shadow-sm focus:ring-accent cursor-pointer"
                />
              </div>

              {/* Hover Quick Edit Overlay */}
              <div className={`absolute inset-0 z-20 bg-white/95 p-5 flex flex-col transition-opacity duration-200 ${quickEditId === docId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <h4 className="font-bold text-gray-900 mb-4 border-b pb-2">Хурдан засах</h4>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Үнэ (₮)</label>
                    <input 
                      type="number"
                      value={quickEditData.price}
                      onChange={e => setQuickEditData({...quickEditData, price: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:border-accent outline-none text-sm font-medium"
                    />
                  </div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">Нөөцтэй</span>
                    <input type="checkbox" checked={quickEditData.inStock} onChange={e => setQuickEditData({...quickEditData, inStock: e.target.checked})} className="w-4 h-4 text-accent" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">Онцлох</span>
                    <input type="checkbox" checked={quickEditData.featured} onChange={e => setQuickEditData({...quickEditData, featured: e.target.checked})} className="w-4 h-4 text-accent" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">Нийтлэгдсэн</span>
                    <input type="checkbox" checked={quickEditData.published} onChange={e => setQuickEditData({...quickEditData, published: e.target.checked})} className="w-4 h-4 text-accent" />
                  </label>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={(e) => {e.stopPropagation(); setQuickEditId(null);}} className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded">Цуцлах</button>
                  <button onClick={(e) => saveQuickEdit(docId, e)} className="flex-1 py-2 bg-accent text-white text-xs font-bold rounded">Хадгалах</button>
                </div>
              </div>

              <div className="aspect-[4/5] relative bg-gray-50 border-b border-gray-100 overflow-hidden cursor-pointer" onClick={() => handleOpenForm(p)}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name_mn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                
                {/* Status Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
                  {isSaleActive && (
                    <span className="bg-red-500 text-white text-[11px] font-bold uppercase rounded-md px-2 py-1 shadow-sm">
                      SALE
                    </span>
                  )}
                  {!p.published && (
                    <span className="bg-gray-800/80 text-white text-[11px] font-bold uppercase rounded-md px-2 py-1 shadow-sm backdrop-blur-md">
                      Цуцлагдсан
                    </span>
                  )}
                  <span className={`text-[11px] font-bold rounded-md px-2 py-1 shadow-sm border ${stockBadgeClass}`}>
                    Нөөц: {stockQuantity} ширхэг
                  </span>
                  {stockQuantity === 0 && (
                    <span className="bg-red-600 text-white text-[11px] font-bold uppercase rounded-md px-2 py-1 shadow-sm">
                      Дуусжээ
                    </span>
                  )}
                </div>

                {isSaleActive && p.saleEndDate && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold text-center py-1.5 pointer-events-none">
                    Хямдрал: {getSaleCountdown(p.saleEndDate)}
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category}</p>
                  <button onClick={(e) => openQuickEdit(p, e)} className="text-gray-400 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                </div>
                
                <h3 className="font-semibold text-gray-900 leading-snug mb-3 flex-1">{p.name_mn}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <p className={`font-bold text-lg ${isSaleActive ? 'text-red-500' : 'text-gray-900'}`}>
                    {formatPrice(isSaleActive ? p.salePrice : p.price)}
                  </p>
                  {isSaleActive && (
                    <p className="text-sm text-gray-400 line-through">{formatPrice(p.price)}</p>
                  )}
                </div>
                
                {/* Large Toggle for Stock */}
                <div className="mt-auto border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                    {inStock ? 'Нөөцтэй' : 'Дууссан'}
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-not-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-40 animate-slide-up">
          <div className="flex items-center gap-4">
            <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">{selectedIds.size}</span>
            <span className="font-medium text-gray-800">бараа сонгогдсон</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleBulkAction('outOfStock')} className="px-4 py-2 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">Нөөц дуусгах</button>
            <button onClick={() => handleBulkAction('publish')} className="px-4 py-2 text-sm font-medium rounded border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">Нийтлэх</button>
            <button onClick={() => handleBulkAction('hide')} className="px-4 py-2 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">Нуух</button>
            <button onClick={() => handleBulkAction('delete')} className="px-4 py-2 text-sm font-medium rounded border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Устгах</button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
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
