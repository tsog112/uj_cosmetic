'use client';

import { Check, Truck } from 'lucide-react';

const TRACKING_STEPS = [
  { lines: ['Төлбөр', 'хүлээж байна'] },
  { lines: ['Төлбөр', 'баталгаажуулах'] },
  { lines: ['Захиалга', 'бэлдэх'] },
  { lines: ['Хүргэлт', 'хийгдэж байна'] },
  { lines: ['Захиалга', 'хүргэгдсэн'] },
] as const;

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

const TRACK_INSET = 10;

function normalizeStatus(status: string) {
  return String(status || 'pending').toLowerCase();
}

type OrderDeliveryTrackerProps = {
  status: string;
};

export default function OrderDeliveryTracker({ status }: OrderDeliveryTrackerProps) {
  const normalized = normalizeStatus(status);
  const activeIndex = STATUS_ORDER.indexOf(normalized as (typeof STATUS_ORDER)[number]);
  const safeIndex = activeIndex < 0 ? 0 : activeIndex;
  const lineFillPct = (safeIndex / (TRACKING_STEPS.length - 1)) * 100;

  return (
    <div
      className="mt-4 rounded-[18px] border border-[#f3d6e2] bg-[linear-gradient(180deg,#fde8f1_0%,#fffbfc_48%,#ffffff_100%)] px-2 py-3 shadow-[0_4px_16px_rgba(233,30,99,0.06)]"
      role="group"
      aria-label={`Захиалгын явц: ${TRACKING_STEPS[safeIndex].lines.join(' ')}`}
    >
      <div className="relative pt-1">
        <div
          className="pointer-events-none absolute top-[14px] h-[2px] rounded-full bg-[#e6dce1]"
          style={{ left: `${TRACK_INSET}%`, right: `${TRACK_INSET}%` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-[14px] h-[2px] rounded-full bg-[var(--color-brand)] transition-[width] duration-500 ease-out"
          style={{ left: `${TRACK_INSET}%`, width: `${lineFillPct * (100 - TRACK_INSET * 2) / 100}%` }}
          aria-hidden="true"
        />

        <ol className="relative grid grid-cols-5">
          {TRACKING_STEPS.map((step, index) => {
            const completed = index < safeIndex;
            const current = index === safeIndex;

            return (
              <li key={step.lines.join('-')} className="flex min-w-0 flex-col items-center">
                <div className="relative z-[1] flex h-[30px] w-full items-center justify-center">
                  {current ? (
                    <span className="uj-delivery-vehicle flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-[var(--color-brand)] bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(233,30,99,0.18)]">
                      <Truck size={13} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  ) : completed ? (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-brand)]">
                      <Check size={10} strokeWidth={3} className="text-white" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#e5dce1] bg-white">
                      <span className="h-[6px] w-[6px] rounded-full bg-[#cfc3ca]" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <span
                  className="mt-1 flex min-h-[24px] w-full flex-col items-center px-0.5 text-center text-[7.5px] font-semibold leading-[1.1]"
                  style={{
                    color: current ? 'var(--color-brand)' : completed ? '#6d4d5c' : 'var(--color-text-muted)',
                  }}
                >
                  {step.lines.map((line) => (
                    <span key={line} className="block w-full truncate">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
