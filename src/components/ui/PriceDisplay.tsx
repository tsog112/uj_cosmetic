'use client';

import { useMarketOptional } from '@/context/MarketContext';
import { formatPrice } from '@/types';

type PriceDisplayProps = {
  amountMnt: number;
  className?: string;
};

export default function PriceDisplay({ amountMnt, className }: PriceDisplayProps) {
  const market = useMarketOptional();
  const label = market ? market.formatMoney(amountMnt) : formatPrice(amountMnt);
  return <span className={className}>{label}</span>;
}
