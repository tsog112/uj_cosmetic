import { NextRequest, NextResponse } from 'next/server';
import { notifyPostgresUsers } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function POST(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { userIds, title, message, type = 'PROMO', href, couponCode } = await req.json();
    const ids = Array.isArray(userIds) ? userIds.filter(Boolean) : [];

    if (!ids.length) {
      return NextResponse.json({ error: 'Сонгосон хэрэглэгч байхгүй.' }, { status: 400 });
    }
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Гарчиг болон мессеж заавал.' }, { status: 400 });
    }

    const count = await notifyPostgresUsers(ids, {
      title,
      message,
      type,
      href: href || '/shop',
      couponCode,
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Bulk customer notify failed:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
