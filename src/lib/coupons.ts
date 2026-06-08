import { getPostgresAdminSettings } from '@/lib/services/postgresAdminService';
import {
  DEFAULT_COUPONS,
  normalizeCouponCode,
  pickCoupon,
  type CouponConfig,
  type ResolvedCoupon,
} from '@/lib/couponRules';

export type { CouponConfig, CouponType, ResolvedCoupon } from '@/lib/couponRules';
export { DEFAULT_COUPONS, normalizeCouponCode, pickCoupon } from '@/lib/couponRules';

/** Тохиргооноос (Postgres settings) купоны жагсаалтыг уншина. */
export async function loadCoupons(): Promise<CouponConfig[]> {
  try {
    const settings = (await getPostgresAdminSettings()) as Record<string, unknown> | null;
    const raw = settings?.coupons;
    if (Array.isArray(raw) && raw.length) {
      return raw
        .filter((c): c is CouponConfig => Boolean(c && typeof c === 'object'))
        .map((c): CouponConfig => ({
          code: normalizeCouponCode(c.code),
          type: c.type === 'fixed' ? 'fixed' : 'percent',
          value: Number(c.value || 0),
          active: c.active !== false,
          minSubtotal: Number(c.minSubtotal || 0),
          expiresAt: c.expiresAt ?? null,
          description: c.description || '',
        }))
        .filter((c) => c.code);
    }
  } catch (error) {
    console.warn('loadCoupons failed, falling back to defaults:', error);
  }
  return DEFAULT_COUPONS;
}

/**
 * Сервер талд итгэх купоны шийдвэрлэлт. Хэрэглэгчийн илгээсэн discount-д хэзээ ч
 * итгэхгүй — энэ функцээр subtotal дээр үндэслэн дахин тооцоолно.
 */
export async function resolveCoupon(code: unknown, subtotal: number): Promise<ResolvedCoupon | null> {
  const coupons = await loadCoupons();
  return pickCoupon(coupons, code, subtotal);
}
