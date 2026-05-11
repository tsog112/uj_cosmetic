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
    return <div className="h-32 bg-[#FFF0F6] animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="border border-[#F2A8C8]/50 bg-[#FFF8FB] p-6 md:p-8 text-center">
        <p className="font-serif text-2xl text-[#1A1A1A] mb-2">Сэтгэгдэл бичих</p>
        <p className="text-sm text-[#8B6B78] mb-5">Зурагтай сэтгэгдэл үлдээхийн тулд бүртгэлээрээ нэвтэрнэ үү.</p>
        <Link
          href="/auth"
          className="inline-flex min-h-11 items-center justify-center border border-[#FFB7D5] px-6 text-xs tracking-[0.16em] uppercase text-[#1A1A1A] transition-colors hover:bg-[#FFF0F6]"
        >
          Нэвтрэх
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#F2A8C8]/50 bg-white p-5 md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78]">Review</p>
          <h3 className="font-serif text-2xl text-[#1A1A1A]">Сэтгэгдэл бичих</h3>
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
        className="mt-5 w-full border border-[#F2A8C8]/60 bg-[#FFF8FB] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#B79AA6] focus:border-[#FFB7D5]"
        placeholder="Бүтээгдэхүүний мэдрэмж, үр дүнгээ бичээрэй..."
      />

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {previews.map(({ url, file }, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden bg-[#FFF0F6]">
              <Image src={url} alt="Review preview" fill className="object-cover" sizes="120px" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-white/90 text-sm text-[#1A1A1A]"
                aria-label="Зураг устгах"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-h-11 cursor-pointer items-center justify-center border border-[#F2A8C8]/70 px-5 text-xs tracking-[0.14em] uppercase text-[#8B6B78] transition-colors hover:bg-[#FFF0F6]">
          Зураг нэмэх
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
          className="min-h-11 bg-[#1A1A1A] px-7 text-xs font-medium tracking-[0.16em] uppercase text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#D8C7CF]"
        >
          {submitting ? 'Илгээж байна...' : 'Сэтгэгдэл илгээх'}
        </button>
      </div>

      <p className="mt-3 text-xs text-[#8B6B78]">4 хүртэл зураг оруулах боломжтой.</p>
      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}
