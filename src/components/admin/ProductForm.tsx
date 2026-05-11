'use client';

import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { doc, collection, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { Category } from '@/types';

interface ProductFormProps {
  initialData?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ initialData, onCancel, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Basic Fields
  const [name_mn, setNameMn] = useState(initialData?.name_mn || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceStr, setPriceStr] = useState(initialData?.price?.toString() || '');
  const [salePriceStr, setSalePriceStr] = useState(initialData?.salePrice?.toString() || '');
  const [stockQuantity, setStockQuantity] = useState<number>(
    Number(initialData?.stockQuantity ?? initialData?.stock ?? (initialData?.inStock === false ? 0 : 50))
  );
  const [saleEndDate, setSaleEndDate] = useState(initialData?.saleEndDate || '');
  const [description_mn, setDescriptionMn] = useState(initialData?.description_mn || '');
  const [ingredients, setIngredients] = useState(initialData?.ingredients || '');
  const [howToUse, setHowToUse] = useState(initialData?.howToUse || '');
  
  // Toggles
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [outOfStock, setOutOfStock] = useState(initialData ? !initialData.inStock : false);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialization
  useEffect(() => {
    if (initialData?.images) {
      setImages(initialData.images);
    }
  }, [initialData]);

  useEffect(() => {
    getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')))
      .then(snap => {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setCategories(fetched);
        if (!initialData?.category && fetched[0]?.slug) {
          setCategory(fetched[0].slug);
        }
      })
      .catch(() => setCategories([]));
  }, [initialData?.category]);

  const formatPriceInput = (val: string) => {
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('en-US');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPriceInput(e.target.value));
  };

  const handleStockQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextStock = parseInt(e.target.value, 10) || 0;
    setStockQuantity(nextStock);
    setOutOfStock(nextStock <= 0);
  };

  async function handleImageUpload(files: FileList | File[]) {
    if (!files.length) return;
    const slug = name_mn ? name_mn.toLowerCase().replace(/[\s\W]+/g, '-') : `product-${Date.now()}`;
    setUploading(true);
    
    try {
      const fileArray = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5); // max 5 images
      if (fileArray.length === 0) return;
      
      setUploadProgress(new Array(fileArray.length).fill(0));
      
      const { uploadMultipleImages } = await import('@/lib/uploadImage');
      const urls = await uploadMultipleImages(
        fileArray,
        slug,
        (fileIndex, progress) => {
          setUploadProgress(prev => {
            const next = [...prev];
            next[fileIndex] = progress;
            return next;
          });
        }
      );
      
      setImages(prev => [...prev, ...urls].slice(0, 5));
    } catch (error) {
      alert('Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.');
      console.error('[ProductForm] Image upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress([]);
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleImageUpload(e.target.files);
    }
  };

  const handleDropUpload = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleImageUpload(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Drag to reorder
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...images];
    const draggedItem = items[draggedIdx];
    items.splice(draggedIdx, 1);
    items.splice(idx, 0, draggedItem);
    setDraggedIdx(idx);
    setImages(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploading) {
      alert("Файл хуулж дуустал хүлээнэ үү.");
      return;
    }

    if (images.length === 0) {
      alert("Ядаж 1 зураг оруулна уу.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let productId = initialData?.id;
      if (!productId) {
        productId = doc(collection(db, "products")).id;
      }

      const numPrice = Number(priceStr.replace(/,/g, ''));
      const numSalePrice = salePriceStr ? Number(salePriceStr.replace(/,/g, '')) : null;
      
      const slug = name_mn.toLowerCase().replace(/[\s\W]+/g, '-');

      const productData = {
        id: productId,
        slug,
        name_mn,
        name_en: initialData?.name_en || name_mn,
        price: numPrice,
        salePrice: numSalePrice,
        saleEndDate: numSalePrice && saleEndDate ? saleEndDate : null,
        category,
        description_mn,
        ingredients,
        howToUse,
        images: images,
        featured,
        published,
        inStock: stockQuantity > 0 && !outOfStock,
        stockQuantity: outOfStock ? 0 : stockQuantity,
        updatedAt: serverTimestamp(),
      };

      if (!initialData) {
        (productData as any).createdAt = serverTimestamp();
        (productData as any).orderCount = 0;
      }

      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        if (initialData) {
          await updateDoc(doc(db, "products", productId), productData);
        } else {
          await setDoc(doc(db, "products", productId), productData);
        }
      } else {
        // Mock
        const mockProds = JSON.parse(localStorage.getItem('mock_products') || '[]');
        if (initialData) {
          const updated = mockProds.map((p:any) => p.id === productId ? { ...p, ...productData } : p);
          localStorage.setItem('mock_products', JSON.stringify(updated));
        } else {
          mockProds.push(productData);
          localStorage.setItem('mock_products', JSON.stringify(mockProds));
        }
      }

      setToastMessage("Амжилттай хадгаллаа!");
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (error) {
      console.error(error);
      alert("Хадгалахад алдаа гарлаа");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-[#F2A8C8]/40">
      <div className="px-5 md:px-6 py-4 border-b border-[#F2A8C8]/40 flex justify-between items-center sticky top-0 bg-white z-10">
        <h2 className="font-serif text-xl md:text-2xl font-light text-[#1A1A1A]">{initialData ? 'Бараа засах' : 'Шинэ бараа нэмэх'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-6 pb-28 md:pb-6">
        <form id="product-form" onSubmit={handleSubmit} className="space-y-10">
          
          {/* SECTION 1 - MEDIA */}
          <section>
            <h3 className="text-[11px] font-medium text-[#8B6B78] uppercase tracking-[0.18em] mb-4 border-b border-[#F2A8C8]/40 pb-2">Зураг</h3>
            
            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDropUpload}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`min-h-[180px] border border-dashed border-[#FFB7D5] p-6 md:p-10 text-center cursor-pointer hover:bg-[#FFF0F6] transition-colors mb-4 group ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-14 h-14 mx-auto bg-[#FFF0F6] flex items-center justify-center text-[#FFB7D5] group-hover:scale-105 transition-transform mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="font-medium text-gray-700 mb-1">Зургаа энд чирж буулга эсвэл дарж сонго</p>
              <p className="text-xs text-gray-500">JPG, PNG, WEBP. Хамгийн ихдээ 5 зураг.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                multiple 
                accept="image/*" 
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
              {images.map((url, idx) => (
                <div 
                  key={idx} 
                  draggable 
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  className="relative aspect-square overflow-hidden border border-[#F2A8C8]/50 cursor-move group"
                >
                  <img src={url} alt="upload" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[9px] font-bold text-center py-0.5">НҮҮР</span>
                  )}
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}

              {/* Progress bars for currently uploading images */}
              {uploading && uploadProgress.map((prog, idx) => (
                <div key={`prog-${idx}`} className="relative aspect-square overflow-hidden border border-[#F2A8C8]/50 bg-[#FFF8FB] flex flex-col items-center justify-center">
                   <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                     <div className="h-full bg-accent" style={{width: `${prog}%`}} />
                   </div>
                   <span className="text-[10px] text-gray-500 font-bold">{prog}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2 - INFO */}
          <section>
            <h3 className="text-[11px] font-medium text-[#8B6B78] uppercase tracking-[0.18em] mb-4 border-b border-[#F2A8C8]/40 pb-2">Барааны мэдээлэл</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Барааны нэр *</label>
                <input 
                  required 
                  value={name_mn} 
                  onChange={e => setNameMn(e.target.value)} 
                  placeholder="Жишээ: UJ Серум Арьс тэнцвэржүүлэгч" 
                  className="w-full min-h-12 p-4 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none text-[#1A1A1A] placeholder:text-[#8B6B78]/60 bg-white"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ангилал *</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    required
                    className="w-full min-h-12 p-4 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none bg-white text-[#1A1A1A]"
                  >
                    <option value="">Ангилал сонгоно уу</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name_mn}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Үнэ *</label>
                  <div className="relative">
                    <input 
                      required 
                      value={priceStr} 
                      onChange={e => handlePriceChange(e, setPriceStr)} 
                      placeholder="89,000" 
                      className="w-full min-h-12 p-4 pr-10 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none text-[#1A1A1A] font-medium bg-white"
                    />
                    <span className="absolute right-4 top-4 text-gray-500 font-medium">₮</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Нөөцийн тоо *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={handleStockQuantityChange}
                    placeholder="0"
                    className="w-full min-h-12 p-4 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none text-[#1A1A1A] font-medium bg-white"
                  />
                </div>
              </div>

              {/* ХЯМДРАЛ ТОХИРУУЛАХ */}
              <div className="bg-[#FFF8FB] p-5 border border-[#F2A8C8]/40 space-y-4">
                <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  Хямдрал тохируулах
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Хямдарсан үнэ (₮)</label>
                    <input 
                      value={salePriceStr} 
                      onChange={e => handlePriceChange(e, setSalePriceStr)} 
                      placeholder="Хямдарсан үнэ..." 
                      className="w-full p-3 border border-red-200 rounded-md focus:border-red-400 focus:outline-none text-red-600 font-bold placeholder-red-300 bg-sand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Дуусах огноо (заавал биш)</label>
                    <input 
                      type="datetime-local"
                      value={saleEndDate}
                      onChange={e => setSaleEndDate(e.target.value)}
                      className="w-full p-3 border border-red-200 rounded-md focus:border-red-400 focus:outline-none text-gray-700 bg-sand"
                    />
                  </div>
                </div>
                {salePriceStr && (
                  <p className="text-xs text-red-500">
                    Үндсэн үнэ: <span className="line-through">{priceStr}₮</span> → Хямдарсан: <b>{salePriceStr}₮</b>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тайлбар</label>
                <textarea 
                  maxLength={500}
                  rows={4} 
                  value={description_mn} 
                  onChange={e => setDescriptionMn(e.target.value)} 
                  placeholder="Барааны онцлог, үр дүн..." 
                  className="w-full p-4 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none resize-none text-[#1A1A1A] placeholder:text-[#8B6B78]/60 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Найрлага</label>
                  <textarea 
                    rows={3} 
                    value={ingredients} 
                    onChange={e => setIngredients(e.target.value)} 
                    placeholder="Усны экстракт, Витамин С..." 
                    className="w-full p-4 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none resize-none text-[#1A1A1A] placeholder:text-[#8B6B78]/60 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Хэрэглэх заавар</label>
                  <textarea 
                    rows={3} 
                    value={howToUse} 
                    onChange={e => setHowToUse(e.target.value)} 
                    placeholder="Арьсаа угааж цэвэрлэсний дараа..." 
                    className="w-full p-4 border border-[#F2A8C8]/60 focus:border-[#FFB7D5] focus:outline-none resize-none text-[#1A1A1A] placeholder:text-[#8B6B78]/60 bg-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 - SETTINGS */}
          <section>
            <h3 className="text-[11px] font-medium text-[#8B6B78] uppercase tracking-[0.18em] mb-4 border-b border-[#F2A8C8]/40 pb-2">Нэмэлт тохиргоо</h3>
            <div className="space-y-4">
              
              <label className="flex items-center gap-4 p-4 border border-[#F2A8C8]/40 cursor-pointer hover:bg-[#FFF8FB] transition-colors">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${featured ? 'bg-accent' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-sand rounded-full shadow-md transform transition-transform ${featured ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="hidden" />
                <div>
                  <p className="font-medium text-gray-900">Онцлох бараа</p>
                  <p className="text-xs text-gray-500">Нүүр хуудсанд харагдана</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 border border-[#F2A8C8]/40 cursor-pointer hover:bg-[#FFF8FB] transition-colors">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${published ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-sand rounded-full shadow-md transform transition-transform ${published ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="hidden" />
                <div>
                  <p className="font-medium text-gray-900">Нийтлэгдсэн</p>
                  <p className="text-xs text-gray-500">Дэлгүүрт нийтдээ харагдах эсэх</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 border border-[#F2A8C8]/40 cursor-pointer hover:bg-[#FFF8FB] transition-colors">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${outOfStock ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-sand rounded-full shadow-md transform transition-transform ${outOfStock ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input
                  type="checkbox"
                  checked={outOfStock}
                  onChange={e => {
                    const checked = e.target.checked;
                    setOutOfStock(checked);
                    if (checked) setStockQuantity(0);
                    else if (stockQuantity <= 0) setStockQuantity(1);
                  }}
                  className="hidden"
                />
                <div>
                  <p className="font-medium text-gray-900">Нөөц дууссан</p>
                  <p className="text-xs text-gray-500">"Дуусжээ" бичигтэй болж, сагсанд нэмэх боломжгүй болно</p>
                </div>
              </label>

            </div>
          </section>

        </form>
      </div>

      <div className="fixed md:sticky bottom-0 left-0 right-0 md:left-auto md:right-auto p-4 md:p-6 border-t border-[#F2A8C8]/40 bg-white flex gap-3 md:gap-4 z-20">
        <button 
          onClick={onCancel}
          type="button"
          disabled={isSubmitting}
          className="flex-1 min-h-12 text-[#1A1A1A] font-medium bg-white border border-[#F2A8C8] hover:bg-[#FFF8FB] transition-colors disabled:opacity-50"
        >
          Цуцлах
        </button>
        <button 
          type="submit"
          form="product-form"
          disabled={isSubmitting}
          className="flex-1 min-h-12 bg-[#1A1A1A] text-white font-medium hover:bg-[#333] transition-colors disabled:opacity-70 flex justify-center items-center gap-3"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Хадгалж байна...</span>
            </>
          ) : (
            'Нийтлэх'
          )}
        </button>
      </div>

      {toastMessage && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-medium animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
