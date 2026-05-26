'use client';

import type { ReactNode } from 'react';

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  minWidth?: string;
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
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
};

export default function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'Мэдээлэл олдсонгүй',
  loading = false,
  skeletonRows = 8,
  minWidth = '720px',
  pagination,
}: AdminDataTableProps<T>) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-mobile-card)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-[#f8dbe8] bg-[#fdf6f9]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)] ${column.headerClassName || ''}`}
                  style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, index) => (
                  <tr key={index} className="border-b border-[#f8dbe8]">
                    <td colSpan={columns.length} className="h-14 animate-shimmer px-3" />
                  </tr>
                ))
              : rows.length
                ? rows.map((row) => (
                    <tr
                      key={rowKey(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`border-b border-[#f8dbe8] text-[12px] text-[var(--color-brand-text)] ${onRowClick ? 'cursor-pointer active:bg-[var(--color-brand-bg)]' : ''}`}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-3 py-3 align-middle ${column.cellClassName || ''}`}
                          style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                        >
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={columns.length} className="px-3 py-12 text-center text-sm font-bold text-[var(--color-brand-muted)]">
                        {emptyMessage}
                      </td>
                    </tr>
                  )}
          </tbody>
        </table>
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#f8dbe8] bg-white px-4 py-3">
          <p className="text-[12px] font-bold text-[var(--color-brand-muted)]">
            Хуудас <span className="text-[var(--color-brand-text)]">{pagination.currentPage}</span> / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="flex h-8 items-center justify-center rounded-full bg-[var(--color-brand-bg)] px-3 text-[11px] font-extrabold text-[var(--color-brand-text)] disabled:opacity-50 hover:bg-[#f8dbe8]"
            >
              Өмнөх
            </button>
            <button
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="flex h-8 items-center justify-center rounded-full bg-[var(--color-brand-bg)] px-3 text-[11px] font-extrabold text-[var(--color-brand-text)] disabled:opacity-50 hover:bg-[#f8dbe8]"
            >
              Дараах
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
