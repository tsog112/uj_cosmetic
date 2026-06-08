import { NextResponse } from 'next/server';
import { getAdminSettings } from '@/lib/services/firestoreAdminService';
import { getPostgresAdminSettings } from '@/lib/services/postgresAdminService';

export const runtime = 'nodejs';

/** Нийтийн дэлгүүрийн тохиргоо (нууц талбаргүй). */
export async function GET() {
  try {
    const raw = await getPostgresAdminSettings().catch(() => getAdminSettings());
    const settings = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const {
      deliveryToken: _deliveryToken,
      passwordResetToken: _passwordResetToken,
      ...publicSettings
    } = settings;
    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({});
  }
}
