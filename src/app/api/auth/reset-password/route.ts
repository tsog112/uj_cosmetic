import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function toDate(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function findUserByToken(token: string) {
  const snap = await getAdminDb().collection('users').where('password_reset_token', '==', token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  const expires = toDate(data.password_reset_expires);
  if (!expires || expires.getTime() < Date.now()) return null;
  return { doc, data };
}

export async function GET(request: NextRequest) {
  const token = String(request.nextUrl.searchParams.get('token') || '').trim();
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const match = await findUserByToken(token);
  return NextResponse.json({ valid: Boolean(match), email: match?.data.email || null }, { status: match ? 200 : 400 });
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    const cleanToken = String(token || '').trim();
    const newPassword = String(password || '');
    if (!cleanToken || newPassword.length < 8) {
      return NextResponse.json({ error: 'Invalid reset request' }, { status: 400 });
    }

    const match = await findUserByToken(cleanToken);
    if (!match) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    await getAuth().updateUser(match.doc.id, { password: newPassword });
    await match.doc.ref.set({
      password_hash: 'firebase-auth-managed',
      password_reset_token: null,
      password_reset_expires: null,
      passwordLastChanged: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
