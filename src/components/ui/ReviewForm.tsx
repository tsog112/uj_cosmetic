'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createProductReview } from '@/lib/services/firestoreService';
import { uploadProductImage } from '@/lib/uploadImage';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';

interface ReviewFormProps {
  product: Product;
  onSubmitted?: () => void;
}

const MAX_IMAGES = 4;

export default function ReviewForm({ product, onSubmitted }: ReviewFormProps) {
  const { user, loading } = useAuth();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const previews = useMemo(
    () => files.map(file => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach(preview => URL.revokeObjectURL(preview.url));
  }, [previews]);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
      .filter(file => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - files.length);
    setFiles(prev => [...prev, ...selected].slice(0, MAX_IMAGES));
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!user) return [];

    const uploads = files.map(async (file) => {
      return uploadProductImage(file, `reviews-${product.slug}`);
    });

    return Promise.all(uploads);
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

    setSubmitting(true);
    try {
      const imageUrls = await uploadImages();
      await createProductReview({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name_mn,
        userId: user.uid,
        userName: user.displayName || 'UJ хэрэглэгч',
        userEmail: user.email || '',
        rating,
        content: content.trim(),
        imageUrls,
      });

      setContent('');
      setFiles([]);
      setRating(5);
      setMessage('Сэтгэгдэл амжилттай нэмэгдлээ. Баярлалаа!');
      onSubmitted?.();
    } catch (e: any) {
      setError(e?.message || 'Сэтгэгдэл хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-32 bg-blush animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="surface-card bg-sand p-6 text-center md:p-8">
        <p className="font-serif text-2xl text-charcoal mb-2">Сэтгэгдэл бичих</p>
        <p className="text-sm text-text-subtle mb-5">Зурагтай сэтгэгдэл үлдээхийн тулд бүртгэлээрээ нэвтэрнэ үү.</p>
        <Link
          href="/auth"
          className="inline-flex min-h-11 items-center justify-center border border-dusty-rose px-6 text-xs tracking-[0.16em] uppercase text-charcoal transition-colors hover:bg-blush"
        >
          Нэвтрэх
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-text-subtle">Review</p>
          <h3 className="font-serif text-2xl text-charcoal">Сэтгэгдэл бичих</h3>
        </div>
        <div className="flex gap-1" aria-label="Үнэлгээ">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl leading-none transition-colors ${star <= rating ? 'text-[#D894AC]' : 'text-[#E9D7DF]'}`}
              aria-label={`${star} од`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        className="mt-4 min-h-32 w-full resize-none rounded-[14px] border border-border-light bg-white px-4 py-3 text-sm leading-6 text-charcoal outline-none transition-all placeholder:text-text-faint focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
        placeholder="Бүтээгдэхүүний мэдрэмж, үр дүнгээ бичээрэй..."
      />

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {previews.map(({ url, file }, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-[16px] bg-blush">
              <Image src={url} alt="Review preview" fill className="object-cover" sizes="120px" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm text-charcoal"
                aria-label="Зураг устгах"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <label className="btn-ghost flex flex-1 min-h-[48px] cursor-pointer items-center justify-center rounded-full border border-border-light px-4 text-[11px] font-semibold tracking-widest uppercase text-charcoal transition-colors hover:border-dusty-rose hover:bg-rose-quartz whitespace-nowrap shadow-sm">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Зураг нэмэх
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="sr-only"
              disabled={files.length >= MAX_IMAGES || submitting}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="btn-premium flex-1 min-h-[48px] px-6 text-[11px] font-semibold tracking-widest uppercase whitespace-nowrap shadow-brand-sm"
          >
            {submitting ? 'Илгээж байна...' : 'Сэтгэгдэл илгээх'}
          </button>
        </div>
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-text-faint">
            {files.length} / {MAX_IMAGES} зураг оруулсан
          </p>
        </div>
      </div>
      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}
