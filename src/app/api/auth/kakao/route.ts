import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebaseAdmin';
import { enforceRateLimit } from '@/lib/rateLimit';

type KakaoUser = {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email_needs_agreement?: boolean;
    profile_needs_agreement?: boolean;
  };
};

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, { key: 'auth-kakao', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) {
    return NextResponse.json({ error: 'Kakao login is not configured' }, { status: 503 });
  }

  try {
    const { accessToken } = await req.json();
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Kakao token invalid' }, { status: 401 });
    }

    const kakaoUser = (await profileRes.json()) as KakaoUser;
    const kakaoId = String(kakaoUser.id);
    const uid = `kakao_${kakaoId}`;
    const nickname = kakaoUser.kakao_account?.profile?.nickname || 'Kakao User';
    const email = kakaoUser.kakao_account?.email || `kakao_${kakaoId}@kakao.user`;
    const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url || '';

    const customToken = await getFirebaseAdminAuth().createCustomToken(uid, {
      provider: 'kakao',
      kakaoId,
    });

    return NextResponse.json({
      customToken,
      profile: { uid, email, displayName: nickname, photoURL, kakaoId },
    });
  } catch (error: unknown) {
    console.error('Kakao auth failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kakao login failed' },
      { status: 500 },
    );
  }
}
