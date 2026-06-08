import { NextRequest, NextResponse } from 'next/server';
import {
  countFirestoreAdmins,
  listAdminUsers,
  updateAdminUserRole,
} from '@/lib/services/firestoreAdminService';
import {
  countPostgresAdmins,
  updatePostgresAdminUserRole,
} from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
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

/** Postgres + Firestore хоёроос админуудын нэгдсэн id жагсаалт. */
async function collectAdminIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const [pg, fs] = await Promise.allSettled([countPostgresAdmins(), countFirestoreAdmins()]);
  if (pg.status === 'fulfilled') pg.value.ids.forEach((id) => ids.add(id));
  if (fs.status === 'fulfilled') fs.value.ids.forEach((id) => ids.add(id));
  return ids;
}

export async function PATCH(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const userId = String(body.userId || '');
    const role = String(body.role || '');

    if (!userId || !['admin', 'customer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user or role' }, { status: 400 });
    }

    // Сүүлийн админыг хасахаас хамгаална
    if (role === 'customer') {
      const adminIds = await collectAdminIds();
      if (adminIds.has(userId) && adminIds.size <= 1) {
        return NextResponse.json(
          { error: 'Системд дор хаяж нэг админ үлдэх ёстой. Сүүлийн админ эрхийг хасах боломжгүй.' },
          { status: 409 },
        );
      }
    }

    // Firestore (AuthContext-ийн listener энэ дээр суурилдаг) + Postgres хоёуланд бичнэ
    const user = await updateAdminUserRole(userId, role as 'admin' | 'customer');
    await updatePostgresAdminUserRole(userId, role as 'admin' | 'customer', {
      email: user?.email || null,
      name: user?.name || null,
    }).catch((error) => {
      console.warn('Postgres role sync failed:', error);
    });

    return NextResponse.json({ user, role });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
