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

  /* ── Auto-slideshow ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (images.length < 2 || isHovered) return;
    const timer = window.setInterval(
      () => setImageIndex(prev => (prev + 1) % images.length),
      SLIDESHOW_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [images.length, isHovered]);

  useEffect(() => { setImageIndex(0); }, [product.id]);

  /* ── Wishlist ────────────────────────────────────────────────────────── */
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
        {/* ── Image container ─────────────────────────────────────────────── */}
        <motion.div
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] border border-border-light bg-blush shadow-brand-sm"
          animate={{
            boxShadow: isHovered ? '0 22px 48px -18px rgba(91,46,67,0.28)' : '0 1px 2px rgba(91,46,67,0.06)',
          }}
          transition={{ duration: 0.45, ease: 'easeOut' as const }}
        >
          <motion.div
            key={image}
            initial={{ opacity: 0.35, scale: 1.015 }}
            animate={{ opacity: 1, scale: isHovered ? 1.045 : 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' as const }}
            className="relative h-full w-full"
          >
            <Image src={image} alt={name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          </motion.div>

          {/* Slideshow dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === imageIndex % images.length ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Sale badge */}
          {salePrice && inStock && (
            <span className="absolute left-3 top-3 rounded-tag bg-dusty-rose px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
              Sale
            </span>
          )}

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-sand/55 backdrop-blur-[2px]">
              <span className="rounded-tag bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted shadow-brand-sm">
                Дууссан
              </span>
            </div>
          )}

          {/* Hover tint */}
          <div className={`absolute inset-0 bg-dusty-rose/10 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        </motion.div>

        {/* ── Product info ──────────────────────────────────────────────────── */}
        <div className="mt-3 px-0 md:mt-5 md:px-1">
          <p className="hidden text-[9px] font-semibold uppercase tracking-[0.22em] text-dusty-rose md:block">
            UJ selection
          </p>
          <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-charcoal transition-opacity duration-300 group-hover:opacity-70 md:text-[16px]">
            {name}
          </h3>
          <p className="mt-2 hidden text-xs italic text-text-muted md:block">Өдөр тутмын зөөлөн арчилгаа</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-charcoal">{formatPrice(displayPrice)}</span>
            {salePrice && (
              <span className="text-xs text-text-faint line-through">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Wishlist button ───────────────────────────────────────────────── */}
      <button
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-white/92 shadow-brand-sm backdrop-blur-sm transition-colors hover:bg-blush ${
          isWishlisted ? 'text-dusty-rose' : 'text-charcoal'
        }`}
        aria-label={isWishlisted ? 'Хадгалснаас хасах' : 'Хадгалах'}
      >
        <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:mt-5 md:opacity-0 md:transition-all md:duration-500 md:group-hover:opacity-100">
        <button
          onClick={e => { e.preventDefault(); if (inStock) addToCart(product); }}
          className="min-h-11 rounded-btn border border-border-light bg-blush px-2 text-[12px] font-semibold transition-colors hover:border-dusty-rose hover:bg-dusty-rose hover:text-white disabled:opacity-30"
          disabled={!inStock}
        >
          Сагсанд хийх
        </button>
        <button
          onClick={e => { e.preventDefault(); if (inStock) buyNow({ product, quantity: 1 }); }}
          className="min-h-11 rounded-btn border border-charcoal bg-charcoal px-2 text-[12px] font-semibold text-white transition-colors hover:border-dusty-rose hover:bg-dusty-rose disabled:opacity-30"
          disabled={!inStock}
        >
          Шууд авах
        </button>
      </div>
    </div>
  );
}
