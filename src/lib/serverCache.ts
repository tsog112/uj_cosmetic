type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const globalForCache = globalThis as typeof globalThis & {
  __ujServerCache?: Map<string, CacheEntry<unknown>>;
};

const cache = globalForCache.__ujServerCache ?? new Map<string, CacheEntry<unknown>>();
globalForCache.__ujServerCache = cache;

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) return existing.value;

  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
