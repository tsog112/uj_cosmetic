'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { getUserWishlist, removeFromWishlist } from '@/lib/services/firestoreService';
import { formatPrice, type WishlistItem } from '@/types';

function WishlistContent() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserWishlist(user.uid)
      .then(setWishlist)
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false));
  }, [user]);

  const remove = async (productId: string) => {
    if (!user) return;
    await removeFromWishlist(user.uid, productId);
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
  };

  if (!user) return null;

  return (
    <div className="space-y-5 px-4 pb-[104px]">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Favorites</p>
        <h1 className="mt-1 text-[25px] font-extrabold text-[var(--color-text-dark)]">Дуртай бараанууд</h1>
        <p className="mt-2 text-[13px] text-[var(--color-text-medium)]">Таалагдсан бүтээгдэхүүнээ эндээс хурдан олж захиална.</p>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-64 rounded-[24px] animate-shimmer" />)}
        </div>
      ) : wishlist.length === 0 ? (
        <section className="rounded-[28px] bg-white px-6 py-14 text-center shadow-[var(--shadow-mobile-card)]">
          <Heart className="mx-auto text-[var(--color-primary)]" size={44} />
          <h2 className="mt-5 text-xl font-extrabold text-[var(--color-text-dark)]">Дуртай бараа алга</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-medium)]">Бүтээгдэхүүн дээрх зүрхэн товчийг дараад энд хадгалаарай.</p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-sm font-extrabold text-white">
            <ShoppingBag size={17} /> Дэлгүүр үзэх
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3">
          {wishlist.map((item) => (
            <article key={item.id} className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
              <Link href={`/shop/${item.productSlug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-[var(--color-soft-pink)]">
                <Image src={item.productImage || '/placeholder-product.svg'} alt={item.productName} fill className="object-cover" sizes="50vw" />
              </Link>
              <Link href={`/shop/${item.productSlug}`} className="mt-3 block min-h-[36px] text-[13px] font-extrabold leading-tight text-[var(--color-text-dark)] line-clamp-2">
                {item.productName}
              </Link>
              <p className="mt-1 text-[14px] font-extrabold text-[var(--color-primary)]">{formatPrice(item.salePrice ?? item.price)}</p>
              <div className="mt-3 grid grid-cols-[1fr_40px] gap-2">
                <Link href={`/shop/${item.productSlug}`} className="flex h-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-extrabold text-white">Авах</Link>
                <button onClick={() => remove(item.productId)} className="flex h-10 items-center justify-center rounded-full bg-[var(--status-error-bg)] text-[var(--status-error)]" aria-label="Устгах">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}
