import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { enforceRateLimit } from '@/lib/rateLimit';
import { upsertPostgresUserFromAuth } from '@/lib/userSync';

export const runtime = 'nodejs';

/**
 * Firebase-аар нэвтэрсний дараа клиентээс дуудаж, хэрэглэгчийг Postgres-д
 * баталгаажуулна. Token-оор баталгаажуулсан тул userId-г залилах боломжгүй.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, { key: 'auth-sync', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const phoneRaw = body?.phone;
  const phone =
    typeof phoneRaw === 'string'
      ? phoneRaw.trim()
      : phoneRaw && typeof phoneRaw === 'object'
        ? String(phoneRaw.localNumber || '').trim()
        : null;

  const user = await upsertPostgresUserFromAuth(auth, {
    displayName: typeof body?.displayName === 'string' ? body.displayName.trim() : null,
    phone: phone || null,
    emailVerified: body?.emailVerified === true ? true : undefined,
    googleId: typeof body?.googleId === 'string' ? body.googleId : null,
    googleEmail: typeof body?.googleEmail === 'string' ? body.googleEmail : null,
    googleAvatarUrl: typeof body?.googleAvatarUrl === 'string' ? body.googleAvatarUrl : null,
  });

  return NextResponse.json({ ok: Boolean(user), id: auth.uid, role: auth.role });
}
