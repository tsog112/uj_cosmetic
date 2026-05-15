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
    <div className="flex justify-center border-t border-border-light/35 bg-white px-4 py-5 text-sm text-text-subtle">
      <nav className="inline-flex items-center justify-center gap-2" aria-label="Хуудаслалт">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="btn-secondary h-10 w-10 min-h-10 px-0 text-base disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Өмнөх хуудас"
        >
          &lt;
        </button>
        {pages.map((item, index) => {
          const previous = pages[index - 1];
          const showGap = previous && item - previous > 1;

          return (
            <span key={item} className="flex items-center gap-2">
              {showGap && <span className="text-xs text-text-faint">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-10 min-w-10 rounded-[10px] border px-3 text-xs font-semibold transition-colors ${
                  page === item
                    ? 'border-dusty-rose bg-dusty-rose text-white shadow-brand-sm'
                    : 'border-border-light bg-white text-charcoal hover:bg-blush'
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
          className="btn-secondary h-10 w-10 min-h-10 px-0 text-base disabled:cursor-not-allowed disabled:opacity-35"
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
