export type OrderRegionInfo = {
  regionName: string;
  districtName: string;
  isUB: boolean;
  isKR: boolean;
  zonecode?: string;
  roadAddress?: string;
};

export function parseAddressSnapshot(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

function extractKrCity(roadAddress: string): string {
  const trimmed = roadAddress.trim();
  if (!trimmed) return '한국';
  const cityMatch = trimmed.match(
    /^(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|제주특별자치도|경기도|강원특별자치도|충청북도|충청남도|전북특별자치도|전라남도|경상북도|경상남도)/,
  );
  if (cityMatch?.[1]) return cityMatch[1];
  return trimmed.split(/\s+/)[0] || '한국';
}

export function getOrderRegionInfo(order: {
  market?: string | null;
  addressWarning?: string;
  addressSnapshot?: unknown;
  shippingAddress?: string | null;
}): OrderRegionInfo {
  const snap = parseAddressSnapshot(order.addressSnapshot);
  const isKrOrder = order.market === 'KR' || snap?.type === 'kr';

  if (isKrOrder) {
    const zonecode = String(snap?.zonecode || '').trim();
    const roadAddress = String(snap?.roadAddress || order.shippingAddress || '').trim();
    const buildingName = String(snap?.buildingName || '').trim();
    const city = extractKrCity(roadAddress);
    return {
      regionName: city,
      districtName: zonecode ? `우편 ${zonecode}` : buildingName || roadAddress.slice(0, 36) || '한국 배송',
      isUB: false,
      isKR: true,
      zonecode: zonecode || undefined,
      roadAddress: roadAddress || undefined,
    };
  }

  if (order.addressWarning) {
    return { regionName: 'Хаяг тодорхойгүй', districtName: 'Хаяг тодорхойгүй', isUB: false, isKR: false };
  }

  if (snap) {
    const region = String(snap.region || '');
    const district = String(snap.district || '');
    const isUB = region.includes('Улаанбаатар') || region.includes('УБ');
    return {
      regionName: isUB ? 'Улаанбаатар' : region || 'Орон нутаг',
      districtName: district || '—',
      isUB,
      isKR: false,
    };
  }

  const addr = String(order.shippingAddress || '');
  const isUB =
    addr.includes('Улаанбаатар') ||
    addr.includes('УБ') ||
    addr.includes('БЗД') ||
    addr.includes('СБД') ||
    addr.includes('ХУД') ||
    addr.includes('ЧД') ||
    addr.includes('БГД') ||
    addr.includes('СХД');

  let regionName = 'Орон нутаг';
  let districtName = '';

  if (isUB) {
    regionName = 'Улаанбаатар';
    if (addr.includes('Баянзүрх') || addr.includes('БЗД')) districtName = 'Баянзүрх дүүрэг';
    else if (addr.includes('Сүхбаатар') || addr.includes('СБД')) districtName = 'Сүхбаатар дүүрэг';
    else if (addr.includes('Хан-Уул') || addr.includes('ХУД')) districtName = 'Хан-Уул дүүрэг';
    else if (addr.includes('Чингэлтэй') || addr.includes('ЧД')) districtName = 'Чингэлтэй дүүрэг';
    else if (addr.includes('Баянгол') || addr.includes('БГД')) districtName = 'Баянгол дүүрэг';
    else if (addr.includes('Сонгинохайрхан') || addr.includes('СХД')) districtName = 'Сонгинохайрхан дүүрэг';
    else districtName = 'Бусад дүүрэг';
  } else if (addr) {
    const parts = addr.split(',').map((p) => p.trim());
    if (parts[0]) regionName = parts[0].includes('аймаг') ? parts[0] : `${parts[0]} аймаг`;
    if (parts[1]) districtName = parts[1];
  }

  if (!addr || regionName.includes('Бусад') || districtName.includes('Бусад')) {
    return { regionName: 'Хаяг тодорхойгүй', districtName: 'Хаяг тодорхойгүй', isUB: false, isKR: false };
  }

  return { regionName, districtName, isUB, isKR: false };
}

export function formatOrderAddressLine(order: {
  market?: string | null;
  addressSnapshot?: unknown;
  shippingAddress?: string | null;
  addressWarning?: string;
}): string {
  const snap = parseAddressSnapshot(order.addressSnapshot);
  if (order.market === 'KR' || snap?.type === 'kr') {
    const zonecode = String(snap?.zonecode || '');
    const road = String(snap?.roadAddress || order.shippingAddress || '');
    const detail = String(snap?.detail || '');
    const parts = [
      zonecode ? `[${zonecode}]` : '',
      road,
      detail,
    ].filter(Boolean);
    return parts.join(' · ') || order.shippingAddress || 'Хаяг бүртгээгүй';
  }
  if (order.addressWarning) return 'Хаяг тодорхойгүй';
  return order.shippingAddress || 'Хаяг бүртгээгүй';
}
