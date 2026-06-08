/** Ижил түлхүүртэй зэрэгцээ дуудлагыг нэг promise-р нэгтгэнэ. */
export function createInflightRunner<TKey extends string>() {
  const inflight = new Map<TKey, Promise<void>>();

  return async (key: TKey, run: () => Promise<void>): Promise<void> => {
    const existing = inflight.get(key);
    if (existing) return existing;

    const promise = run().finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, promise);
    return promise;
  };
}
