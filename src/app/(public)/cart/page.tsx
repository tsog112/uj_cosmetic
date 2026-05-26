'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2, Truck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/types';

function EmptyCart() {
  return (
    <main className="px-4 pb-[104px]">
      <section
        className="mt-4 rounded-[32px] px-6 py-16 text-center"
        style={{ background: '#FFFFFF', boxShadow: '0 4px 32px rgba(233,30,140,0.08)' }}
      >
        {/* Animated bag SVG */}
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'var(--color-soft-pink)' }}
          animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <ShoppingBag size={36} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
        </motion.div>
        <h1
          className="mt-5"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 24,
            fontWeight: 500,
            color: 'var(--color-text-dark)',
          }}
        >
          Сагс хоосон байна
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--color-text-medium)' }}>
          Таалагдсан бүтээгдэхүүнээ сагсандаа нэмээд захиалгаа үргэлжлүүлээрэй.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold text-white transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)',
            boxShadow: '0 8px 24px rgba(233,30,140,0.28)',
            fontFamily: '"Montserrat", sans-serif',
            letterSpacing: '0.06em',
          }}
        >
          Дэлгүүр үзэх
        </Link>
      </section>
    </main>
  );
}

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    shippingCost,
    cartTotal,
    cartItemCount,
    isHydrated,
  } = useCart();

  if (!isHydrated) {
    return (
      <main className="space-y-4 px-4 pb-[104px]">
        <div className="h-36 rounded-[28px] animate-shimmer" />
        <div className="h-28 rounded-[24px] animate-shimmer" />
        <div className="h-28 rounded-[24px] animate-shimmer" />
      </main>
    );
  }

  if (!items.length) return <EmptyCart />;

  const FREE_SHIPPING_THRESHOLD = 100000;
  const remaining = FREE_SHIPPING_THRESHOLD - cartSubtotal;
  const freeShippingReached = cartSubtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <main className="space-y-4 px-4 pb-[132px]">
      {/* Header card */}
      <section
        className="rounded-[28px] p-5"
        style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(233,30,140,0.07)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-label"
              style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}
            >
              Cart
            </p>
            <h1
              className="mt-1"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 26,
                fontWeight: 500,
                color: 'var(--color-text-dark)',
              }}
            >
              Миний сагс
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-medium)' }}>
              {cartItemCount} ширхэг бүтээгдэхүүн
            </p>
          </div>
          <button
            onClick={clearCart}
            className="rounded-full px-4 py-2 text-[11px] font-bold transition-all hover:scale-105"
            style={{
              background: 'var(--status-error-bg)',
              color: 'var(--status-error)',
            }}
          >
            Цэвэрлэх
          </button>
        </div>

        {/* Free shipping progress */}
        {!freeShippingReached && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-bold" style={{ color: 'var(--color-text-medium)' }}>
                Үнэгүй хүргэлт хүртэл
              </p>
              <p className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                {formatPrice(remaining)} дутуу
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-soft-pink)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #E91E8C, #C2185B)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
        {freeShippingReached && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center gap-2 rounded-[14px] p-3"
            style={{ background: 'var(--status-success-bg)' }}
          >
            <Sparkles size={16} style={{ color: 'var(--status-success)' }} />
            <p className="text-[12px] font-bold" style={{ color: 'var(--status-success)' }}>
              🎉 Үнэгүй хүргэлт авлаа!
            </p>
          </motion.div>
        )}
      </section>

      {/* Cart items */}
      <section className="space-y-3">
        <AnimatePresence>
          {items.map(({ product, quantity }) => {
            const image = product.images?.[0] || '/placeholder-product.svg';
            const price = product.salePrice ?? product.price;
            return (
              <motion.article
                key={product.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[24px] p-3"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 16px rgba(233,30,140,0.06)' }}
              >
                <div className="flex gap-3">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[20px]"
                    style={{ background: 'var(--color-soft-pink)' }}
                  >
                    <Image
                      src={image}
                      alt={product.name_mn}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="96px"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/shop/${product.slug}`}
                      className="line-clamp-2 text-[14px] font-bold leading-tight"
                      style={{ color: 'var(--color-text-dark)' }}
                    >
                      {product.name_mn}
                    </Link>
                    <p
                      className="mt-1 text-[13px] font-bold tabular-nums"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {formatPrice(price)}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      {/* Qty stepper */}
                      <div
                        className="flex items-center rounded-full p-1"
                        style={{ background: 'var(--color-soft-pink)' }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
                          style={{ color: 'var(--color-text-dark)' }}
                          aria-label="Тоо хасах"
                        >
                          <Minus size={13} />
                        </motion.button>
                        <motion.span
                          key={quantity}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-9 text-center text-sm font-bold tabular-nums"
                        >
                          {quantity}
                        </motion.span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
                          style={{ color: 'var(--color-text-dark)' }}
                          aria-label="Тоо нэмэх"
                        >
                          <Plus size={13} />
                        </motion.button>
                      </div>
                      {/* Remove */}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => removeFromCart(product.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ background: 'var(--status-error-bg)', color: 'var(--status-error)' }}
                        aria-label="Сагснаас хасах"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div
                  className="mt-3 flex items-center justify-between rounded-[16px] px-4 py-3"
                  style={{ background: 'var(--color-soft-pink)' }}
                >
                  <span className="text-[12px] font-bold" style={{ color: 'var(--color-text-medium)' }}>Дүн</span>
                  <strong
                    className="text-[15px] tabular-nums"
                    style={{ color: 'var(--color-text-dark)', fontWeight: 800 }}
                  >
                    {formatPrice(price * quantity)}
                  </strong>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </section>

      {/* Order summary */}
      <section
        className="rounded-[24px] p-5"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 16px rgba(233,30,140,0.06)' }}
      >
        <div
          className="flex items-center gap-3 rounded-[16px] p-3"
          style={{ background: 'var(--color-soft-pink)' }}
        >
          <Truck size={18} style={{ color: 'var(--color-primary)' }} strokeWidth={1.8} />
          <p className="text-[12px] font-bold" style={{ color: 'var(--color-text-medium)' }}>
            {shippingCost === 0 ? '✓ Хүргэлт үнэгүй' : `Хүргэлт ${formatPrice(shippingCost)}`}
          </p>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between" style={{ color: 'var(--color-text-medium)' }}>
            <span>Барааны дүн</span>
            <span className="tabular-nums">{formatPrice(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between" style={{ color: 'var(--color-text-medium)' }}>
            <span>Хүргэлт</span>
            <span className="tabular-nums">{shippingCost ? formatPrice(shippingCost) : 'Үнэгүй'}</span>
          </div>
          <div
            className="flex justify-between border-t pt-3"
            style={{ borderColor: 'rgba(233,30,140,0.12)' }}
          >
            <span className="font-bold" style={{ fontSize: 16, color: 'var(--color-text-dark)' }}>Нийт</span>
            <motion.span
              key={cartTotal}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-extrabold tabular-nums"
              style={{ fontSize: 18, color: 'var(--color-primary)' }}
            >
              {formatPrice(cartTotal)}
            </motion.span>
          </div>
        </div>
      </section>

      {/* Sticky checkout button */}
      <div className="fixed bottom-[78px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-4">
        <Link
          href="/checkout"
          className="flex h-14 w-full items-center justify-center rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)',
            boxShadow: '0 12px 32px rgba(233,30,140,0.32)',
            fontFamily: '"Montserrat", sans-serif',
            letterSpacing: '0.06em',
          }}
        >
          Захиалга үргэлжлүүлэх
        </Link>
      </div>
    </main>
  );
}
