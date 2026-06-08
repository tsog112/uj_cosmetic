import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const productIds = Array.isArray(body?.productIds)
      ? body.productIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : [];

    if (!productIds.length) {
      return NextResponse.json({ slugs: {} });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [{ id: { in: productIds } }, { slug: { in: productIds } }],
      },
      select: { id: true, slug: true },
    });

    const slugs: Record<string, string> = {};
    for (const product of products) {
      if (!product.slug?.trim()) continue;
      const slug = product.slug.trim();
      slugs[product.id] = slug;
      if (productIds.includes(slug)) slugs[slug] = slug;
    }

    return NextResponse.json({ slugs });
  } catch (error: any) {
    console.error('resolve-slugs failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to resolve slugs' }, { status: 500 });
  }
}
