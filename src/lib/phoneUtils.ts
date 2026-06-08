export interface PhoneData {
  countryCode: string;
  localNumber: string;
}

export const COUNTRIES = [
  { flag: '🇲🇳', name: 'Mongolia', code: '+976', placeholder: '8812-3456', hint: '8 оронтой монгол дугаар' },
  { flag: '🇰🇷', name: 'South Korea', code: '+82', placeholder: '010-1234-5678', hint: '010으로 시작하는 번호를 입력하세요' },
  { flag: '🇺🇸', name: 'USA/Canada', code: '+1', placeholder: '(201) 555-0123', hint: '10-digit US/Canada number' },
  { flag: '🇯🇵', name: 'Japan', code: '+81', placeholder: '090-1234-5678', hint: 'Japan phone number' },
] as const;

export type CountryCode = typeof COUNTRIES[number]['code'];

export function validatePhoneNumber(countryCode: string, localNumber: string): { isValid: boolean; error?: string } {
  const digits = localNumber.replace(/\D/g, '');

  if (countryCode === '+976') {
    if (digits.length !== 8) {
      return { isValid: false, error: 'Монгол дугаар 8 оронтой байх ёстой (ж: 8812-3456, 7011-2233)' };
    }
    // Гар утас (88xx, 99xx …) болон суурин (70xx, 60xx гэх мэт) — 6–9-р эхэлсэн 8 орон
    if (!/^[6-9]\d{7}$/.test(digits)) {
      return { isValid: false, error: 'Монгол дугаар 6–9-р эхэлсэн 8 оронтой байх ёстой' };
    }
    return { isValid: true };
  }

  if (countryCode === '+82') {
    if (digits.length !== 10 && digits.length !== 11) {
      return { isValid: false, error: '올바른 한국 전화번호를 입력해주세요' };
    }
    const prefixes = ['010', '011', '016', '017', '018', '019'];
    const prefix3 = digits.slice(0, 3);
    if (!prefixes.includes(prefix3)) {
      return { isValid: false, error: '올바른 한국 전화번호를 입력해주세요' };
    }
    return { isValid: true };
  }

  if (countryCode === '+1') {
    if (digits.length !== 10) {
      return { isValid: false, error: '올барын US/Canada 전화번호лыг 입력해주세요' };
    }
    return { isValid: true };
  }

  // E.164 standard: min 7, max 15 digits
  if (digits.length < 7 || digits.length > 15) {
    return { isValid: false, error: 'Please enter a valid phone number (7-15 digits)' };
  }

  return { isValid: true };
}

export function formatPhoneNumber(countryCode: string, value: string): string {
  const digits = value.replace(/\D/g, '');

  if (countryCode === '+976') {
    // format Mongolian: XXXX-XXXX
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  }

  if (countryCode === '+82') {
    // format Korean: 010-XXXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  if (countryCode === '+1') {
    // format US/Canada: (XXX) XXX-XXXX
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  if (countryCode === '+81') {
    // format Japanese: XXX-XXXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  return digits;
}
