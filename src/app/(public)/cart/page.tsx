'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/types';
import QuantitySelector from '@/components/ui/QuantitySelector';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartSubtotal, shippingCost, cartTotal, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-20">
        <div className="animate-pulse">
          <div className="h-10 bg-cream-dark w-48 mb-8" />
          <div className="h-20 bg-cream-dark mb-4" />
          <div className="h-20 bg-cream-dark mb-4" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-20 text-center">
        {/* Empty Cart */}
        <div className="py-16">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            className="mx-auto mb-6 text-text-muted"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <h1 className="font-serif text-3xl text-text-primary mb-3">
            Сагс хоосон байна
          </h1>
          <p className="text-sm text-text-muted mb-8 max-w-[300px] mx-auto">
            Танд таалагдсан бүтээгдэхүүнээ сагсандаа нэмээрэй
          </p>
          <Link href="/shop" className="btn-gold px-10">
            Дэлгүүр рүү буцах
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 md:py-20">
      <h1 className="section-heading text-3xl md:text-4xl mb-10">Миний сагс</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
        {/* Cart Items */}
        <div>
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_40px] gap-4 pb-4 border-thin-b text-xs text-text-muted tracking-wider uppercase">
            <span>Бүтээгдэхүүн</span>
            <span className="text-center">Тоо ширхэг</span>
            <span className="text-right">Дүн</span>
            <span />
          </div>

          {/* Items */}
          <div className="divide-y divide-border">
            {items.map(item => {
              const product = item.product;
              const name = product?.name_mn ?? 'Нэргүй бараа';
              const price = product?.salePrice ?? product?.price ?? 0;
              const rawImages = product?.images ?? [];
              const image = rawImages[0] ?? '/placeholder-product.svg';

              return (
              <div
                key={product?.id || Math.random().toString()}
                className="py-6 grid grid-cols-[80px_1fr] md:grid-cols-[80px_1fr_120px_120px_40px] gap-4 md:gap-4 items-center"
              >
                {/* Image */}
                <Link href={`/shop/${product?.slug}`} className="relative aspect-4-5 bg-cream-dark overflow-hidden">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </Link>

                {/* Name & Price */}
                <div className="min-w-0">
                  <Link href={`/shop/${product?.slug}`} className="hover:text-accent transition-colors">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-text-muted mb-1">
                      UJ Cosmetic
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {name}
                    </p>
                  </Link>
                  <p className="text-sm text-text-muted mt-1 md:hidden">
                    {formatPrice(price)}
                  </p>

                  {/* Mobile quantity & remove */}
                  <div className="flex items-center gap-4 mt-3 md:hidden">
                    <QuantitySelector
                      quantity={item.quantity}
                      onChange={q => updateQuantity(product?.id, q)}
                    />
                    <button
                      onClick={() => removeFromCart(product?.id)}
                      className="text-text-muted hover:text-text-primary text-xs underline underline-offset-2"
                    >
                      Устгах
                    </button>
                  </div>
                </div>

                {/* Desktop Quantity */}
                <div className="hidden md:flex justify-center">
                  <QuantitySelector
                    quantity={item.quantity}
                    onChange={q => updateQuantity(product?.id, q)}
                  />
                </div>

                {/* Line Total */}
                <p className="hidden md:block text-sm font-medium text-text-primary text-right">
                  {formatPrice(price * item.quantity)}
                </p>

                {/* Remove (Desktop) */}
                <button
                  onClick={() => removeFromCart(product?.id)}
                  className="hidden md:flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Устгах"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 6L18 18M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )})}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-[120px] self-start">
          <div className="bg-cream-dark/50 border border-border p-8">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-6">
              Захиалгын дүн
            </h2>

            <div className="space-y-4 mb-6 pb-6 border-thin-b">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Нийт дүн</span>
                <span className="text-text-primary font-medium">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Хүргэлт</span>
                <span className="text-text-primary font-medium">
                  {shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-accent">
                  {formatPrice(50000 - cartSubtotal)} нэмбэл үнэгүй хүргэлт
                </p>
              )}
            </div>

            <div className="flex justify-between mb-8">
              <span className="text-sm font-medium text-text-primary">Нийт</span>
              <span className="text-lg font-serif font-medium text-text-primary">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <Link href="/checkout" className="btn-gold w-full py-4 text-center block" id="checkout-button">
              Захиалга хийх
            </Link>

            <Link
              href="/shop"
              className="block text-center text-xs text-text-muted hover:text-text-primary mt-4 transition-colors"
            >
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
