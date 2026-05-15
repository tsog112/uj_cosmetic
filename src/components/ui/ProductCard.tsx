'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { addToWishlist, getWishlistStatus, removeFromWishlist } from '@/lib/services/firestoreService';
import { Product, formatPrice } from '@/types';
import { motion } from 'framer-motion';

const SLIDESHOW_INTERVAL_MS = 3200;

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, buyNow } = useCart();
  const { user }              = useAuth();
  const router                = useRouter();

  const [isHovered,       setIsHovered]       = useState(false);
  const [isWishlisted,    setIsWishlisted]    = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageIndex,      setImageIndex]      = useState(0);

  const name         = product.name_mn || product.name_en || 'Бүтээгдэхүүн';
  const images       = product.images?.length ? product.images : ['/placeholder-product.svg'];
  const image        = images[imageIndex % images.length];
  const price        = product.price    || 0;
  const salePrice    = product.salePrice;
  const displayPrice = salePrice || price;
  const inStock      = product.inStock !== false && Number(product.stockQuantity ?? 1) > 0;

  useEffect(() => {
    if (images.length < 2 || isHovered) return;
    const timer = window.setInterval(
      () => setImageIndex(prev => (prev + 1) % images.length),
      SLIDESHOW_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [images.length, isHovered]);

  useEffect(() => { setImageIndex(0); }, [product.id]);

  useEffect(() => {
    if (!user) { setIsWishlisted(false); return; }
    getWishlistStatus(user.uid, product.id)
      .then(setIsWishlisted)
      .catch(() => {});
  }, [user, product.id]);

  const handleWishlist = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) { router.push('/auth'); return; }

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
        {/* ── Image ──────────────────────────────────────────────────────── */}
        <motion.div
          className="relative aspect-square w-full overflow-hidden rounded-[24px] border border-border-faint bg-white"
          animate={{
            boxShadow: isHovered
              ? '0 20px 40px -12px rgba(91,46,67,0.18)'
              : '0 1px 3px rgba(0,0,0,0.04)',
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            key={image}
            initial={{ opacity: 0.4, scale: 1.01 }}
            animate={{ opacity: 1, scale: isHovered ? 1.03 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="relative h-full w-full bg-white"
          >
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </motion.div>

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {images.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === imageIndex % images.length ? 'w-4 bg-charcoal/60' : 'w-1 bg-charcoal/15'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Sale */}
          {salePrice && inStock && (
            <span className="absolute left-3 top-3 rounded-full bg-dusty-rose px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
              Sale
            </span>
          )}

          {/* Out of stock */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <span className="rounded-full bg-white px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted shadow-sm">
                Дууссан
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Info ───────────────────────────────────────────────────────── */}
        <div className="mt-4 px-0.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-charcoal transition-colors group-hover:text-dusty-rose md:text-[15px]">
            {name}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-sm font-bold tabular-nums text-charcoal">{formatPrice(displayPrice)}</span>
            {salePrice && (
              <span className="text-xs tabular-nums text-text-faint line-through">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className={`absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:shadow-md ${
          isWishlisted ? 'text-dusty-rose' : 'text-charcoal/40'
        }`}
        aria-label={isWishlisted ? 'Хадгалснаас хасах' : 'Хадгалах'}
      >
        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:mt-4 md:opacity-0 md:translate-y-2 md:transition-all md:duration-400 md:ease-out md:group-hover:opacity-100 md:group-hover:translate-y-0">
        <button
          onClick={e => { e.preventDefault(); if (inStock) addToCart(product); }}
          className="btn-secondary min-h-10 px-2 text-[11px] disabled:opacity-30"
          disabled={!inStock}
        >
          Сагсанд хийх
        </button>
        <button
          onClick={e => { e.preventDefault(); if (inStock) buyNow({ product, quantity: 1 }); }}
          className="btn-primary min-h-10 px-2 text-[11px] disabled:opacity-30"
          disabled={!inStock}
        >
          Шууд авах
        </button>
      </div>
    </div>
  );
}
