import { NextRequest, NextResponse } from 'next/server';
import { listAdminUsers, updateAdminUserRole } from '@/lib/services/firestoreAdminService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const result = await listAdminUsers(search || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || '');
    const role = String(body.role || '');

    if (!userId || !['admin', 'customer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user or role' }, { status: 400 });
    }

    const user = await updateAdminUserRole(userId, role as 'admin' | 'customer');
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
