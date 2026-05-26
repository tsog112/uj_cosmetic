import { NextRequest, NextResponse } from 'next/server';
import { setAdminProductVisibility } from '@/lib/services/firestoreAdminService';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isVisible } = await req.json();
    await setAdminProductVisibility(id, !!isVisible);
    return NextResponse.json({ id, isVisible: !!isVisible });
  } catch (error) {
    console.error('Error updating product visibility:', error);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
