import { NextRequest, NextResponse } from 'next/server';
import { addAdminExpense } from '@/lib/services/firestoreAdminService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, amount, category, date } = body;
    if (!title || !amount || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const expense = await addAdminExpense({ title, amount: Number(amount), category, date });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}
