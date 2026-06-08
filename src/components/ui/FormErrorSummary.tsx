'use client';

import { AlertCircle } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  customerName: 'Нэр',
  email: 'И-мэйл',
  phone: 'Утас',
  address: 'Хаяг',
  note: 'Тэмдэглэл',
  paymentMethod: 'Төлбөр',
};

type FormErrorSummaryProps = {
  errors: Record<string, string>;
  id?: string;
};

export default function FormErrorSummary({ errors, id = 'checkout-errors' }: FormErrorSummaryProps) {
  const entries = Object.entries(errors).filter(([, message]) => Boolean(message));
  if (!entries.length) return null;

  return (
    <div
      id={id}
      role="alert"
      className="flex gap-3 rounded-[20px] border border-[#F0D4D4] bg-gradient-to-br from-[#FFF8F8] to-[#FCEBEB] px-4 py-3.5"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#C44B4B]" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[#8F2E2E]">
          {entries.length === 1 ? 'Дараахыг засна уу' : `${entries.length} зүйл засах шаардлагатай`}
        </p>
        <ul className="mt-1.5 space-y-1">
          {entries.map(([field, message]) => (
            <li key={field} className="flex gap-2 text-[12px] leading-5 text-[#A32D2D]">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#D4537E]" />
              <span>
                <span className="font-semibold">{FIELD_LABELS[field] || field}</span>
                <span className="text-[#B54545]"> — {message}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
