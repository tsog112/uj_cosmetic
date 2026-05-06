'use client';

import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { doc, collection, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

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
  const [category, setCategory] = useState(initialData?.category || 'Серум');
  const [priceStr, setPriceStr] = useState(initialData?.price?.toString() || '');
  const [salePriceStr, setSalePriceStr] = useState(initialData?.salePrice?.toString() || '');
  const [saleEndDate, setSaleEndDate] = useState(initialData?.saleEndDate || '');
  const [description_mn, setDescriptionMn] = useState(initialData?.description_mn || '');
  const [ingredients, setIngredients] = useState(initialData?.ingredients || '');
  const [howToUse, setHowToUse] = useState(initialData?.howToUse || '');
  
  // Toggles
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [outOfStock, setOutOfStock] = useState(initialData ? !initialData.inStock : false);

  // Media
  const [images, setImages] = useState<{ url: string; progress?: number; isVideo?: boolean; _tempId?: string }[]>([]);
  const [video, setVideo] = useState<{ url: string; progress?: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storage = getStorage();

  // Initialization
  useEffect(() => {
    if (initialData?.images) {
      setImages(initialData.images.map((url: string) => ({ url, progress: 100 })));
    }
    if (initialData?.videoUrl) {
      setVideo({ url: initialData.videoUrl, progress: 100 });
    }
  }, [initialData]);

  const formatPriceInput = (val: string) => {
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('en-US');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPriceInput(e.target.value));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const slug = name_mn ? name_mn.toLowerCase().replace(/[\s\W]+/g, '-') : 'draft-product';

    for (const file of files) {
      if (file.type.startsWith('video/')) {
        if (file.size > 50 * 1024 * 1024) {
          alert('Бичлэг 50MB-аас бага байх ёстой.');
          continue;
        }
        if (video || images.some(i => i.isVideo)) {
          alert('Зөвхөн 1 бичлэг оруулах боломжтой.');
          continue;
        }
        
        const tempUrl = URL.createObjectURL(file);
        setVideo({ url: tempUrl, progress: 0 });
        
        try {
          const downloadUrl = await uploadFile(file, `products/${slug}/${Date.now()}_${file.name}`, (p) => {
            setVideo(prev => prev ? { ...prev, progress: p } : null);
          });
          setVideo({ url: downloadUrl, progress: 100 });
        } catch (err) {
          alert("Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.");
          setVideo(null);
        }

      } else if (file.type.startsWith('image/')) {
        if (images.length >= 5) {
          alert('Хамгийн ихдээ 5 зураг оруулах боломжтой.');
          break;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('Зураг 5MB-аас бага байх ёстой.');
          continue;
        }
        
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1080,
            useWebWorker: true
          };
          const compressedFile = await imageCompression(file, options);
          const tempUrl = URL.createObjectURL(compressedFile);
          const tempId = Math.random().toString(36).substr(2, 9);
          
          setImages(prev => [...prev, { url: tempUrl, progress: 0, _tempId: tempId }]);
          
          const downloadUrl = await uploadFile(compressedFile, `products/${slug}/${Date.now()}_${compressedFile.name}`, (p) => {
            setImages(prev => prev.map(img => img._tempId === tempId ? { ...img, progress: p } : img));
          });
          
          setImages(prev => prev.map(img => img._tempId === tempId ? { url: downloadUrl, progress: 100 } : img));
          
        } catch (error) {
          console.error("Upload error", error);
          alert("Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.");
          setImages(prev => prev.filter(img => img.progress === 100));
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
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

  const handleDropUpload = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const uploadFile = (file: File, path: string, onProgress: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }, 
        (error) => reject(error), 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.some(img => img.progress !== undefined && img.progress < 100) || (video && video.progress !== undefined && video.progress < 100)) {
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

      const uploadedImages = images.map(img => img.url);
      const uploadedVideoUrl = video?.url || null;

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
        images: uploadedImages,
        videoUrl: uploadedVideoUrl,
        featured,
        published,
        inStock: !outOfStock,
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
    <div className="bg-white max-w-4xl w-full rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
        <h2 className="text-xl font-bold text-gray-800">{initialData ? 'Бараа засах' : 'Шинэ бараа нэмэх'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form id="product-form" onSubmit={handleSubmit} className="space-y-10">
          
          {/* SECTION 1 - MEDIA */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Зураг & Бичлэг</h3>
            
            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDropUpload}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#FFB7D5] rounded-xl p-10 text-center cursor-pointer hover:bg-[#FFF0F6] transition-colors mb-4 group"
            >
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center text-[#FFB7D5] shadow-sm group-hover:scale-110 transition-transform mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="font-medium text-gray-700 mb-1">Зургаа энд чирж буулга эсвэл дарж сонго</p>
              <p className="text-xs text-gray-500">JPG, PNG, WEBP (max 5MB), MP4 (max 50MB). Үсрээд 5 зураг, 1 бичлэг.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                multiple 
                accept="image/*,video/mp4" 
              />
            </div>

            <div className="flex flex-wrap gap-4">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  draggable 
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 cursor-move group"
                >
                  <img src={img.url} alt="upload" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[9px] font-bold text-center py-0.5">НҮҮР</span>
                  )}
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  {img.progress !== undefined && img.progress < 100 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{width: `${img.progress}%`}} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {video && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-black group">
                  <video src={video.url} className="w-full h-full object-cover opacity-70" />
                  <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[9px] font-bold text-center py-0.5">ВИДЕО</span>
                  <button type="button" onClick={removeVideo} className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  {video.progress !== undefined && video.progress < 100 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{width: `${video.progress}%`}} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2 - INFO */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Барааны мэдээлэл</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Барааны нэр *</label>
                <input 
                  required 
                  value={name_mn} 
                  onChange={e => setNameMn(e.target.value)} 
                  placeholder="Жишээ: UJ Серум Арьс тэнцвэржүүлэгч" 
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ангилал *</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none bg-white text-gray-900"
                  >
                    <option value="Серум">Серум</option>
                    <option value="Тоник">Тоник</option>
                    <option value="Нүүрний тос">Нүүрний тос</option>
                    <option value="Нүүрний тосолгоо">Нүүрний тосолгоо</option>
                    <option value="Наран хамгаалагч">Наран хамгаалагч</option>
                    <option value="Арьс цэвэрлэгч">Арьс цэвэрлэгч</option>
                    <option value="Маск">Маск</option>
                    <option value="Бусад">Бусад</option>
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
                      className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-gray-900 font-medium"
                    />
                    <span className="absolute right-4 top-4 text-gray-500 font-medium">₮</span>
                  </div>
                </div>
              </div>

              {/* ХЯМДРАЛ ТОХИРУУЛАХ */}
              <div className="bg-red-50/50 p-5 rounded-xl border border-red-100 space-y-4">
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
                      className="w-full p-3 border border-red-200 rounded-md focus:border-red-400 focus:outline-none text-red-600 font-bold placeholder-red-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Дуусах огноо (заавал биш)</label>
                    <input 
                      type="datetime-local"
                      value={saleEndDate}
                      onChange={e => setSaleEndDate(e.target.value)}
                      className="w-full p-3 border border-red-200 rounded-md focus:border-red-400 focus:outline-none text-gray-700 bg-white"
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
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none text-gray-900 placeholder-gray-400"
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
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Хэрэглэх заавар</label>
                  <textarea 
                    rows={3} 
                    value={howToUse} 
                    onChange={e => setHowToUse(e.target.value)} 
                    placeholder="Арьсаа угааж цэвэрлэсний дараа..." 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 - SETTINGS */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Нэмэлт тохиргоо</h3>
            <div className="space-y-4">
              
              <label className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${featured ? 'bg-accent' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${featured ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="hidden" />
                <div>
                  <p className="font-medium text-gray-900">Онцлох бараа</p>
                  <p className="text-xs text-gray-500">Нүүр хуудсанд харагдана</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${published ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${published ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="hidden" />
                <div>
                  <p className="font-medium text-gray-900">Нийтлэгдсэн</p>
                  <p className="text-xs text-gray-500">Дэлгүүрт нийтдээ харагдах эсэх</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${outOfStock ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${outOfStock ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" checked={outOfStock} onChange={e => setOutOfStock(e.target.checked)} className="hidden" />
                <div>
                  <p className="font-medium text-gray-900">Нөөц дууссан</p>
                  <p className="text-xs text-gray-500">"Дуусжээ" бичигтэй болж, сагсанд нэмэх боломжгүй болно</p>
                </div>
              </label>

            </div>
          </section>

        </form>
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-4">
        <button 
          onClick={onCancel}
          type="button"
          disabled={isSubmitting}
          className="flex-1 py-4 text-gray-700 font-bold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Цуцлах
        </button>
        <button 
          type="submit"
          form="product-form"
          disabled={isSubmitting}
          className="flex-1 py-4 bg-accent text-white font-bold rounded-lg shadow-md hover:bg-[#e89ebf] transition-colors disabled:opacity-70 flex justify-center items-center gap-3"
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
