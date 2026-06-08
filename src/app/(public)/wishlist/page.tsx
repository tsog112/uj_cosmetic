'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice, type Product, type WishlistItem } from '@/types';

function wishlistToProduct(item: WishlistItem): Product {
  return {
    id: item.productId,
    slug: item.productSlug,
    name_mn: item.productName,
    name_en: item.productName,
    price: item.price,
    salePrice: item.salePrice,
    saleEndDate: null,
    category: 'other',
    images: [item.productImage || '/placeholder-product.svg'],
    videoUrl: null,
    description_mn: '',
    ingredients: '',
    howToUse: '',
    featured: false,
    published: true,
    inStock: item.inStock,
    stockQuantity: item.inStock ? 99 : 0,
    views: 0,
    orderCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function WishlistContent() {
  const { user } = useAuth();
  const { addToCart, buyNow } = useCart();
  const { toast } = useToast();
  const { items: wishlist, loading, remove } = useWishlist();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    setRemovingId(productId);
    try {
      await remove(productId);
    } finally {
      setRemovingId(null);
    }
  };

  if (!user) return null;

  return (
    <main className="luxury-shell min-h-screen pb-[104px]">
      <div className="mx-auto w-full max-w-xl px-4 pt-3">
        <section className="mb-5">
          <p className="luxury-eyebrow">Saved care</p>
          <h1 className="luxury-title mt-1 text-[32px]">Хадгалсан бараа</h1>
          <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">Таалагдсан бүтээгдэхүүнээ нэг дороос дахин сонгоорой.</p>
        </section>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[3/5] rounded-[24px] uj-shimmer" />)}
          </div>
        ) : wishlist.length === 0 ? (
          <section className="luxury-card px-6 py-14 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
              <Heart size={36} strokeWidth={1.5} />
            </div>
            <h2 className="luxury-title mt-6 text-[26px]">Хадгалсан бараа байхгүй</h2>
            <p className="mx-auto mt-3 max-w-[270px] text-[13px] leading-6 text-[var(--color-text-muted)]">
              Бүтээгдэхүүний зүрхэн товчийг дарж өөрийн сонголтоо хадгалаарай.
            </p>
            <Link href="/shop" className="mt-7 inline-flex h-12 items-center rounded-full bg-[var(--color-brand)] px-8 text-[13px] font-bold text-white" style={{ textDecoration: 'none' }}>
              Дэлгүүр үзэх
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-x-3 gap-y-8">
            {wishlist.map((item) => {
              const product = wishlistToProduct(item);
              return (
                <article key={item.id} className="group uj-pressable">
                  <Link href={`/shop/${item.productSlug}`} className="relative block aspect-[3/4] overflow-hidden rounded-[22px] border bg-[#F7F3F5] uj-image-hover" style={{ borderColor: 'var(--color-border)', textDecoration: 'none' }}>
                    <Image src={item.productImage || '/placeholder-product.svg'} alt={item.productName} fill className="object-cover" sizes="50vw" />
                  </Link>
                  <Link href={`/shop/${item.productSlug}`} className="mt-3 line-clamp-2 block text-[13px] font-bold leading-snug text-[var(--color-text-primary)]" style={{ textDecoration: 'none' }}>
                    {item.productName}
                  </Link>
                  <p className="mt-1.5 text-[14px] font-bold text-[var(--color-brand)]">{formatPrice(item.salePrice ?? item.price)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product);
                        toast('Сагсанд нэмэгдлээ', 'success');
                      }}
                      disabled={!item.inStock}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-full border text-[11px] font-bold text-[var(--color-brand)] disabled:opacity-50"
                      style={{ borderColor: 'var(--color-brand-mid)' }}
                    >
                      <ShoppingBag size={14} /> Сагсанд
                    </button>
                    <button
                      type="button"
                      onClick={() => buyNow({ product, quantity: 1 })}
                      disabled={!item.inStock}
                      className="flex h-11 items-center justify-center rounded-full bg-[var(--color-brand)] text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      Захиалах
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingId === item.productId}
                    className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-status-cancel-bg)] text-[11px] font-bold text-[var(--color-status-cancel-text)]"
                    aria-label="Хадгалснаас хасах"
                  >
                    <Trash2 size={14} /> Хасах
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}
