import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendPasswordResetEmail } from '@/lib/emailService';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, { key: 'forgot-password', limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  try {
    const { email } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const genericMessage = 'Хэрэв тухайн и-мэйл бүртгэлтэй бол нууц үг сэргээх линк илгээгдэнэ.';

    if (!cleanEmail) {
      return NextResponse.json({ message: genericMessage });
    }

    try {
      const authUser = await getAuth().getUserByEmail(cleanEmail);
      const hasPasswordProvider = authUser.providerData.some((provider) => provider.providerId === 'password');
      if (!hasPasswordProvider) {
        return NextResponse.json({
          message: 'Энэ бүртгэл Google-р нэвтэрдэг тул нууц үг тохируулагдаагүй байна. Google товч ашиглан нэвтэрнэ үү.',
          googleOnly: true,
        });
      }

      const token = randomUUID();
      const expires = new Date(Date.now() + 30 * 60 * 1000);
      await getAdminDb().collection('users').doc(authUser.uid).set({
        password_reset_token: token,
        password_reset_expires: Timestamp.fromDate(expires),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      await sendPasswordResetEmail(cleanEmail, appUrl(`/reset-password?token=${token}`));
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') {
        console.error('Forgot password lookup/send failed:', error);
      }
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error('Forgot password API failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
