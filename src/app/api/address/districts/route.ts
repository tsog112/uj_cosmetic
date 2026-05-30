import { NextRequest, NextResponse } from 'next/server';
import { getAddressDistricts } from '@/lib/addressData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const regionId = req.nextUrl.searchParams.get('region_id') || '';
  if (!regionId) return NextResponse.json([], { status: 200 });
  const districts = await getAddressDistricts(regionId);
  return NextResponse.json(districts.map(({ id, name_mn, name_short, type }: any) => ({ id, name_mn, name_short, type })));
}
