import { prisma } from '@/lib/prisma';
import type { AuthSession } from '@/lib/auth/serverAuth';

type SyncExtra = {
  displayName?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  googleId?: string | null;
  googleEmail?: string | null;
  googleAvatarUrl?: string | null;
};

/**
 * Firebase-аар нэвтэрсэн хэрэглэгчийг Postgres User хүснэгтэд upsert хийнэ.
 * id нь Firebase uid-тэй ижил тул админ жагсаалт, эрх, захиалга бүгд таарна.
 *
 * Чухал: энд role-ийг ХЭЗЭЭ Ч дарж бичихгүй (зөвхөн анх үүсгэхэд default).
 * Эрхийн өөрчлөлт нь зөвхөн /api/admin/users-аар л явагдана.
 */
export async function upsertPostgresUserFromAuth(session: AuthSession, extra: SyncExtra = {}) {
  const email = (session.email || extra.googleEmail || '').trim();

  const baseData = {
    email: email || `${session.uid}@no-email.local`,
    displayName: extra.displayName ?? undefined,
    name: extra.displayName ?? undefined,
    phone: extra.phone ?? undefined,
    emailVerified: extra.emailVerified ?? undefined,
    emailVerifiedAt: extra.emailVerified ? new Date() : undefined,
    googleId: extra.googleId ?? undefined,
    googleEmail: extra.googleEmail ?? undefined,
    googleAvatarUrl: extra.googleAvatarUrl ?? undefined,
  };

  try {
    return await prisma.user.upsert({
      where: { id: session.uid },
      create: {
        id: session.uid,
        role: session.role === 'admin' ? 'admin' : 'customer',
        ...baseData,
      },
      update: {
        // role-ийг энд оруулахгүй — эрхийг хадгална
        displayName: baseData.displayName,
        name: baseData.name,
        phone: baseData.phone,
        emailVerified: baseData.emailVerified,
        emailVerifiedAt: baseData.emailVerifiedAt,
        googleId: baseData.googleId,
        googleEmail: baseData.googleEmail,
        googleAvatarUrl: baseData.googleAvatarUrl,
      },
    });
  } catch (error) {
    // email unique давхцал гэх мэт тохиолдолд id-аар л шинэчлэхийг оролдоно
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
    if (code === 'P2002') {
      return prisma.user
        .update({ where: { id: session.uid }, data: { ...baseData, email: undefined } })
        .catch(() => null);
    }
    console.error('upsertPostgresUserFromAuth failed:', error);
    return null;
  }
}
