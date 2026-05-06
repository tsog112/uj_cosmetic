'use client';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({ quantity, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  return (
    <div className="inline-flex items-center border border-border">
      <button
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
        aria-label="Хасах"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 6h8" />
        </svg>
      </button>
      <span className="w-10 h-10 flex items-center justify-center text-sm font-medium text-text-primary border-x border-border">
        {quantity}
      </span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
        aria-label="Нэмэх"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2v8M2 6h8" />
        </svg>
      </button>
    </div>
  );
}
