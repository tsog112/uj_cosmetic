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

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const cleanToken = String(token || '').trim();
    if (!cleanToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const snap = await getAdminDb().collection('users').where('email_verify_token', '==', cleanToken).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const expires = toDate(data.email_verify_expires);
    if (expires && expires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const verifiedEmail = data.pending_email || data.email;
    if (verifiedEmail) {
      await getAuth().updateUser(doc.id, { email: verifiedEmail, emailVerified: true });
    }

    await doc.ref.set({
      email: verifiedEmail,
      email_verified: true,
      email_verified_at: FieldValue.serverTimestamp(),
      email_verify_token: null,
      email_verify_expires: null,
      pending_email: null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify email failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const response = await POST(new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: { 'Content-Type': 'application/json' },
  }));
  return response;
}
