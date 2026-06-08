'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/auth/clientFetch';
import { createInflightRunner } from '@/lib/client/inflight';
import { addToWishlist, removeFromWishlist } from '@/lib/services/firestoreService';
import type { Product, WishlistItem } from '@/types';

type WishlistContextValue = {
  loading: boolean;
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  add: (product: Product) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const runWishlistFetch = createInflightRunner<string>();

function reviveWishlistItem(item: Record<string, unknown>): WishlistItem {
  const base = item as unknown as WishlistItem;
  return {
    ...base,
    createdAt: item.createdAt ? new Date(String(item.createdAt)) : base.createdAt,
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) {
      setIds(new Set());
      setItems([]);
      return;
    }

    await runWishlistFetch(uid, async () => {
      setLoading(true);
      try {
        const response = await authFetch('/api/wishlist', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const nextItems: WishlistItem[] = Array.isArray(data?.items)
          ? data.items.map((item: Record<string, unknown>) => reviveWishlistItem(item))
          : [];
        setItems(nextItems);
        setIds(new Set(nextItems.map((item) => item.productId)));
      } catch {
        // Wishlist алдаа UI-г унагахгүй — хоосон төлөв үлдээнэ.
      } finally {
        setLoading(false);
      }
    });
  }, [uid]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const isWishlisted = useCallback((productId: string) => ids.has(productId), [ids]);

  const add = useCallback(
    async (product: Product) => {
      if (!uid) return;
      await addToWishlist(uid, product);
      setIds((prev) => new Set(prev).add(product.id));
      setItems((prev) => {
        if (prev.some((item) => item.productId === product.id)) return prev;
        const image = product.images?.[0] || '/placeholder-product.svg';
        return [
          {
            id: product.id,
            userId: uid,
            productId: product.id,
            productSlug: product.slug,
            productName: product.name_mn || product.name_en || '',
            productImage: image,
            price: product.price,
            salePrice: product.salePrice,
            inStock: product.inStock !== false,
            createdAt: new Date(),
          },
          ...prev,
        ];
      });
    },
    [uid],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!uid) return;
      await removeFromWishlist(uid, productId);
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    },
    [uid],
  );

  const value = useMemo(
    () => ({ loading, items, isWishlisted, add, remove, refresh }),
    [loading, items, isWishlisted, add, remove, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
