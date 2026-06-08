'use client';

import Image from 'next/image';
import { ChevronRight, MapPin } from 'lucide-react';
import { formatMNT } from '@/lib/utils/format';
import { formatOrderAddressLine } from '@/lib/orderAddress';

const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value.startsWith('/') || value.startsWith('http') ? [value] : [];
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Төлбөр хүлээж байна',
  confirmed: 'Төлбөр баталгаажсан',
  processing: 'Захиалга бэлдэж байна',
  shipped: 'Хүргэлт хийгдэж байна',
  delivered: 'Захиалга хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

function resolveItemImageUrl(item: any): string {
  if (item?.imageUrl && !String(item.imageUrl).startsWith('[')) return item.imageUrl;
  const images = parseImages(item?.product?.images);
  return images[0] || PLACEHOLDER_IMAGE;
}

function getItemMeta(order: any) {
  const items = order.items || [];
  const first = items[0];
  const productName = first?.product?.name || first?.name_mn || first?.name || 'Бүтээгдэхүүн';
  const imageUrl = first ? resolveItemImageUrl(first) : PLACEHOLDER_IMAGE;
  const itemCount = items.length;
  const totalQty = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
  const qtyLabel = itemCount > 1 ? `${itemCount} бараа · ${totalQty} ширхэг` : `${totalQty} ширхэг`;

  return { productName, imageUrl, qtyLabel, extraCount: Math.max(0, itemCount - 1) };
}

function getAddressText(order: any) {
  return formatOrderAddressLine(order);
}

type OrderListCardProps = {
  order: any;
  isSelected: boolean;
  onToggleSelect: (id: string, event?: React.MouseEvent) => void;
  onOpenDetail: (order: any) => void;
};

export default function OrderListCard({ order, isSelected, onToggleSelect, onOpenDetail }: OrderListCardProps) {
  const { productName, imageUrl, qtyLabel, extraCount } = getItemMeta(order);
  const addressText = getAddressText(order);
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const customerName = order.customerName || order.user?.name || 'Зочин';

  return (
    <div
      onClick={(event) => onToggleSelect(order.id, event)}
      className={`admin-card-soft admin-card-tap cursor-pointer transition-all ${
        isSelected ? 'admin-list-item-selected' : ''
      }`}
    >
      <div className="flex items-stretch gap-3 p-4">
        <label
          className="flex shrink-0 items-start pt-1"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onClick={(event) => event.stopPropagation()}
            onChange={() => onToggleSelect(order.id)}
            className="h-5 w-5 cursor-pointer accent-[var(--color-brand)]"
            aria-label={`${order.orderNumber} сонгох`}
          />
        </label>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <span className="truncate font-mono text-[12px] font-bold text-[var(--color-text-primary)]">
              {order.orderNumber}
              {order.market === 'KR' && (
                <span className="ml-2 rounded-full bg-[#FFF4CC] px-1.5 py-0.5 text-[8px] font-bold text-[#8A6D00]">KR</span>
              )}
            </span>
            <span className="max-w-[9.5rem] shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[9px] font-bold leading-tight text-[var(--color-text-secondary)]">
              {statusLabel}
            </span>
          </div>

          <div className="mt-3 flex gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-bg)]">
              <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--color-text-primary)]">
                {productName}
                {extraCount > 0 ? ` +${extraCount}` : ''}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-muted)]">{qtyLabel}</p>
            </div>
          </div>

          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span className={`min-w-0 truncate ${order.addressWarning ? 'text-[var(--color-status-cancel-text)]' : ''}`}>
              {addressText}
            </span>
          </div>

          <div className="admin-divider mt-3 flex items-center justify-between pt-3">
            <span className="truncate text-[11px] font-semibold text-[var(--color-text-secondary)]">{customerName}</span>
            <span className="shrink-0 pl-3 text-[15px] font-extrabold tabular-nums text-[var(--color-text-primary)]">
              {formatMNT(order.total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetail(order);
          }}
          className="expand-trigger flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] active:scale-95"
          aria-label="Дэлгэрэнгүй харах"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
