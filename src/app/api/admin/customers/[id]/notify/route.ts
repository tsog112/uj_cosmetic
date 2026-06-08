import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyPostgresUsers } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id: userId } = await params;
    const { title, message, type = 'PROMO', link, couponCode } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await notifyPostgresUsers([userId], {
      title,
      message,
      type,
      href: link || '/shop',
      couponCode,
    });

    return NextResponse.json({ success: true, id: userId });
  } catch (error: any) {
    console.error('Notify error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
