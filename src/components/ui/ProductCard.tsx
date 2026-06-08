'use client';

import { useCallback, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { type Product } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const [renderedAt] = useState(() => Date.now());
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const { isWishlisted: checkWishlisted, add: addWishlist, remove: removeWishlist } = useWishlist();
  const router = useRouter();
  const { toast } = useToast();
  const isWishlisted = checkWishlisted(product.id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const name = product.name_mn || product.name_en || '\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d';
  const image = product.images?.[0] || '/placeholder-product.svg';
  const price = product.price || 0;
  const salePrice = product.salePrice;
  const displayPrice = salePrice || price;
  const inStock = product.inStock !== false && Number(product.stockQuantity ?? 1) > 0;
  const discountPct = salePrice && price ? Math.round((1 - salePrice / price) * 100) : 0;
  const isOnSale = salePrice !== null && salePrice !== undefined;
  const isNew = product.createdAt
    ? (() => {
        try {
          const createdAtValue = product.createdAt as unknown as { toDate?: () => Date } | string | number | Date;
          const date = typeof createdAtValue === 'object' && createdAtValue !== null && 'toDate' in createdAtValue && typeof createdAtValue.toDate === 'function'
            ? createdAtValue.toDate()
            : new Date(createdAtValue as string | number | Date);
          return renderedAt - date.getTime() < 1000 * 60 * 60 * 24 * 14;
        } catch {
          return false;
        }
      })()
    : false;

  const handleWishlist = useCallback(async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      router.push('/auth');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeWishlist(product.id);
        toast('\u0425\u0430\u0434\u0433\u0430\u043b\u0441\u043d\u0430\u0430\u0441 \u0445\u0430\u0441\u043b\u0430\u0430', 'info');
      } else {
        await addWishlist(product);
        toast('\u0425\u0430\u0434\u0433\u0430\u043b\u0441\u0430\u043d \u0431\u0430\u0440\u0430\u0430\u043d\u0434 \u043d\u044d\u043c\u043b\u044d\u044d', 'success');
      }
    } finally {
      setWishlistLoading(false);
    }
  }, [addWishlist, isWishlisted, product, removeWishlist, router, toast, user]);

  const handleAddToCart = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;
    addToCart(product);
    setAddedToCart(true);
    toast('\u0421\u0430\u0433\u0441\u0430\u043d\u0434 \u043d\u044d\u043c\u044d\u0433\u0434\u043b\u044d\u044d', 'success');
    window.setTimeout(() => setAddedToCart(false), 800);
  }, [addToCart, inStock, product, toast]);

  const handleBuyNow = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;
    buyNow({ product, quantity: 1 });
  }, [buyNow, inStock, product]);

  return (
    <article
      className="group relative flex h-full flex-col self-stretch uj-pressable uj-snap-start"
      style={{
        width: compact ? '172px' : '100%',
        minWidth: compact ? '172px' : '0',
        flexShrink: 0,
      }}
    >
      <Link href={`/shop/${product.slug}`} className="block" style={{ textDecoration: 'none' }}>
        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-[22px] border border-[#F0E8ED] bg-[#F7F3F5] uj-image-hover transition-all duration-300 group-hover:-translate-y-0.5"
          style={{ boxShadow: 'var(--shadow-xs)' }}
        >
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes={compact ? '172px' : '(max-width: 768px) 46vw, (max-width: 1280px) 24vw, 220px'}
          />

          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1" aria-label="Product status">
            {isNew && (
              <span className="uj-product-badge-new rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]">
                {'\u0428\u0438\u043d\u044d'}
              </span>
            )}
            {isOnSale && discountPct > 0 && (
              <span className="rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-[var(--shadow-glow)]">
                -{discountPct}%
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#F0E8ED] bg-white/95 transition-all duration-200 hover:scale-105 md:h-11 md:w-11 ${isWishlisted ? 'uj-heart-on text-[var(--color-brand)]' : 'uj-heart-off text-[var(--color-text-primary)]'}`}
            style={{ boxShadow: 'var(--shadow-xs)' }}
            aria-label={isWishlisted ? '\u0425\u0430\u0434\u0433\u0430\u043b\u0441\u043d\u0430\u0430\u0441 \u0445\u0430\u0441\u0430\u0445' : '\u0425\u0430\u0434\u0433\u0430\u043b\u0430\u0445'}
            aria-pressed={isWishlisted}
          >
            <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.9} />
          </button>

          {!inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-sm">
              <span className="text-label rounded-full bg-black px-3 py-1 text-white">{'\u0414\u0443\u0443\u0441\u0441\u0430\u043d'}</span>
            </div>
          )}
        </div>

        <div className="pt-3">
          <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-semibold leading-snug text-[var(--color-text-primary)]" title={name}>
            {name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-bold text-[var(--color-brand)]"><PriceDisplay amountMnt={displayPrice} /></span>
            {salePrice && <span className="text-[11px] text-[var(--color-text-muted)] line-through"><PriceDisplay amountMnt={price} /></span>}
          </div>
        </div>
      </Link>

      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--color-brand-mid)] bg-white px-2 text-[11px] font-bold text-[var(--color-brand)] transition-all duration-200 hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-light)] active:scale-[0.97] disabled:border-[#E5E0E3] disabled:text-[var(--color-text-muted)]"
            style={{ boxShadow: 'var(--shadow-xs)' }}
            aria-label={'\u0421\u0430\u0433\u0441\u0430\u043d\u0434 \u0445\u0438\u0439\u0445'}
          >
            <ShoppingBag size={16} strokeWidth={2} className="shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
            <span className="truncate">{addedToCart ? '\u041d\u044d\u043c\u044d\u0433\u0434\u043b\u044d\u044d' : '\u0421\u0430\u0433\u0441\u0430\u043d\u0434'}</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!inStock}
            className="flex min-h-11 items-center justify-center rounded-full bg-[var(--color-brand)] px-2 text-[11px] font-bold text-white transition-all duration-200 hover:bg-[var(--color-brand-dark)] active:scale-[0.97] disabled:bg-[#CFC7CB]"
            style={{ boxShadow: 'var(--shadow-glow)' }}
          >
            <span className="truncate">{'\u0428\u0443\u0443\u0434 \u0430\u0432\u0430\u0445'}</span>
          </button>
        </div>
      )}
    </article>
  );
}
