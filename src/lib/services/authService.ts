import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

function toAuthError(error: any, fallback: string): Error {
  const code = error?.code || '';
  const privateLoginMessage = 'И-мэйл эсвэл нууц үг буруу байна';
  const messages: Record<string, string> = {
    'auth/invalid-credential': privateLoginMessage,
    'auth/user-not-found': privateLoginMessage,
    'auth/wrong-password': privateLoginMessage,
    'auth/invalid-email': 'И-мэйл хаяг буруу байна.',
    'auth/email-already-in-use': 'Энэ и-мэйлээр бүртгэл үүссэн байна.',
    'auth/weak-password': 'Нууц үг хангалттай хүчтэй биш байна.',
    'auth/popup-closed-by-user': 'Google цонх хаагдсан байна. Дахин оролдоно уу.',
    'auth/kakao-not-configured': 'KakaoTalk нэвтрэлт тохируулаагүй байна.',
    'auth/kakao-cancelled': 'KakaoTalk нэвтрэлт цуцлагдлаа.',
    'auth/email-not-verified': 'И-мэйл баталгаажаагүй байна. Таны и-мэйлд илгээсэн линкийг дарна уу.',
    'auth/google-account-only': 'Энэ и-мэйл Google-р бүртгэлтэй байна. Google товч ашиглан нэвтэрнэ үү.',
  };

  const message = messages[code] || error?.message || fallback;
  return Object.assign(new Error(message), { code });
}

function googleProviderData(user: User) {
  return user.providerData.find((provider) => provider.providerId === 'google.com');
}

/**
 * Firebase хэрэглэгчийг Postgres руу баталгаажуулна (server token verify-тэй).
 * Алдаа гарвал нэвтрэлтийг тасалдуулахгүй — зүгээр л log хийнэ.
 */
async function syncUserToPostgres(user: User, extra: Record<string, any> = {}): Promise<void> {
  try {
    const token = await user.getIdToken();
    const google = googleProviderData(user);
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: user.displayName || '',
        phone: extra.phone ?? null,
        emailVerified: extra.email_verified ?? undefined,
        googleId: extra.google_id ?? google?.uid ?? null,
        googleEmail: extra.google_email ?? (google ? user.email : null),
        googleAvatarUrl: extra.google_avatar_url ?? (google ? user.photoURL : null),
      }),
    });
  } catch (error) {
    console.error('Failed to sync user to Postgres:', error);
  }
}

export const authService = {
  async loginWithEmail(email: string, password: string): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;

      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.syncUserToFirestore(result.user);

      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const data = userDoc.data() || {};
      if (data.google_id && !data.password_hash) {
        await firebaseSignOut(auth);
        throw Object.assign(new Error('Google account'), { code: 'auth/google-account-only' });
      }
      if (data.email_verified === false) {
        await firebaseSignOut(auth);
        throw Object.assign(new Error('Email not verified'), { code: 'auth/email-not-verified' });
      }

      await syncUserToPostgres(result.user, { email_verified: data.email_verified === true });
      return result.user;
    } catch (error) {
      console.error('Email login failed:', error);
      throw toAuthError(error, 'Нэвтрэхэд алдаа гарлаа.');
    }
  },

  async registerWithEmail(email: string, password: string, name: string, phone?: any): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;

      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await this.syncUserToFirestore(auth.currentUser || result.user, {
        email_verified: false,
        email_verified_at: null,
        password_hash: 'firebase-auth-managed',
        phone: phone || null,
      });

      await syncUserToPostgres(result.user, { email_verified: false, phone: phone || null });

      await fetch('/api/auth/request-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: result.user.uid }),
      });

      return result.user;
    } catch (error) {
      console.error('Email registration failed:', error);
      throw toAuthError(error, 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    }
  },

  async loginWithGoogle(): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;

      const result = await signInWithPopup(auth, googleProvider);
      const google = googleProviderData(result.user);
      await this.syncUserToFirestore(result.user, {
        email_verified: true,
        email_verified_at: serverTimestamp(),
        google_id: google?.uid || result.user.uid,
        google_email: result.user.email,
        google_avatar_url: result.user.photoURL,
      });
      await syncUserToPostgres(result.user, {
        email_verified: true,
        google_id: google?.uid || result.user.uid,
        google_email: result.user.email,
        google_avatar_url: result.user.photoURL,
      });
      return result.user;
    } catch (error) {
      console.error('Google login failed:', error);
      throw toAuthError(error, 'Google-р нэвтрэхэд алдаа гарлаа.');
    }
  },

  async loginWithKakao(): Promise<User | null> {
    try {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
      const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (!jsKey) {
        throw Object.assign(new Error('Kakao not configured'), { code: 'auth/kakao-not-configured' });
      }

      const { loadKakaoSdk, kakaoLogin } = await import('../kakaoClient');
      await loadKakaoSdk(jsKey);
      const accessToken = await kakaoLogin();

      const response = await fetch('/api/auth/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kakao login failed');

      const result = await signInWithCustomToken(auth, data.customToken);
      await updateProfile(result.user, {
        displayName: data.profile?.displayName || result.user.displayName || 'Kakao User',
        photoURL: data.profile?.photoURL || result.user.photoURL || undefined,
      });

      await this.syncUserToFirestore(result.user, {
        email_verified: true,
        email_verified_at: serverTimestamp(),
        kakao_id: data.profile?.kakaoId,
        kakao_email: data.profile?.email,
      });
      await syncUserToPostgres(result.user, {
        email_verified: true,
        kakao_id: data.profile?.kakaoId,
      });

      return result.user;
    } catch (error: any) {
      if (error?.error === 'access_denied' || error?.code === 'auth/kakao-cancelled') {
        throw toAuthError(error, 'KakaoTalk нэвтрэлт цуцлагдлаа.');
      }
      console.error('Kakao login failed:', error);
      throw toAuthError(error, 'KakaoTalk-р нэвтрэхэд алдаа гарлаа.');
    }
  },

  async logout(): Promise<void> {
    await firebaseSignOut(auth);
  },

  async syncUserToFirestore(user: User, extra: Record<string, any> = {}): Promise<void> {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const google = googleProviderData(user);
      const base = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      };

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          ...base,
          email_verified: extra.email_verified ?? Boolean(google),
          email_verified_at: extra.email_verified_at ?? (google ? serverTimestamp() : null),
          email_verify_token: null,
          password_hash: extra.password_hash ?? null,
          google_id: extra.google_id ?? google?.uid ?? null,
          google_email: extra.google_email ?? (google ? user.email : null),
          google_avatar_url: extra.google_avatar_url ?? (google ? user.photoURL : null),
          phone: extra.phone ?? null,
          password_reset_token: null,
          password_reset_expires: null,
          role: 'user',
          createdAt: serverTimestamp(),
          orderCount: 0,
        });
      } else {
        await setDoc(userDocRef, { ...base, ...extra }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to sync user to Firestore:', error);
    }
  },
};
