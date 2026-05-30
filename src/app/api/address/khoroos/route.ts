import { NextRequest, NextResponse } from 'next/server';
import { getAddressKhoroos } from '@/lib/addressData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const districtId = req.nextUrl.searchParams.get('district_id') || '';
  if (!districtId) return NextResponse.json([], { status: 200 });
  const khoroos = await getAddressKhoroos(districtId);
  return NextResponse.json(khoroos.map(({ id, name_mn, type }: any) => ({ id, name_mn, type })));
}
