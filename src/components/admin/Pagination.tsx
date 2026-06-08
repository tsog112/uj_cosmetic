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
    .filter((item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1);

  return (
    <div className="flex justify-center py-4 text-sm text-[var(--color-brand-muted)]">
      <nav className="inline-flex items-center justify-center gap-1.5" aria-label="Хуудаслалт">
        <button 
          type="button" 
          onClick={() => onPageChange(Math.max(1, page - 1))} 
          disabled={page <= 1} 
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[13px] font-bold text-[var(--color-brand-text)] shadow-sm transition-all hover:bg-[var(--color-brand-secondary)] disabled:cursor-not-allowed disabled:opacity-35 active:scale-95" 
          aria-label="Өмнөх хуудас"
        >
          &lt;
        </button>
        {pages.map((item, index) => {
          const previous = pages[index - 1];
          const showGap = previous && item - previous > 1;
          return (
            <span key={item} className="flex items-center gap-1.5">
              {showGap && <span className="text-xs font-bold text-[var(--color-brand-muted)] px-1">...</span>}
              <button 
                type="button" 
                onClick={() => onPageChange(item)} 
                className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-[13px] font-bold transition-all shadow-sm active:scale-95 ${
                  page === item 
                    ? 'bg-gradient-to-r from-[var(--color-brand-accent)] to-[#d81b60] text-white shadow-[0_3px_10px_rgba(233,30,140,0.2)]' 
                    : 'border border-[var(--color-border)] bg-white text-[var(--color-brand-text)] hover:bg-[var(--color-brand-secondary)]'
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
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[13px] font-bold text-[var(--color-brand-text)] shadow-sm transition-all hover:bg-[var(--color-brand-secondary)] disabled:cursor-not-allowed disabled:opacity-35 active:scale-95" 
          aria-label="Дараах хуудас"
        >
          &gt;
        </button>
      </nav>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize = 10) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
