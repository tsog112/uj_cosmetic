'use client';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
  shortLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
};

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const height = size === 'sm' ? 'h-9' : 'h-10';
  const text = size === 'sm' ? 'text-[12px]' : 'text-[13px]';

  return (
    <div
      className={`flex w-full ${height} rounded-full bg-[#F3ECEF]/90 p-0.5 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex flex-1 items-center justify-center rounded-full ${text} font-semibold transition-all duration-200 active:scale-[0.98] ${
              active
                ? 'bg-white text-[var(--color-brand)] shadow-[0_1px_4px_rgba(212,83,126,0.12)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="truncate px-1">{option.shortLabel || option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
