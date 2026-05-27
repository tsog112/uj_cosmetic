'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/ui/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { getUserWishlist, removeFromWishlist } from '@/lib/services/firestoreService';
import { formatPrice, type WishlistItem } from '@/types';

function WishlistContent() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserWishlist(user.uid)
      .then(setWishlist)
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false));
  }, [user]);

  // Auto-dismiss confirm after 3s
  useEffect(() => {
    if (confirmId) {
      confirmTimerRef.current = setTimeout(() => setConfirmId(null), 3000);
    }
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, [confirmId]);

  const handleDeleteClick = (productId: string) => {
    if (confirmId === productId) {
      // Second click: confirm and delete
      remove(productId);
      setConfirmId(null);
    } else {
      // First click: show confirm state
      setConfirmId(productId);
    }
  };

  const remove = async (productId: string) => {
    if (!user) return;
    await removeFromWishlist(user.uid, productId);
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
  };

  if (!user) return null;

  return (
    <div className="space-y-5 px-4 pb-[104px] md:max-w-xl lg:max-w-2xl mx-auto md:mt-6">
      <section>
        {/* Consistent Mongolian branding */}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">ДУРТАЙ БАРААНУД</p>
        <h1 className="mt-1 text-[25px] font-extrabold text-[var(--color-text-dark)]">Дуртай бараанууд</h1>
        <p className="mt-2 text-[13px] text-[var(--color-text-medium)]">Таалагдсан бүтээгдэхүүнээ эндээс хурдан олж захиална.</p>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-64 rounded-[24px] animate-shimmer" />)}
        </div>
      ) : wishlist.length === 0 ? (
        /* Enhanced empty state with illustrated card */
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[28px] bg-white px-6 py-14 text-center shadow-[var(--shadow-mobile-card)] border border-[#F4C0D1]/40"
        >
          {/* Illustrated hearts */}
          <div className="relative mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--color-soft-pink)]" />
            <Heart
              className="relative text-[var(--color-primary)]"
              size={40}
              fill="rgba(233,30,140,0.15)"
              strokeWidth={1.5}
            />
            {/* Floating mini hearts */}
            <span className="absolute -top-1 -right-1 text-[18px]" style={{ animation: 'pulseSoft 2s ease-in-out infinite' }}>💕</span>
            <span className="absolute -bottom-1 -left-2 text-[12px]" style={{ animation: 'pulseSoft 2.5s ease-in-out infinite', animationDelay: '0.5s' }}>💗</span>
          </div>
          <h2 className="text-[20px] font-extrabold text-[var(--color-text-dark)]">Дуртай бараа алга байна</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-medium)] max-w-[260px] mx-auto">
            Бүтээгдэхүүн дээрх 💕 дүрсийг дараад дуртай барааны жагсаалтдаа нэмээрэй.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(233,30,140,0.28)] transition-all hover:scale-[1.03] hover:shadow-[0_12px_32px_rgba(233,30,140,0.36)] active:scale-[0.97]"
          >
            <ShoppingBag size={17} /> Дэлгүүр үзэх
          </Link>
        </motion.section>
      ) : (
        <section className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {wishlist.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(233,30,140,0.15)] transition-all duration-250"
              >
                <Link href={`/shop/${item.productSlug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-[var(--color-soft-pink)]">
                  <Image
                    src={item.productImage || '/placeholder-product.svg'}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                </Link>
                <Link href={`/shop/${item.productSlug}`} className="mt-3 block min-h-[36px] text-[13px] font-extrabold leading-tight text-[var(--color-text-dark)] line-clamp-2">
                  {item.productName}
                </Link>
                <p className="mt-1 text-[14px] font-extrabold text-[var(--color-primary)]">{formatPrice(item.salePrice ?? item.price)}</p>
                <div className="mt-3 grid grid-cols-[1fr_44px] gap-2">
                  <Link href={`/shop/${item.productSlug}`} className="flex h-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-extrabold text-white transition-all hover:scale-[1.03] active:scale-[0.97]">
                    Авах
                  </Link>
                  {/* Delete with confirm state */}
                  <button
                    onClick={() => handleDeleteClick(item.productId)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                      confirmId === item.productId
                        ? 'bg-[var(--status-error)] text-white scale-110 shadow-[0_4px_12px_rgba(179,41,64,0.35)]'
                        : 'bg-[var(--status-error-bg)] text-[var(--status-error)] hover:scale-[1.05]'
                    }`}
                    aria-label={confirmId === item.productId ? 'Устгахыг баталгаажуулах' : 'Устгах'}
                    title={confirmId === item.productId ? 'Дахин дарж устгана уу' : 'Устгах'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {/* Confirm tooltip */}
                <AnimatePresence>
                  {confirmId === item.productId && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2 text-center text-[10px] font-bold text-[var(--status-error)]"
                    >
                      Дахин дарж устгана уу
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </AnimatePresence>
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
