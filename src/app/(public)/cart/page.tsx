'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/types';
import QuantitySelector from '@/components/ui/QuantitySelector';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartSubtotal, shippingCost, cartTotal, isHydrated } = useCart();
  const freeShippingLeft = Math.max(0, 50000 - cartSubtotal);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-14 pt-24 sm:px-6 lg:px-10 md:py-20">
        <div className="animate-pulse">
          <div className="mb-8 h-10 w-48 rounded-[10px] bg-[#FFF0F6]" />
          <div className="mb-4 h-24 rounded-[14px] bg-[#FFF0F6]" />
          <div className="mb-4 h-24 rounded-[14px] bg-[#FFF0F6]" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 pb-14 pt-24 text-center sm:px-6 lg:px-10 md:py-20">
        <div className="mx-auto max-w-[460px] rounded-[18px] border border-[#F2A8C8]/45 bg-white px-6 py-14 shadow-[0_18px_50px_rgba(91,46,67,0.08)]">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" className="mx-auto mb-6 text-[#D994B5]">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <h1 className="mb-3 font-serif text-3xl text-[#241820]">Сагс хоосон байна</h1>
          <p className="mx-auto mb-8 max-w-[320px] text-sm leading-7 text-[#7E6472]">
            Таалагдсан бүтээгдэхүүнээ сагсандаа нэмээд захиалгаа үргэлжлүүлээрэй.
          </p>
          <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-[12px] bg-[#D994B5] px-8 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(217,148,181,0.25)] transition-colors hover:bg-[#c77ea4]">
            Дэлгүүр рүү буцах
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-14 pt-24 sm:px-6 lg:px-10 md:py-20">
      <div className="mb-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D994B5]">Shopping cart</p>
        <h1 className="mt-2 font-serif text-4xl text-[#241820] md:text-5xl">Миний сагс</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
        <div className="min-w-0">
          <div className="hidden grid-cols-[1fr_120px_120px_44px] gap-4 rounded-[12px] bg-[#FFF8FB] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6B78] md:grid">
            <span>Бүтээгдэхүүн</span>
            <span className="text-center">Тоо ширхэг</span>
            <span className="text-right">Дүн</span>
            <span />
          </div>

          <div className="mt-3 space-y-3">
            {items.map(item => {
              const product = item.product;
              const name = product?.name_mn ?? 'Бүтээгдэхүүн';
              const price = product?.salePrice ?? product?.price ?? 0;
              const image = product?.images?.[0] ?? '/placeholder-product.svg';

              return (
                <article
                  key={product?.id || name}
                  className="grid grid-cols-[86px_1fr] items-center gap-4 rounded-[14px] border border-[#F2A8C8]/45 bg-white p-3 shadow-[0_10px_28px_rgba(91,46,67,0.05)] md:grid-cols-[86px_1fr_120px_120px_44px] md:p-4"
                >
                  <Link href={`/shop/${product?.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-[#FFF0F6]">
                    <Image src={image} alt={name} fill className="object-cover" sizes="86px" />
                  </Link>

                  <div className="min-w-0">
                    <Link href={`/shop/${product?.slug}`} className="transition-colors hover:text-[#D86FA0]">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8B6B78]">UJ Cosmetic</p>
                      <p className="truncate text-sm font-semibold text-[#241820]">{name}</p>
                    </Link>
                    <p className="mt-1 text-sm text-[#7E6472] md:hidden">{formatPrice(price)}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 md:hidden">
                      <QuantitySelector quantity={item.quantity} onChange={q => updateQuantity(product?.id, q)} />
                      <button
                        onClick={() => removeFromCart(product?.id)}
                        className="min-h-9 rounded-[9px] border border-[#F2C7D8] px-3 text-xs font-semibold text-[#7E6472] transition-colors hover:bg-[#FFF0F6]"
                      >
                        Устгах
                      </button>
                    </div>
                  </div>

                  <div className="hidden justify-center md:flex">
                    <QuantitySelector quantity={item.quantity} onChange={q => updateQuantity(product?.id, q)} />
                  </div>

                  <p className="hidden text-right text-sm font-semibold text-[#241820] md:block">
                    {formatPrice(price * item.quantity)}
                  </p>

                  <button
                    onClick={() => removeFromCart(product?.id)}
                    className="hidden h-10 w-10 items-center justify-center rounded-[10px] border border-[#F2C7D8] text-[#7E6472] transition-colors hover:bg-[#FFF0F6] hover:text-[#241820] md:flex"
                    aria-label="Устгах"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M6 6L18 18M18 6L6 18" />
                    </svg>
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="self-start lg:sticky lg:top-[120px]">
          <div className="rounded-[18px] border border-[#F2C7D8] bg-[#FFF8FB] p-6 shadow-[0_18px_50px_rgba(91,46,67,0.08)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D994B5]">Захиалгын дүн</h2>

            <div className="mt-6 space-y-4 border-b border-[#F2C7D8] pb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#7E6472]">Барааны дүн</span>
                <span className="font-semibold text-[#241820]">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7E6472]">Хүргэлт</span>
                <span className="font-semibold text-[#241820]">{shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost > 0 && (
                <p className="rounded-[10px] bg-white px-3 py-2 text-xs leading-5 text-[#8B6B78]">
                  {formatPrice(freeShippingLeft)} нэмж захиалбал хүргэлт үнэгүй болно.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <span className="text-sm font-semibold text-[#241820]">Төлөх дүн</span>
              <span className="font-serif text-2xl text-[#D994B5]">{formatPrice(cartTotal)}</span>
            </div>

            <Link href="/checkout" className="mt-7 flex min-h-14 w-full items-center justify-center rounded-[14px] bg-[#D994B5] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(217,148,181,0.28)] transition-colors hover:bg-[#c77ea4]" id="checkout-button">
              Захиалга хийх
            </Link>

            <Link href="/shop" className="mt-3 flex min-h-12 w-full items-center justify-center rounded-[12px] border border-[#F2C7D8] bg-white px-6 text-sm font-semibold text-[#241820] transition-colors hover:bg-[#FFF0F6]">
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
