import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminSettings } from '@/lib/adminFallbacks';
import { getAdminSettings, saveAdminSettings } from '@/lib/services/firestoreAdminService';

export async function GET() {
  try {
    const settings = await getAdminSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(emptyAdminSettings());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await saveAdminSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
