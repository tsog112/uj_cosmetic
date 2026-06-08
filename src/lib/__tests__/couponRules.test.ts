import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COUPONS,
  computeDiscount,
  isCouponUsable,
  normalizeCouponCode,
  pickCoupon,
  type CouponConfig,
} from '@/lib/couponRules';

describe('normalizeCouponCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeCouponCode('  welcome10 ')).toBe('WELCOME10');
  });
  it('handles nullish', () => {
    expect(normalizeCouponCode(null)).toBe('');
    expect(normalizeCouponCode(undefined)).toBe('');
  });
});

describe('computeDiscount', () => {
  const percent: CouponConfig = { code: 'P', type: 'percent', value: 10, active: true };
  const fixed: CouponConfig = { code: 'F', type: 'fixed', value: 5000, active: true };

  it('computes percent rounded', () => {
    expect(computeDiscount(percent, 33333)).toBe(3333);
  });
  it('clamps percent to 0-100', () => {
    expect(computeDiscount({ ...percent, value: 150 }, 1000)).toBe(1000);
    expect(computeDiscount({ ...percent, value: -10 }, 1000)).toBe(0);
  });
  it('caps fixed discount at subtotal', () => {
    expect(computeDiscount(fixed, 3000)).toBe(3000);
    expect(computeDiscount(fixed, 9000)).toBe(5000);
  });
});

describe('isCouponUsable', () => {
  const base: CouponConfig = { code: 'X', type: 'percent', value: 10, active: true };

  it('rejects inactive', () => {
    expect(isCouponUsable({ ...base, active: false }, 10000)).toBe(false);
  });
  it('enforces minSubtotal', () => {
    expect(isCouponUsable({ ...base, minSubtotal: 50000 }, 10000)).toBe(false);
    expect(isCouponUsable({ ...base, minSubtotal: 50000 }, 60000)).toBe(true);
  });
  it('respects expiry', () => {
    const now = new Date('2026-06-05T00:00:00Z').getTime();
    expect(isCouponUsable({ ...base, expiresAt: '2026-06-01T00:00:00Z' }, 10000, now)).toBe(false);
    expect(isCouponUsable({ ...base, expiresAt: '2026-07-01T00:00:00Z' }, 10000, now)).toBe(true);
  });
});

describe('pickCoupon', () => {
  it('resolves WELCOME10 from defaults', () => {
    const result = pickCoupon(DEFAULT_COUPONS, 'welcome10', 100000);
    expect(result).toEqual({ code: 'WELCOME10', discount: 10000 });
  });
  it('returns null for unknown code', () => {
    expect(pickCoupon(DEFAULT_COUPONS, 'NOPE', 100000)).toBeNull();
  });
  it('returns null for empty code', () => {
    expect(pickCoupon(DEFAULT_COUPONS, '', 100000)).toBeNull();
  });
  it('returns null when discount would be zero', () => {
    const coupons: CouponConfig[] = [{ code: 'Z', type: 'fixed', value: 0, active: true }];
    expect(pickCoupon(coupons, 'Z', 100000)).toBeNull();
  });
  it('does not trust client — recomputes from subtotal', () => {
    const result = pickCoupon(DEFAULT_COUPONS, 'WELCOME10', 50000);
    expect(result?.discount).toBe(5000);
  });
});
