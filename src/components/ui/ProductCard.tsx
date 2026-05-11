'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { addToWishlist, getWishlistStatus, removeFromWishlist } from '@/lib/services/firestoreService';
import { Product } from '@/types';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const name = product.name_mn || product.name_en || 'Бүтээгдэхүүн';
  const image = product.images?.[0] || '/placeholder-product.svg';
  const price = product.price || 0;
  const salePrice = product.salePrice;
  const displayPrice = salePrice || price;
  const inStock = product.inStock !== false && Number(product.stockQuantity ?? 1) > 0;

  useEffect(() => {
    if (!user) {
      setIsWishlisted(false);
      return;
    }
    getWishlistStatus(user.uid, product.id)
      .then(setIsWishlisted)
      .catch(() => {});
  }, [user, product.id]);

  const handleWishlist = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push('/auth');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(user.uid, product.id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(user.uid, product);
        setIsWishlisted(true);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div
      className="group relative flex h-full flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/shop/${product.slug}`} className="block w-full flex-grow">
        <motion.div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] border border-[#F2C7D8] bg-[#FFF0F6] shadow-sm"
          animate={{
            boxShadow: isHovered ? '0 22px 48px -18px rgba(91,46,67,0.28)' : '0 1px 2px rgba(91,46,67,0.06)',
          }}
          transition={{ duration: 0.45, ease: 'easeOut' as const }}
        >
          <motion.div
            animate={{ scale: isHovered ? 1.045 : 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' as const }}
            className="relative h-full w-full"
          >
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </motion.div>

          {salePrice && inStock && (
            <span className="absolute left-3 top-3 rounded-full bg-[#D994B5] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
              Sale
            </span>
          )}

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#FFF8FB]/55 backdrop-blur-[2px]">
              <span className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7B6670] shadow-sm">
                Дууссан
              </span>
            </div>
          )}

          <div className={`absolute inset-0 bg-[#D994B5]/10 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        </motion.div>

        <div className="mt-3 px-0 md:mt-5 md:px-1">
          <p className="hidden text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D994B5] md:block">
            UJ selection
          </p>
          <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-[#1F191C] transition-opacity duration-300 group-hover:opacity-70 md:text-[16px]">
            {name}
          </h3>
          <p className="mt-2 hidden text-xs italic text-[#7E6472] md:block">Өдөр тутмын зөөлөн арчилгаа</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#1F191C]">{displayPrice.toLocaleString()} ₮</span>
            {salePrice && (
              <span className="text-xs text-[#9A7D88] line-through">{price.toLocaleString()} ₮</span>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#F2C7D8] bg-white/92 shadow-sm backdrop-blur-sm transition-colors ${
          isWishlisted ? 'text-[#D994B5]' : 'text-[#1F191C]'
        } hover:bg-[#FFF0F6]`}
        aria-label={isWishlisted ? 'Хадгалснаас хасах' : 'Хадгалах'}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
        </svg>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2 md:mt-5 md:opacity-0 md:transition-all md:duration-500 md:group-hover:opacity-100">
        <button
          onClick={event => {
            event.preventDefault();
            if (inStock) addToCart(product);
          }}
          className="min-h-10 rounded-[8px] border border-[#F2C7D8] bg-[#FFF0F6] px-2 text-[11px] font-semibold transition-colors hover:border-[#D994B5] hover:bg-[#D994B5] hover:text-white disabled:opacity-30 md:text-[10px] md:uppercase md:tracking-[0.12em]"
          disabled={!inStock}
        >
          Сагс
        </button>
        <button
          onClick={event => {
            event.preventDefault();
            if (inStock) buyNow({ product, quantity: 1 });
          }}
          className="min-h-10 rounded-[8px] border border-[#241820] bg-[#241820] px-2 text-[11px] font-semibold text-white transition-colors hover:border-[#D994B5] hover:bg-[#D994B5] disabled:opacity-30 md:text-[10px] md:uppercase md:tracking-[0.12em]"
          disabled={!inStock}
        >
          Авах
        </button>
      </div>
    </div>
  );
}
