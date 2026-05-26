import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminExpense } from '@/lib/services/firestoreAdminService';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteAdminExpense(id);
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
