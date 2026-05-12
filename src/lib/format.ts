export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function formatMongolianDateTime(value: unknown) {
  const date = toDate(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatMongolianDate(value: unknown) {
  const date = toDate(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
