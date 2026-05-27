'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Loader2, Star, X } from 'lucide-react';
import { createProductReview, updateUserReview } from '@/lib/services/firestoreService';
import { uploadProductImage } from '@/lib/uploadImage';
import { useAuth } from '@/context/AuthContext';
import type { Product, Review } from '@/types';

interface ReviewFormProps {
  product: Product;
  review?: Review;
  orderId?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const MAX_IMAGES = 5;
const MAX_CONTENT = 500;
const ratingLabels: Record<number, string> = { 1: 'Маш муу', 2: 'Муу', 3: 'Дунд', 4: 'Сайн', 5: 'Маш сайн' };

function containsProfanity(text: string) {
  return ['хараал', 'novsh', 'lalr', 'pizda', 'fuck', 'shit'].some((word) => text.toLowerCase().includes(word));
}

export default function ReviewForm({ product, review, orderId, onSubmitted, onCancel }: ReviewFormProps) {
  const { user, loading } = useAuth();
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [content, setContent] = useState(review?.content ?? '');
  const [existingImages, setExistingImages] = useState<string[]>(review?.imageUrls ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isEditing = Boolean(review);

  useEffect(() => {
    setRating(review?.rating ?? 5);
    setContent(review?.content ?? '');
    setExistingImages(review?.imageUrls ?? []);
    setFiles([]);
  }, [review?.id, review?.rating, review?.content, review?.imageUrls]);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const remaining = MAX_IMAGES - existingImages.length - files.length;
    const selected = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/')).slice(0, remaining);
    setFiles((prev) => [...prev, ...selected].slice(0, MAX_IMAGES - existingImages.length));
    event.target.value = '';
  };

  const uploadImages = async () => {
    if (!user) return [];
    return Promise.all(files.map((file) => uploadProductImage(file, `reviews-${product.slug}`)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!user) {
      setError('Сэтгэгдэл бичихийн тулд эхлээд нэвтэрнэ үү.');
      return;
    }
    if (content.trim().length < 5) {
      setError('Сэтгэгдлээ арай дэлгэрэнгүй бичнэ үү.');
      return;
    }

    if (content.trim().length > MAX_CONTENT) {
      setError(`Сэтгэгдэл ${MAX_CONTENT} тэмдэгтээс хэтэрч болохгүй.`);
      return;
    }
    if (containsProfanity(content)) {
      setError('Сэтгэгдэлд зохисгүй үг орсон байна.');
      return;
    }
    if (!review && !orderId) {
      setError('Баталгаат худалдан авалтын захиалга олдсонгүй.');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedImages = await uploadImages();
      const imageUrls = [...existingImages, ...uploadedImages].slice(0, MAX_IMAGES);

      if (review) {
        await updateUserReview(review.id, { rating, content: content.trim(), imageUrls });
        setMessage('Сэтгэгдэл шинэчлэгдлээ.');
      } else {
        await createProductReview({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name_mn,
          userId: user.uid,
          userName: user.displayName || 'UJ хэрэглэгч',
          userEmail: user.email || '',
          orderId: orderId || '',
          rating,
          content: content.trim(),
          imageUrls,
        });
        setContent('');
        setFiles([]);
        setExistingImages([]);
        setRating(5);
        setMessage('Сэтгэгдэл амжилттай нэмэгдлээ. Баярлалаа!');
      }
      onSubmitted?.();
    } catch (e: any) {
      setError(e?.message || 'Сэтгэгдэл хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-32 rounded-[24px] animate-shimmer" />;

  if (!user) {
    return (
      <div className="rounded-[26px] bg-white p-6 text-center shadow-[var(--shadow-mobile-card)]">
        <h3 className="text-xl font-extrabold text-[var(--color-brand-text)]">Сэтгэгдэл бичих</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">Зурагтай бодит сэтгэгдэл үлдээхийн тулд бүртгэлээрээ нэвтэрнэ үү.</p>
        <Link href="/auth" className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-accent)] px-6 text-sm font-extrabold text-white">
          Нэвтрэх
        </Link>
      </div>
    );
  }

  const canAddImage = existingImages.length + files.length < MAX_IMAGES;

  return (
    <form onSubmit={handleSubmit} className="rounded-[26px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Review</p>
          <h3 className="mt-1 text-xl font-extrabold text-[var(--color-brand-text)]">{isEditing ? 'Сэтгэгдэл засах' : 'Сэтгэгдэл бичих'}</h3>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-bg)] text-[var(--color-brand-text)]" aria-label="Хаах">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-1" aria-label="Үнэлгээ">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)} className={star <= rating ? 'text-[#E6A0BE]' : 'text-[#E9D7DF]'} aria-label={`${star} од`}>
            <Star size={25} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>

      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="mt-4 min-h-32 w-full resize-none rounded-[18px] bg-[var(--color-brand-bg)] px-4 py-3 text-sm leading-6 text-[var(--color-brand-text)] outline-none focus:ring-2 focus:ring-[#f3b8cf]" placeholder="Бүтээгдэхүүний мэдрэмж, үр дүн, арьсанд тохирсон эсэхээ бичээрэй..." />

      {(existingImages.length > 0 || previews.length > 0) && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {existingImages.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-[16px] bg-[var(--color-brand-secondary)]">
              <Image src={url} alt="Review image" fill className="object-cover" sizes="80px" />
              <button type="button" onClick={() => setExistingImages((prev) => prev.filter((image) => image !== url))} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[var(--color-brand-text)]" aria-label="Зураг устгах">
                <X size={14} />
              </button>
            </div>
          ))}
          {previews.map(({ url, file }, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-[16px] bg-[var(--color-brand-secondary)]">
              <Image src={url} alt="Review preview" fill className="object-cover" sizes="80px" />
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, current) => current !== index))} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[var(--color-brand-text)]" aria-label="Зураг устгах">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <label className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-brand-secondary)] px-4 text-[12px] font-extrabold text-[var(--color-brand-text)] ${!canAddImage ? 'pointer-events-none opacity-50' : ''}`}>
          <Camera size={16} /> Зураг нэмэх
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="sr-only" disabled={!canAddImage || submitting} />
        </label>
        <button type="submit" disabled={submitting} className="flex h-12 min-w-32 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-5 text-[12px] font-extrabold text-white disabled:opacity-60">
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {isEditing ? 'Хадгалах' : 'Илгээх'}
        </button>
      </div>
      <p className="mt-3 text-[11px] text-[var(--color-brand-muted)]">{existingImages.length + files.length} / {MAX_IMAGES} зураг</p>
      {message && <p className="mt-3 rounded-[14px] bg-[var(--status-success-bg)] p-3 text-[12px] font-bold text-[var(--status-success)]">{message}</p>}
      {error && <p className="mt-3 rounded-[14px] bg-[var(--status-error-bg)] p-3 text-[12px] font-bold text-[var(--status-error)]">{error}</p>}
    </form>
  );
}
