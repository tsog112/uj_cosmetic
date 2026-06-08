import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const rows = await prisma.notification.findMany({
      where: { userId: auth.uid },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = rows.filter((row) => row.status === 'unread').length;

    return NextResponse.json({
      notifications: rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        href: row.href || '/profile/orders',
        status: row.status,
        createdAt: row.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('User notifications API failed:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await prisma.notification.updateMany({
      where: { userId: auth.uid, status: 'unread' },
      data: { status: 'read' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mark notifications read failed:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
