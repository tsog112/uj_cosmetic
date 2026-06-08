import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminSettings } from '@/lib/adminFallbacks';
import { getAdminSettings, saveAdminSettings } from '@/lib/services/firestoreAdminService';
import { getPostgresAdminSettings, savePostgresAdminSettings } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function GET() {
  try {
    const settings = await getPostgresAdminSettings().catch(() => getAdminSettings());
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(emptyAdminSettings());
  }
}

export async function POST(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const settings = await savePostgresAdminSettings(body).catch(() => saveAdminSettings(body));
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
