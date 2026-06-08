import { NextRequest, NextResponse } from 'next/server';
import { deletePostgresAdminReview } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deletePostgresAdminReview(id);
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
