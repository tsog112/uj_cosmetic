'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

/**
 * Accordion — One item open at a time. Max-height CSS transition.
 * Plus icon rotates to X (45deg) when open — CSS transform only.
 * No JS height calculations.
 */
export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div
      style={{ borderTop: 'var(--border-thin)' }}
      role="list"
    >
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            style={{ borderBottom: 'var(--border-thin)' }}
            role="listitem"
          >
            <button
              type="button"
              className="w-full flex items-center justify-between text-left py-5 px-0 gap-4"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                minHeight: 'auto',
                padding: 'var(--space-5) 0',
              }}
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              aria-controls={`accordion-body-${idx}`}
              id={`accordion-header-${idx}`}
            >
              <span
                style={{
                  fontSize: 'var(--text-md)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text-primary)',
                  flex: 1,
                }}
              >
                {item.question}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  color: 'var(--color-brand)',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
                aria-hidden="true"
              >
                <Plus size={18} strokeWidth={1.8} />
              </span>
            </button>
            <div
              id={`accordion-body-${idx}`}
              role="region"
              aria-labelledby={`accordion-header-${idx}`}
              style={{
                maxHeight: isOpen ? '400px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-md)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  paddingBottom: 'var(--space-5)',
                  margin: 0,
                }}
              >
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
