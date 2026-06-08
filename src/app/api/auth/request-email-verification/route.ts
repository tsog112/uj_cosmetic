import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendEmailVerification } from '@/lib/emailService';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const resendLocks = new Map<string, number>();

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, { key: 'email-verification', limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  try {
    const { uid, email } = await request.json();
    const db = getAdminDb();
    let userId = String(uid || '').trim();
    let targetEmail = String(email || '').trim().toLowerCase();

    if (!userId && targetEmail) {
      const authUser = await getAuth().getUserByEmail(targetEmail);
      userId = authUser.uid;
    }
    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 400 });
    }

    const now = Date.now();
    const lockedUntil = resendLocks.get(userId) || 0;
    if (lockedUntil > now) {
      return NextResponse.json({ error: 'Дахин илгээхийн өмнө 60 секунд хүлээнэ үү.' }, { status: 429 });
    }

    const authUser = await getAuth().getUser(userId);
    targetEmail = targetEmail || authUser.email || '';
    if (!targetEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const token = randomUUID();
    await db.collection('users').doc(userId).set({
      email: targetEmail,
      email_verified: false,
      email_verify_token: token,
      email_verify_expires: Timestamp.fromDate(new Date(now + 24 * 60 * 60 * 1000)),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await sendEmailVerification(targetEmail, appUrl(`/verify-email?token=${token}`));
    resendLocks.set(userId, now + 60 * 1000);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request email verification failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
