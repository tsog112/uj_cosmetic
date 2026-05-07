'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, formatPrice } from '@/types';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, buyNow } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;
    buyNow({ product, quantity: 1 });
  };

  const displayPrice = product?.salePrice ?? product?.price ?? 0;
  const name = product?.name_mn ?? 'Нэргүй бараа';
  const price = product?.price ?? 0;
  const images = product?.images ?? [];
  const image = images[0] ?? '/placeholder-product.svg';

  return (
    <Link
      href={`/shop/${product?.slug}`}
      className="group block bg-white border border-border h-full flex flex-col"
      id={`product-card-${product?.slug}`}
    >
      {/* Image */}
      <div className="aspect-4-5 relative overflow-hidden bg-cream-dark mb-4">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Sale badge */}
        {product?.salePrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
            Sale
          </div>
        )}

        {/* Out of stock overlay */}
        {product && !product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">Дуусжээ</span>
          </div>
        )}

        {/* Hover Actions */}
        {product?.inStock && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-[#FFB7D5] hover:bg-[#f5a0c5] text-text-primary text-[11px] tracking-[0.08em] uppercase font-medium transition-colors"
              >
                {isAdded ? '✓ Нэмэгдлээ' : 'Сагсанд нэмэх'}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 bg-white/95 border border-text-primary text-text-primary hover:bg-text-primary hover:text-white text-[11px] tracking-[0.08em] uppercase font-medium transition-colors"
              >
                Худалдан авах →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 flex-1 flex flex-col">
        <p className="text-[10px] tracking-[0.15em] uppercase text-accent mb-1.5">
          UJ Cosmetic
        </p>
        <h3 className="text-sm font-normal text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors flex-1">
          {name}
        </h3>
        <div className="mt-auto flex items-center gap-2">
          {product?.salePrice ? (
            <>
              <span className="text-sm text-red-500 font-medium">{formatPrice(displayPrice)}</span>
              <span className="text-xs text-text-muted line-through">{formatPrice(price)}</span>
            </>
          ) : (
            <span className="text-sm text-text-primary font-medium">{formatPrice(price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
