import { NextResponse } from 'next/server';
import { getAddressRegions } from '@/lib/addressData';

export const runtime = 'nodejs';

export async function GET() {
  const regions = await getAddressRegions();
  return NextResponse.json(regions.map(({ id, name_mn, name_short, type }: any) => ({ id, name_mn, name_short, type })));
}
