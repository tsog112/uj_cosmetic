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
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const displayPrice = product.salePrice ?? product.price;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block bg-white border border-border h-full flex flex-col"
      id={`product-card-${product.slug}`}
    >
      {/* Image */}
      <div className="aspect-4-5 relative overflow-hidden bg-cream-dark mb-4">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name_mn}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">Зураг алга</div>
        )}

        {/* Sale badge */}
        {product.salePrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
            Sale
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">Дуусжээ</span>
          </div>
        )}

        {/* Hover Add to Cart */}
        {product.inStock && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-text-primary text-xs tracking-[0.1em] uppercase font-medium transition-colors"
            >
              {isAdded ? '✓ Нэмэгдлээ' : 'Сагсанд нэмэх'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 flex-1 flex flex-col">
        <p className="text-[10px] tracking-[0.15em] uppercase text-accent mb-1.5">
          UJ Cosmetic
        </p>
        <h3 className="text-sm font-normal text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors flex-1">
          {product.name_mn}
        </h3>
        <div className="mt-auto flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-sm text-red-500 font-medium">{formatPrice(product.salePrice)}</span>
              <span className="text-xs text-text-muted line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="text-sm text-text-primary font-medium">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
