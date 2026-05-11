'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, buyNow } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const name = product.name_mn || 'Нэргүй бараа';
  const image = product.images?.[0] || '/placeholder-product.svg';
  const price = product.price || 0;
  const salePrice = product.salePrice;
  const displayPrice = salePrice || price;
  const inStock = product.inStock !== false && Number(product.stockQuantity ?? 1) > 0;

  return (
    <div 
      className="group flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block w-full flex-grow relative"
      >
        {/* Image Container with 4:5 Aspect Ratio */}
        <motion.div 
          className="relative aspect-[4/5] w-full overflow-hidden bg-[#FFF0F6] border border-[#F2A8C8]/40 rounded-[14px] md:rounded-[10px] shadow-sm"
          animate={{
            boxShadow: isHovered ? "0 20px 40px -10px rgba(0,0,0,0.08)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
          }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="w-full h-full"
          >
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </motion.div>

          {/* Availability Badge */}
          {salePrice && inStock && (
            <span className="absolute top-3 left-3 bg-charcoal text-sand text-[9px] tracking-[0.14em] uppercase px-2 py-1 rounded-[6px]">
              Sale
            </span>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-[#F9F8F6]/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="editorial-label bg-sand px-4 py-2 shadow-sm text-[10px] rounded-[8px]">
                Дууссан
              </span>
            </div>
          )}

          {/* Subtle Overlay on Hover */}
          <div 
            className={`absolute inset-0 bg-black/5 transition-opacity duration-700 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`} 
          />
        </motion.div>

        {/* Product Info */}
        <div className="mt-3 md:mt-6 flex flex-col items-start md:items-center md:text-center px-0 md:px-2">
          <p className="hidden md:block editorial-label text-[9px] mb-2">UJ Cosmetic</p>
          <h3 className="text-[14px] md:font-serif md:text-xl font-medium md:font-light text-charcoal mb-1 md:mb-2 leading-snug tracking-normal md:tracking-[0.05em] group-hover:opacity-70 transition-opacity duration-500 line-clamp-2">
            {name}
          </h3>
          <div className="flex flex-col md:items-center gap-1 mt-auto">
            <span className="hidden md:block font-serif italic text-sm text-neutral-600 tracking-[0.05em]">
              Арьс арчилгаа
            </span>
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-semibold md:font-medium tracking-wide text-charcoal mt-1">
                {displayPrice.toLocaleString()} ₮
              </span>
              {salePrice && (
                <span className="text-xs text-neutral-500 line-through mt-1">
                  {price.toLocaleString()} ₮
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Add - visible on touch screens, subtle reveal on desktop */}
      <div className="mt-3 md:mt-6 grid grid-cols-2 gap-2 md:flex md:justify-center md:opacity-0 md:group-hover:opacity-100 md:transition-all md:duration-700 md:translate-y-2 md:group-hover:translate-y-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (inStock) addToCart(product);
          }}
          className="min-h-10 rounded-[10px] md:rounded-[8px] bg-blush md:bg-[#FFF0F6] border border-[#F2A8C8]/60 md:border-[#F2A8C8] px-2 text-[11px] md:text-[10px] md:tracking-[0.12em] md:uppercase font-medium hover:bg-[#FFB7D5] hover:text-charcoal hover:border-[#FFB7D5] transition-colors disabled:opacity-30"
          disabled={!inStock}
        >
          Сагс
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (inStock) buyNow({ product, quantity: 1 });
          }}
          className="min-h-10 rounded-[10px] md:rounded-[8px] bg-charcoal text-white border border-charcoal px-2 text-[11px] md:text-[10px] md:tracking-[0.12em] md:uppercase font-medium hover:bg-[#FFB7D5] hover:text-charcoal hover:border-[#FFB7D5] transition-colors disabled:opacity-30"
          disabled={!inStock}
        >
          Авах
        </button>
      </div>
    </div>
  );
}
