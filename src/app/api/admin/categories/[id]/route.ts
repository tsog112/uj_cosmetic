import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminCategory, updateAdminCategory } from '@/lib/services/firestoreAdminService';
import { deletePostgresAdminCategory, updatePostgresAdminCategory } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { name, icon, color, showOnHome } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updated = await updatePostgresAdminCategory(id, name, icon, color, showOnHome)
      .catch(() => updateAdminCategory(id, name, icon, color, showOnHome));
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deletePostgresAdminCategory(id).catch(() => deleteAdminCategory(id));
    return NextResponse.json({ id, deleted: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
