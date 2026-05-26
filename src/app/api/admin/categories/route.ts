import { NextRequest, NextResponse } from 'next/server';
import { listAdminCategories, createAdminCategory } from '@/lib/services/firestoreAdminService';

export async function GET() {
  try {
    const categories = await listAdminCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, icon, color, showOnHome } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const category = await createAdminCategory(name, icon, color, showOnHome);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
