'use client';

import type { ReactNode } from 'react';

export type AdminTableColumn<T> = {
  key: string;
  header: ReactNode;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
};

type AdminDataTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  skeletonRows?: number;
  minWidth?: string;
  /** When true, table fits container width (no horizontal scroll). */
  fitContainer?: boolean;
  compact?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
};

function alignClass(align: AdminTableColumn<unknown>['align']) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

export default function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'Мэдээлэл олдсонгүй',
  loading = false,
  skeletonRows = 8,
  minWidth,
  fitContainer = false,
  compact = false,
  pagination,
}: AdminDataTableProps<T>) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-4 py-3';
  const headerPad = compact ? 'px-3 py-2.5' : 'px-4 py-3';
  const tableMinWidth = minWidth && !fitContainer ? minWidth : undefined;

  return (
    <section className="admin-table-shell">
      <div className={fitContainer ? 'overflow-hidden' : 'overflow-x-auto'}>
        <table className="w-full table-fixed border-collapse text-left" style={tableMinWidth ? { minWidth: tableMinWidth } : undefined}>
          <colgroup>
            {columns.map((column) => (
              <col
                key={column.key}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${headerPad} text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-text-muted)] ${alignClass(column.align)} ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={columns.length} className={`${cellPad} h-12 animate-shimmer`} />
                  </tr>
                ))
              : rows.length
                ? rows.map((row) => (
                    <tr
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`text-[12px] text-[var(--color-text-primary)] ${onRowClick ? 'cursor-pointer active:bg-[var(--color-bg)]' : ''}`}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`${cellPad} align-middle ${alignClass(column.align)} ${column.cellClassName || ''}`}
                        >
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-12 text-center text-sm font-bold text-[var(--color-text-muted)]">
                        {emptyMessage}
                      </td>
                    </tr>
                  )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-[12px] font-bold text-[var(--color-text-muted)]">
            Хуудас <span className="text-[var(--color-text-primary)]">{pagination.currentPage}</span> / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="flex h-8 items-center justify-center rounded-full bg-[var(--color-bg)] px-3 text-[11px] font-extrabold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-light)] disabled:opacity-50"
            >
              Өмнөх
            </button>
            <button
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="flex h-8 items-center justify-center rounded-full bg-[var(--color-bg)] px-3 text-[11px] font-extrabold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-light)] disabled:opacity-50"
            >
              Дараах
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
