import type { Product, Review } from '@/types';

function toDate(value: any): Date {
  if (value?.toDate) return value.toDate();
  if (value?._seconds) return new Date(value._seconds * 1000);
  return value ? new Date(value) : new Date();
}

export function maskDisplayName(name?: string | null): string {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'UJ хэрэглэгч';
  const [first] = Array.from(trimmed);
  return `${first}***`;
}

export function toPublicProduct(id: string, data: any): Product {
  const stockQuantity = Number(data.stockQuantity ?? data.stock ?? 0);

  return {
    id,
    slug: data.slug ?? id,
    name_mn: data.name_mn ?? data.name ?? '',
    name_en: data.name_en ?? '',
    price: Number(data.price ?? 0),
    salePrice: data.salePrice ?? null,
    saleEndDate: data.saleEndDate ? toDate(data.saleEndDate) : null,
    category: data.category ?? data.categoryId ?? 'other',
    images: Array.isArray(data.images) ? data.images : data.imageUrl ? [data.imageUrl] : [],
    videoUrl: data.videoUrl ?? null,
    description_mn: data.description_mn ?? data.description ?? '',
    ingredients: data.ingredients ?? '',
    howToUse: data.howToUse ?? '',
    featured: data.featured === true,
    published: data.published !== false && data.isVisible !== false,
    inStock: data.inStock !== false && stockQuantity > 0,
    stockQuantity: undefined as unknown as number,
    views: undefined as unknown as number,
    orderCount: undefined as unknown as number,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function toPublicReview(id: string, data: any): Review {
  const createdAt = toDate(data.createdAt);
  const content = data.content ?? data.body ?? '';
  const status = data.status === 'visible' || data.status === 'hidden' || data.status === 'pending'
    ? data.status
    : data.approved === true ? 'visible' : 'pending';

  return {
    id,
    productId: data.productId ?? '',
    productSlug: data.productSlug ?? '',
    productName: data.productName ?? '',
    userId: '',
    userName: maskDisplayName(data.userName),
    userEmail: '',
    rating: Math.max(1, Math.min(5, Number(data.rating ?? 5))),
    content,
    body: content,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    orderId: data.orderId ?? '',
    status,
    featured: Boolean(data.featured),
    editCount: Number(data.editCount || 0),
    approved: status === 'visible',
    createdAt,
    updatedAt: toDate(data.updatedAt ?? createdAt),
  };
}
