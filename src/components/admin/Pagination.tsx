'use client';

type PaginationProps = {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalItems, pageSize = 10, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter(item => item === 1 || item === pageCount || Math.abs(item - page) <= 1);

  return (
    <div className="flex justify-end border-t border-[#F2A8C8]/35 bg-white px-4 py-4 text-sm text-[#8B6B78]">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="min-h-10 rounded-[10px] border border-[#F2C7D8] px-4 text-xs font-semibold text-[#241820] transition-colors hover:bg-[#FFF0F6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Өмнөх
        </button>
        {pages.map((item, index) => {
          const previous = pages[index - 1];
          const showGap = previous && item - previous > 1;

          return (
            <span key={item} className="flex items-center gap-2">
              {showGap && <span className="text-xs text-[#B79AA6]">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-10 min-w-10 rounded-[10px] border px-3 text-xs font-semibold transition-colors ${
                  page === item
                    ? 'border-[#D994B5] bg-[#D994B5] text-white shadow-[0_10px_22px_rgba(217,148,181,0.22)]'
                    : 'border-[#F2C7D8] bg-white text-[#241820] hover:bg-[#FFF0F6]'
                }`}
                aria-current={page === item ? 'page' : undefined}
              >
                {item}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="min-h-10 rounded-[10px] border border-[#F2C7D8] px-4 text-xs font-semibold text-[#241820] transition-colors hover:bg-[#FFF0F6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Дараах
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize = 10) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
