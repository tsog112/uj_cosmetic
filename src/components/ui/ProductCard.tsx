'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, buyNow } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const name = product.name_mn || 'Нэргүй бараа';
  const image = product.images?.[0] || '/placeholder-product.svg';
  const price = product.price || 0;
  const salePrice = product.salePrice;
  const inStock = product.inStock;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    buyNow({ product, quantity: 1 });
  };

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block"
      id={`product-card-${product.slug}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#FFF0F6]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {salePrice && (
          <span className="absolute top-3 left-3 bg-[#1A1A1A] text-white text-[9px] tracking-[0.18em] uppercase px-2 py-1 font-medium">
            Sale
          </span>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[#1A1A1A] text-[11px] tracking-[0.22em] uppercase font-medium border border-[#1A1A1A] px-4 py-2">
              Дуусжээ
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out-expo">
          <div className="flex">
            <button
              onClick={(event) => {
                event.preventDefault();
                handleAddToCart();
              }}
              className="flex-1 bg-[#FFB7D5] text-[#1A1A1A] text-[11px] tracking-[0.15em] uppercase py-3.5 hover:bg-[#F2A8C8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!inStock}
            >
              {isAdded ? 'Нэмэгдлээ' : 'Сагс'}
            </button>
            <button
              onClick={(event) => {
                event.preventDefault();
                handleBuyNow();
              }}
              className="flex-1 bg-[#1A1A1A] text-white text-[11px] tracking-[0.15em] uppercase py-3.5 hover:bg-[#333] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!inStock}
            >
              Худалдан авах
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B78] mb-2">
          UJ Cosmetic
        </p>
        <h3 className="font-sans text-sm md:text-[15px] font-normal leading-relaxed text-[#1A1A1A] group-hover:text-[#8B6B78] transition-colors min-h-[2.75rem]">
          {name}
        </h3>
        <div className="mt-3 flex items-baseline gap-2">
          {salePrice ? (
            <>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {salePrice.toLocaleString()}₮
              </span>
              <span className="text-xs text-[#8B6B78] line-through">
                {price.toLocaleString()}₮
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-[#1A1A1A]">
              {price.toLocaleString()}₮
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
