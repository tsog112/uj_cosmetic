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
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const name = product.name_mn || 'Нэргүй бараа';
  const image = product.images?.[0] || '/placeholder-product.svg';
  const price = product.price || 0;
  const inStock = product.inStock;

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
          className="relative aspect-[4/5] w-full overflow-hidden bg-[#F9F8F6] border border-border rounded-sm shadow-sm"
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
          {!inStock && (
            <div className="absolute inset-0 bg-[#F9F8F6]/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="editorial-label bg-sand px-4 py-2 shadow-sm text-[10px]">
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
        <div className="mt-6 flex flex-col items-center text-center px-2">
          <h3 className="font-serif text-lg md:text-xl font-light text-charcoal mb-2 tracking-[0.05em] group-hover:opacity-70 transition-opacity duration-500">
            {name}
          </h3>
          <div className="flex flex-col items-center gap-1 mt-auto">
            <span className="font-serif italic text-sm text-neutral-600 tracking-[0.05em]">
              Арьс арчилгаа
            </span>
            <span className="font-sans text-sm font-medium tracking-wider text-charcoal mt-1">
              {price.toLocaleString()} ₮
            </span>
          </div>
        </div>
      </Link>

      {/* Quick Add - Subtle reveal */}
      <div className="mt-6 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (inStock) addToCart(product);
          }}
          className="editorial-label text-[10px] border-b border-charcoal pb-1 hover:text-neutral-600 hover:border-neutral-600 transition-colors disabled:opacity-30"
          disabled={!inStock}
        >
          Сагсанд нэмэх +
        </button>
      </div>
    </div>
  );
}
