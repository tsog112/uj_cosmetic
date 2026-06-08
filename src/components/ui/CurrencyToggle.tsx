'use client';

import { useMarket } from '@/context/MarketContext';
import type { DisplayCurrency } from '@/lib/currency';
import SegmentedControl from '@/components/ui/SegmentedControl';

type CurrencyToggleProps = {
  compact?: boolean;
  className?: string;
};

const CURRENCY_OPTIONS = [
  { value: 'MNT' as const, label: 'Төгрөг', shortLabel: '₮ MNT' },
  { value: 'KRW' as const, label: 'Вон', shortLabel: '₩ KRW' },
];

export default function CurrencyToggle({ compact = false, className = '' }: CurrencyToggleProps) {
  const { displayCurrency, setDisplayCurrency } = useMarket();

  if (compact) {
    return (
      <SegmentedControl
        value={displayCurrency}
        options={CURRENCY_OPTIONS}
        onChange={setDisplayCurrency}
        size="sm"
        className={className}
      />
    );
  }

  return (
    <SegmentedControl
      value={displayCurrency}
      options={CURRENCY_OPTIONS.map((o) => ({ ...o, shortLabel: o.label }))}
      onChange={setDisplayCurrency}
      size="md"
      className={className}
    />
  );
}
