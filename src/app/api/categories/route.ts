import { NextResponse } from 'next/server';
import { listAdminCategories } from '@/lib/services/firestoreAdminService';
import { listPostgresPublicCategories } from '@/lib/services/postgresAdminService';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const categories = await listPostgresPublicCategories().catch(() => listAdminCategories());
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json([]);
  }
}
