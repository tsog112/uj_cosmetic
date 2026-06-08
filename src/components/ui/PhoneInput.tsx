'use client';

import { useMemo } from 'react';
import { COUNTRIES, formatPhoneNumber, validatePhoneNumber, type CountryCode } from '@/lib/phoneUtils';
import type { DeliveryMarket } from '@/lib/currency';

type PhoneInputProps = {
  countryCode: CountryCode;
  localNumber: string;
  onChange: (countryCode: CountryCode, localNumber: string) => void;
  error?: string;
  market?: DeliveryMarket;
};

export default function PhoneInput({
  countryCode,
  localNumber,
  onChange,
  error,
  market = 'MN',
}: PhoneInputProps) {
  const countries = useMemo(() => {
    if (market === 'KR') {
      return COUNTRIES.filter((c) => c.code === '+82' || c.code === '+976');
    }
    return COUNTRIES.filter((c) => c.code === '+976' || c.code === '+82');
  }, [market]);

  const selected = countries.find((c) => c.code === countryCode) || countries[0];

  return (
    <div className="space-y-1.5">
      <div
        className={`luxury-input h-12 overflow-hidden p-0 ${error ? 'border-[#E8A8A8] bg-[#FFFAFA]' : ''}`}
      >
        <select
          value={selected.code}
          onChange={(event) => onChange(event.target.value as CountryCode, localNumber)}
          className="h-full w-[108px] shrink-0 cursor-pointer border-0 border-r border-[var(--color-border)] bg-transparent px-3 text-[13px] font-semibold text-[var(--color-text-primary)] outline-none"
          aria-label="Улсын код"
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={localNumber}
          onChange={(event) => {
            const formatted = formatPhoneNumber(selected.code, event.target.value);
            onChange(selected.code, formatted);
          }}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          placeholder={selected.placeholder}
          inputMode="tel"
          autoComplete="tel-national"
          aria-invalid={Boolean(error)}
        />
      </div>
      {error ? (
        <p className="px-1 text-[11px] font-semibold text-[#A32D2D]">{error}</p>
      ) : selected.hint ? (
        <p className="px-1 text-[11px] text-[var(--color-text-muted)]">{selected.hint}</p>
      ) : null}
    </div>
  );
}

export function validatePhoneField(countryCode: string, localNumber: string) {
  return validatePhoneNumber(countryCode, localNumber);
}
