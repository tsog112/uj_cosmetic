import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getFirebaseAdminAuth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

export type AuthSession = {
  uid: string;
  email: string | null;
  role: 'admin' | 'customer';
};

export class AuthHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('Auth error:', error);
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

type RequestLike = Pick<NextRequest, 'headers'>;

export function extractBearerToken(req: RequestLike): string | null {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function resolveUserRole(uid: string): Promise<'admin' | 'customer' | null> {
  const pgUser = await prisma.user.findUnique({
    where: { id: uid },
    select: { role: true },
  });
  if (pgUser) {
    return pgUser.role === 'admin' ? 'admin' : 'customer';
  }

  const doc = await getAdminDb().collection('users').doc(uid).get();
  if (!doc.exists) return null;
  const role = String(doc.data()?.role || 'user');
  if (role === 'admin') return 'admin';
  return 'customer';
}

export async function verifyAuthSession(req: RequestLike): Promise<AuthSession> {
  const token = extractBearerToken(req);
  if (!token) {
    throw new AuthHttpError(401, 'Нэвтрэх шаардлагатай');
  }

  let decoded;
  try {
    decoded = await getFirebaseAdminAuth().verifyIdToken(token, true);
  } catch {
    throw new AuthHttpError(401, 'Хүчинтэй бус нэвтрэх токен');
  }

  const uid = decoded.uid;
  const role = await resolveUserRole(uid);
  if (!role) {
    throw new AuthHttpError(403, 'Хэрэглэгчийн бүртгэл олдсонгүй');
  }

  return {
    uid,
    email: decoded.email || null,
    role,
  };
}

export async function requireAuth(req: RequestLike): Promise<AuthSession> {
  return verifyAuthSession(req);
}

export async function requireAdmin(req: RequestLike): Promise<AuthSession> {
  const session = await verifyAuthSession(req);
  if (session.role !== 'admin') {
    throw new AuthHttpError(403, 'Админ эрх шаардлагатай');
  }
  return session;
}

/** Route handler-ийн эхэнд дуудах — алдаа бол NextResponse, амжилттай бол null */
export async function authorizeAdminRequest(req: RequestLike): Promise<NextResponse | null> {
  try {
    await requireAdmin(req);
    return null;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function authorizeUserRequest(req: RequestLike): Promise<NextResponse | AuthSession> {
  try {
    return await requireAuth(req);
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Нэвтрээгүй бол null — нийтэд нээлттэй GET-д like төлөв */
export async function optionalAuthSession(req: RequestLike): Promise<AuthSession | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    return await verifyAuthSession(req);
  } catch {
    return null;
  }
}

export function assertUserId(session: AuthSession, userId: string | null | undefined) {
  const requested = String(userId || '').trim();
  if (!requested || requested !== session.uid) {
    throw new AuthHttpError(403, 'Энэ өгөгдөлд хандах эрхгүй');
  }
}
