'use client';

import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { useAdminProductDetail } from '@/lib/hooks/useAdmin';

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: product, isLoading } = useAdminProductDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-24 rounded-[24px] animate-shimmer" />
        <div className="h-36 rounded-[24px] animate-shimmer" />
        <div className="h-72 rounded-[24px] animate-shimmer" />
      </div>
    );
  }

  if (!product) {
    return <div className="p-8 text-center text-sm font-bold text-[var(--color-brand-muted)]">Бүтээгдэхүүн олдсонгүй</div>;
  }

  const images = Array.isArray(product.images)
    ? product.images
    : typeof product.images === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(product.images);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  return (
    <ProductForm
      initialData={{
        ...product,
        price: product.price?.toString() || '',
        salePrice: product.salePrice?.toString() || '',
        stock: product.stock?.toString() || '',
        images,
      }}
    />
  );
}
