import { NextRequest, NextResponse } from 'next/server';
import { bulkPatchPostgresProducts } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function POST(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'Сонгосон бараа байхгүй байна.' }, { status: 400 });
    }

    const action = String(body.action || '');
    let patch: Record<string, unknown> = {};

    switch (action) {
      case 'show':
        patch = { isVisible: true };
        break;
      case 'hide':
        patch = { isVisible: false };
        break;
      case 'stock':
        patch = { stock: Math.max(0, Number(body.stock) || 0) };
        break;
      case 'category':
        if (!body.categoryId) {
          return NextResponse.json({ error: 'Ангилал сонгоно уу.' }, { status: 400 });
        }
        patch = { categoryId: String(body.categoryId) };
        break;
      case 'discount':
        patch = { discountPercent: Number(body.discountPercent) || 0 };
        break;
      case 'clearDiscount':
        patch = { clearDiscount: true };
        break;
      default:
        return NextResponse.json({ error: 'Буруу үйлдэл.' }, { status: 400 });
    }

    const updated = await bulkPatchPostgresProducts(ids, patch);
    return NextResponse.json({ updated: updated.length, products: updated });
  } catch (error) {
    console.error('Bulk product update failed:', error);
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 });
  }
}
