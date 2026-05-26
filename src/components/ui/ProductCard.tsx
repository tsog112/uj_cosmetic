'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { addToWishlist, getWishlistStatus, removeFromWishlist } from '@/lib/services/firestoreService';
import { formatPrice, type Product } from '@/types';
import { useToast } from '@/components/ui/Toast';

const SLIDESHOW_INTERVAL_MS = 3400;

// Social proof messages — rotate randomly
const SOCIAL_PROOF = [
  'Сүүлийн 1 цагт 8 хэрэглэгч авлаа',
  'Сүүлийн 24 цагт 23 захиалга',
  '5 хэрэглэгч одоо харж байна',
  'Хамгийн их захиалагддаг',
];

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [socialProof] = useState(() => SOCIAL_PROOF[Math.floor(Math.random() * SOCIAL_PROOF.length)]);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const name = product.name_mn || product.name_en || 'Бүтээгдэхүүн';
  const images = product.images?.length ? product.images : ['/placeholder-product.svg'];
  const image = images[imageIndex % images.length];
  const price = product.price || 0;
  const salePrice = product.salePrice;
  const displayPrice = salePrice || price;
  const inStock = product.inStock !== false && Number(product.stockQuantity ?? 1) > 0;
  const discountPct = salePrice && price ? Math.round((1 - salePrice / price) * 100) : 0;
  const isNew = product.createdAt
    ? (() => {
        try {
          const d = (product.createdAt as any)?.toDate
            ? (product.createdAt as any).toDate()
            : new Date(product.createdAt as any);
          return Date.now() - d.getTime() < 1000 * 60 * 60 * 24 * 14;
        } catch { return false; }
      })()
    : false;

  // Image slideshow
  useEffect(() => {
    if (images.length < 2 || isHovered) return;
    const timer = window.setInterval(
      () => setImageIndex((prev) => (prev + 1) % images.length),
      SLIDESHOW_INTERVAL_MS
    );
    return () => window.clearInterval(timer);
  }, [images.length, isHovered]);

  useEffect(() => setImageIndex(0), [product.id]);

  // Wishlist status
  useEffect(() => {
    if (!user) { setIsWishlisted(false); return; }
    getWishlistStatus(user.uid, product.id).then(setIsWishlisted).catch(() => {});
  }, [user, product.id]);

  // Social proof ticker — show 3s after card is visible
  useEffect(() => {
    const timer = setTimeout(() => setShowSocialProof(true), 2500 + Math.random() * 3000);
    const hideTimer = setTimeout(() => setShowSocialProof(false), 7000 + Math.random() * 3000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  const handleWishlist = useCallback(async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) { router.push('/auth'); return; }
    setWishlistLoading(true);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
    try {
      if (isWishlisted) {
        await removeFromWishlist(user.uid, product.id);
        setIsWishlisted(false);
        toast('Хүслийн жагсаалтаас хасагдлаа', 'info');
      } else {
        await addToWishlist(user.uid, product);
        setIsWishlisted(true);
        toast('Хүслийн жагсаалтад нэмэгдлээ 💕', 'success');
      }
    } finally { setWishlistLoading(false); }
  }, [user, isWishlisted, product, router, toast]);

  const handleAddToCart = useCallback((event: MouseEvent) => {
    event.preventDefault();
    if (!inStock) return;
    addToCart(product);
    setAddedToCart(true);
    toast('Сагсанд нэмэгдлээ ✓', 'success');
    window.setTimeout(() => setAddedToCart(false), 1600);
  }, [inStock, product, addToCart, toast]);

  return (
    <article
      ref={cardRef}
      className="group relative flex h-full flex-col"
      style={{
        borderRadius: 24,
        background: '#FFFFFF',
        boxShadow: isHovered
          ? '0 20px 60px rgba(233,30,140,0.18), 0 4px 16px rgba(233,30,140,0.08)'
          : '0 2px 12px rgba(233,30,140,0.06)',
        transition: 'box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/shop/${product.slug}`} className="block flex-1">
        {/* ── Image ─────────────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            borderRadius: '22px 22px 0 0',
            aspectRatio: compact ? '3/4' : '4/5',
            background: 'var(--color-soft-pink)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={image}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1, scale: isHovered ? 1.06 : 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 430px) 50vw, 215px"
              />
            </motion.div>
          </AnimatePresence>

          {/* Hover gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to top, rgba(26,10,18,0.22) 0%, transparent 55%)',
              opacity: isHovered ? 1 : 0,
            }}
          />

          {/* Image nav dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-[5px]">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className="rounded-full transition-all duration-300"
                  style={{
                    height: 4,
                    width: idx === imageIndex % images.length ? 16 : 4,
                    background:
                      idx === imageIndex % images.length
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.45)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Social proof ticker */}
          <AnimatePresence>
            {showSocialProof && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 left-0 right-0 px-2 pb-2"
              >
                <div
                  style={{
                    background: 'rgba(26,10,18,0.72)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 10,
                    padding: '5px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ fontSize: 8 }}>🔥</span>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.90)', margin: 0, lineHeight: 1.3 }}>
                    {socialProof}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badges — top left */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
            {salePrice && inStock && discountPct > 0 && (
              <span
                className="flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: '#D93F55', animation: 'pulseSoft 2s ease-in-out infinite' }}
              >
                -{discountPct}%
              </span>
            )}
            {isNew && (
              <span
                className="flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #E91E8C, #C2185B)' }}
              >
                ШИНЭ
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!inStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(253,232,243,0.68)', backdropFilter: 'blur(3px)' }}
            >
              <span
                className="rounded-full px-4 py-1.5 text-[11px] font-bold"
                style={{ background: 'white', color: 'var(--color-text-medium)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                Дууссан
              </span>
            </div>
          )}
        </div>

        {/* ── Product info ─────────────────────────────────────── */}
        <div className="px-3 pb-1 pt-3">
          <h3
            className="line-clamp-2 font-bold leading-snug"
            style={{
              fontSize: compact ? 12 : 13,
              minHeight: compact ? 32 : 36,
              color: 'var(--color-text-dark)',
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span
              className="tabular-nums"
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: salePrice ? 'var(--color-primary)' : 'var(--color-text-dark)',
                letterSpacing: '-0.02em',
              }}
            >
              {formatPrice(displayPrice)}
            </span>
            {salePrice && (
              <span
                className="tabular-nums line-through"
                style={{ fontSize: 11, color: 'var(--color-text-light)' }}
              >
                {formatPrice(price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Wishlist button with heart burst ─────────────────── */}
      <button
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all"
        style={{
          background: isWishlisted ? 'rgba(217,63,85,0.12)' : 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          color: isWishlisted ? '#D93F55' : 'rgba(26,10,18,0.45)',
          animation: isWishlisted && showHeartBurst ? 'heartPulse 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
        }}
        aria-label={isWishlisted ? 'Хадгалснаас хасах' : 'Хадгалах'}
      >
        <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2} />

        {/* Mini heart burst */}
        {showHeartBurst && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="mini-heart" aria-hidden="true">💕</span>
            ))}
          </>
        )}
      </button>

      {/* ── Action buttons — slide up on hover ──────────────── */}
      <div
        className="px-2.5 pb-2.5"
        style={{
          transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
          opacity: isHovered ? 1 : 0.85,
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
        }}
      >
        <div className="grid grid-cols-[1fr_40px] gap-1.5">
          <motion.button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full text-[12px] font-bold transition-colors"
            style={{
              background: addedToCart
                ? 'linear-gradient(135deg, #E91E8C, #C2185B)'
                : 'var(--color-soft-pink)',
              color: addedToCart ? '#ffffff' : 'var(--color-text-dark)',
            }}
            animate={{ scale: addedToCart ? [1, 0.95, 1] : 1 }}
            transition={{ duration: 0.25 }}
          >
            <ShoppingBag size={13} strokeWidth={2.2} />
            {addedToCart ? 'Нэмлээ ✓' : 'Сагс'}
          </motion.button>

          <button
            onClick={(event) => {
              event.preventDefault();
              if (inStock) buyNow({ product, quantity: 1 });
            }}
            disabled={!inStock}
            className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40 transition-all"
            style={{
              background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(233,30,140,0.28)',
            }}
            aria-label="Шууд авах"
          >
            <Zap size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}
