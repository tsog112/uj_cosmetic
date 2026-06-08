/**
 * Купоны цэвэр дүрмүүд — DB хамааралгүй тул unit test хийхэд хялбар.
 * `coupons.ts` нь эндээс импортолж, тохиргоо (Postgres) уншина.
 */

export type CouponType = 'percent' | 'fixed';

export interface CouponConfig {
  code: string;
  type: CouponType;
  /** percent: 0-100, fixed: ₮ дүн */
  value: number;
  active: boolean;
  minSubtotal?: number;
  /** ISO огноо эсвэл null (хязгааргүй) */
  expiresAt?: string | null;
  description?: string;
}

export interface ResolvedCoupon {
  code: string;
  discount: number;
}

export const DEFAULT_COUPONS: CouponConfig[] = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    active: true,
    minSubtotal: 0,
    expiresAt: null,
    description: 'Шинэ хэрэглэгчийн 10% хөнгөлөлт',
  },
];

export function normalizeCouponCode(code: unknown): string {
  return String(code || '').trim().toUpperCase();
}

export function computeDiscount(coupon: CouponConfig, subtotal: number): number {
  if (coupon.type === 'percent') {
    const pct = Math.max(0, Math.min(100, Number(coupon.value || 0)));
    return Math.round((subtotal * pct) / 100);
  }
  const fixed = Math.max(0, Math.round(Number(coupon.value || 0)));
  return Math.min(fixed, subtotal);
}

export function isCouponUsable(coupon: CouponConfig, subtotal: number, now = Date.now()): boolean {
  if (!coupon.active) return false;
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return false;
  if (coupon.expiresAt) {
    const expiry = new Date(coupon.expiresAt).getTime();
    if (Number.isFinite(expiry) && expiry < now) return false;
  }
  return true;
}

/**
 * Цэвэр функц: өгөгдсөн купоны жагсаалтаас код тааруулж, хэрэглэх боломжтой бол
 * хөнгөлөлтийг тооцоолно. Хэрэглэгчийн илгээсэн discount-д хэзээ ч итгэхгүй.
 */
export function pickCoupon(
  coupons: CouponConfig[],
  code: unknown,
  subtotal: number,
  now = Date.now(),
): ResolvedCoupon | null {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;

  const match = coupons.find((c) => normalizeCouponCode(c.code) === normalized);
  if (!match) return null;
  if (!isCouponUsable(match, subtotal, now)) return null;

  const discount = computeDiscount(match, subtotal);
  if (discount <= 0) return null;

  return { code: normalized, discount };
}
