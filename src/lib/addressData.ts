import { DISTRICTS, KHOROOS, REGIONS } from '@/lib/constants/addresses';
import { getAdminDb } from '@/lib/firebaseAdmin';

type AddressKind = 'regions' | 'districts' | 'khoroos';

function sortAddressItems<T extends { sort_order?: number; name_mn?: string }>(items: T[]) {
  return [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.name_mn || '').localeCompare(String(b.name_mn || '')));
}

async function readCollection(kind: AddressKind, filters: Record<string, string> = {}) {
  try {
    let query: FirebaseFirestore.Query = getAdminDb().collection(`address_${kind}`);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query = query.where(key, '==', value);
    });
    const snap = await query.get();
    if (!snap.empty) {
      return sortAddressItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any)));
    }
  } catch (error) {
    console.error(`Address ${kind} DB read failed; using server fallback:`, error);
  }
  return null;
}

export async function getAddressRegions() {
  return (await readCollection('regions')) || sortAddressItems(REGIONS);
}

export async function getAddressDistricts(regionId: string) {
  return (await readCollection('districts', { region_id: regionId })) || sortAddressItems(DISTRICTS.filter((item) => item.region_id === regionId));
}

export async function getAddressKhoroos(districtId: string) {
  return (await readCollection('khoroos', { district_id: districtId })) || sortAddressItems(KHOROOS.filter((item) => item.district_id === districtId));
}

export async function getAddressLabelSnapshot(regionId?: string, districtId?: string, khorooId?: string) {
  const [regions, districts, khoroos] = await Promise.all([
    getAddressRegions(),
    regionId ? getAddressDistricts(regionId) : Promise.resolve([]),
    districtId ? getAddressKhoroos(districtId) : Promise.resolve([]),
  ]);
  const region = regions.find((item: any) => item.id === regionId);
  const district = districts.find((item: any) => item.id === districtId);
  const khoroo = khoroos.find((item: any) => item.id === khorooId);
  return { region, district, khoroo };
}
