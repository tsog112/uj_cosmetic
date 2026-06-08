import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { enforceRateLimit } from '@/lib/rateLimit';
import { cancelPostgresOrderByUser } from '@/lib/services/postgresAdminService';

export const runtime = 'nodejs';

/**
 * Хэрэглэгч өөрийн захиалгаа цуцлах. Token-оор баталгаажуулсан тул бусдын
 * захиалгыг цуцлах боломжгүй (IDOR-аас хамгаалсан).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(req, { key: 'order-cancel', limit: 20, windowMs: 60_000, identifier: auth.uid });
  if (limited) return limited;

  try {
    const { id } = await params;
    const result = await cancelPostgresOrderByUser(id, auth.uid);

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
      }
      if (result.reason === 'forbidden') {
        return NextResponse.json({ error: 'Энэ захиалгыг цуцлах эрхгүй' }, { status: 403 });
      }
      return NextResponse.json(
        { error: 'Энэ захиалгыг цуцлах боломжгүй. Бэлтгэгдсэн эсвэл төлбөр төлөгдсөн байна.' },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Order cancel failed:', error);
    return NextResponse.json({ error: 'Захиалга цуцлахад алдаа гарлаа' }, { status: 500 });
  }
}
