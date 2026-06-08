import { NextRequest, NextResponse } from 'next/server';
import { resolveCoupon } from '@/lib/coupons';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

/** Checkout дээр купон шалгах. Эцсийн хөнгөлөлтийг orders/create дахин баталгаажуулна. */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, { key: 'coupon-validate', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const code = body?.code;
    const subtotal = Math.max(0, Math.round(Number(body?.subtotal || 0)));

    if (!code || subtotal <= 0) {
      return NextResponse.json({ valid: false, error: 'Код эсвэл дүн буруу байна.' }, { status: 400 });
    }

    const resolved = await resolveCoupon(code, subtotal);
    if (!resolved) {
      return NextResponse.json({ valid: false, error: 'Урамшууллын код олдсонгүй эсвэл хүчингүй байна.' });
    }

    return NextResponse.json({ valid: true, code: resolved.code, discount: resolved.discount });
  } catch (error) {
    console.error('Coupon validate failed:', error);
    return NextResponse.json({ valid: false, error: 'Код шалгахад алдаа гарлаа.' }, { status: 500 });
  }
}
