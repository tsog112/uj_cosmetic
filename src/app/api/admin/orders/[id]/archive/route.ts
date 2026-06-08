import { NextRequest, NextResponse } from 'next/server';
import { archivePostgresAdminOrder } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { archive } = await req.json();

    if (typeof archive !== 'boolean') {
      return NextResponse.json({ error: 'Archive parameter must be a boolean' }, { status: 400 });
    }

    const order = await archivePostgresAdminOrder(id, archive);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    console.error('Error manual archiving order:', error);
    return NextResponse.json({ error: 'Failed to archive order' }, { status: 500 });
  }
}
