export type DisplayCurrency = 'MNT' | 'KRW';
export type DeliveryMarket = 'MN' | 'KR';

export const DEFAULT_MNT_PER_KRW = 2.75;

export function mntToKrw(amountMnt: number, mntPerKrw = DEFAULT_MNT_PER_KRW): number {
  if (!mntPerKrw || mntPerKrw <= 0) return 0;
  return Math.round((amountMnt || 0) / mntPerKrw);
}

export function krwToMnt(amountKrw: number, mntPerKrw = DEFAULT_MNT_PER_KRW): number {
  return Math.round((amountKrw || 0) * mntPerKrw);
}

export function formatMoney(
  amountMnt: number,
  currency: DisplayCurrency,
  mntPerKrw = DEFAULT_MNT_PER_KRW,
): string {
  if (currency === 'KRW') {
    return `₩${mntToKrw(amountMnt, mntPerKrw).toLocaleString('ko-KR')}`;
  }
  return `${Math.round(amountMnt || 0).toLocaleString('mn-MN')}₮`;
}

export function toE164(countryCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  const code = countryCode.replace(/\D/g, '');
  return `+${code}${digits}`;
}
