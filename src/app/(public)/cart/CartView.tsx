'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { mobileCartScrollPadClass, shopStickyFooterClass } from '@/lib/layout/shell';
import { formatPrice } from '@/types';

function EmptyCart() {
  return (
    <main className="luxury-shell min-h-screen px-4 pb-[104px] pt-6">
      <section className="luxury-card mx-auto max-w-xl px-6 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
          <ShoppingBag size={34} strokeWidth={1.5} />
        </div>
        <h1 className="luxury-title mt-6 text-[30px]">Сагс хоосон байна</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-[13px] leading-6 text-[var(--color-text-muted)]">
          Таалагдсан бүтээгдэхүүнээ сагсандаа нэмээд захиалгаа үргэлжлүүлээрэй.
        </p>
        <Link href="/shop" className="mt-7 inline-flex h-12 items-center rounded-full bg-[var(--color-brand)] px-8 text-[13px] font-bold text-white uj-pressable" style={{ textDecoration: 'none' }}>
          Дэлгүүр үзэх
        </Link>
      </section>
    </main>
  );
}

export default function CartView() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    buyNow,
    cartSubtotal,
    shippingCost,
    cartTotal,
    cartItemCount,
    isHydrated,
    freeShippingThreshold,
  } = useCart();

  if (!isHydrated) {
    return (
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 pb-[104px] pt-6">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-[24px] uj-shimmer" />)}
      </main>
    );
  }

  if (!items.length) return <EmptyCart />;

  const remaining = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingReached = cartSubtotal >= freeShippingThreshold;
  const progress = Math.min((cartSubtotal / (freeShippingThreshold || 1)) * 100, 100);

  return (
    <main className={`luxury-shell min-h-screen ${mobileCartScrollPadClass}`}>
      <div className="mx-auto w-full max-w-xl space-y-3 px-4 pt-3">
        <section className="luxury-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="luxury-eyebrow">Cart</p>
              <h1 className="luxury-title mt-0.5 text-[28px]">Миний сагс</h1>
              <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{cartItemCount} бүтээгдэхүүн</p>
            </div>
            <button onClick={clearCart} className="h-9 shrink-0 rounded-full bg-[var(--color-status-cancel-bg)] px-3.5 text-[11px] font-bold text-[var(--color-status-cancel-text)] uj-pressable">
              Цэвэрлэх
            </button>
          </div>

          {freeShippingReached ? (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-brand)]">
              <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden="true" />
              Үнэгүй хүргэлт идэвхтэй
            </p>
          ) : (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-[var(--color-text-primary)]">Үнэгүй хүргэлт</span>
                <span className="text-[var(--color-text-muted)]">{formatPrice(remaining)} дутуу</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#F7F3F5]">
                <div className="h-full rounded-full luxury-progress transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          {items.map(({ product, quantity }) => {
            const image = product.images?.[0] || '/placeholder-product.svg';
            const price = product.salePrice ?? product.price;
            const name = product.name_mn || product.name_en || 'Бүтээгдэхүүн';
            return (
              <article key={product.id} className="luxury-card p-3 uj-pressable">
                <div className="flex gap-3">
                  <Link href={`/shop/${product.slug}`} className="relative h-[100px] w-[84px] shrink-0 overflow-hidden rounded-[16px] bg-[#F7F3F5] uj-image-hover" style={{ textDecoration: 'none' }}>
                    <Image src={image} alt={name} fill className="object-cover" sizes="84px" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/shop/${product.slug}`} className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--color-text-primary)]" style={{ textDecoration: 'none' }}>
                      {name}
                    </Link>
                    <p className="mt-1.5 text-[13px] font-bold text-[var(--color-brand)]">{formatPrice(price)}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full bg-[#F7F3F5] p-0.5">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white" aria-label="Тоо хасах">
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-[12px] font-bold">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white" aria-label="Тоо нэмэх">
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => buyNow({ product, quantity })} className="h-9 rounded-full border border-[var(--color-brand-mid)] px-2.5 text-[10px] font-bold text-[var(--color-brand)]">
                          Шууд авах
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-status-cancel-bg)] text-[var(--color-status-cancel-text)]" aria-label="Сагснаас хасах">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <section className={`luxury-bottom-bar ${shopStickyFooterClass} border-t border-[#efe6ea] px-4 py-2.5`}>
        <div className="mx-auto max-w-xl">
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-[12px]">
            <dt className="text-[var(--color-text-muted)]">Дүн</dt>
            <dd className="text-right tabular-nums font-medium text-[var(--color-text-primary)]">{formatPrice(cartSubtotal)}</dd>
            <dt className="text-[var(--color-text-muted)]">Хүргэлт</dt>
            <dd className="text-right tabular-nums font-medium text-[var(--color-text-primary)]">{freeShippingReached ? 'Үнэгүй' : formatPrice(shippingCost)}</dd>
          </dl>
          <div className="mt-1.5 flex items-center justify-between border-t border-[#efe6ea] pt-1.5">
            <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Нийт</span>
            <span className="text-[15px] font-bold tabular-nums text-[var(--color-brand)]">{formatPrice(cartTotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-2.5 flex h-11 w-full items-center justify-center rounded-full bg-[var(--color-brand)] text-[13px] font-bold text-white uj-pressable"
            style={{ textDecoration: 'none' }}
          >
            Захиалга үргэлжлүүлэх
          </Link>
        </div>
      </section>
    </main>
  );
}
