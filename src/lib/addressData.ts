import { DISTRICTS, KHOROOS, REGIONS } from '@/lib/constants/addresses';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { isFirestoreCircuitOpen, recordFirestoreError } from '@/lib/firestoreCircuitBreaker';

type AddressKind = 'regions' | 'districts' | 'khoroos';

function sortAddressItems<T extends { sort_order?: number; name_mn?: string }>(items: T[]) {
  return [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.name_mn || '').localeCompare(String(b.name_mn || '')));
}

function withTimeout<T>(promise: Promise<T>, label: string, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function getPostgresRegions() {
  const list = await prisma.mnRegion.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  if (list.length === 0) return null;
  return list.map((r) => ({
    id: r.id,
    type: r.type as 'aimag' | 'city',
    name_mn: r.nameMn,
    name_short: r.nameShort,
    sort_order: r.sortOrder,
  }));
}

async function getPostgresDistricts(regionId: string) {
  const list = await prisma.mnDistrict.findMany({
    where: { regionId },
    orderBy: { sortOrder: 'asc' },
  });
  if (list.length === 0) return null;
  return list.map((d) => ({
    id: d.id,
    region_id: d.regionId,
    type: d.type as 'duureg' | 'sum',
    name_mn: d.nameMn,
    name_short: d.nameShort,
    sort_order: d.sortOrder,
  }));
}

async function getPostgresKhoroos(districtId: string) {
  const list = await prisma.mnKhoroo.findMany({
    where: { districtId },
    orderBy: { sortOrder: 'asc' },
  });
  if (list.length === 0) return null;
  return list.map((k) => ({
    id: k.id,
    district_id: k.districtId,
    type: k.type as 'khoroo' | 'bag',
    name_mn: k.nameMn,
    sort_order: k.sortOrder,
  }));
}

async function readCollection(kind: AddressKind, filters: Record<string, string> = {}) {
  if (isFirestoreCircuitOpen()) {
    return null;
  }
  try {
    let query: FirebaseFirestore.Query = getAdminDb().collection(`address_${kind}`);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query = query.where(key, '==', value);
    });
    const snap = await withTimeout(query.get(), `address read ${kind}`, 1500);
    if (!snap.empty) {
      return sortAddressItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any)));
    }
  } catch (error) {
    recordFirestoreError(error);
    console.error(`Address ${kind} DB read failed; using server fallback:`, error);
  }
  return null;
}

export async function getAddressRegions() {
  const pgRegions = await getPostgresRegions().catch(() => null);
  if (pgRegions && pgRegions.length > 0) {
    return pgRegions;
  }
  return (await readCollection('regions')) || sortAddressItems(REGIONS);
}

export async function getAddressDistricts(regionId: string) {
  const pgDistricts = await getPostgresDistricts(regionId).catch(() => null);
  if (pgDistricts && pgDistricts.length > 0) {
    return pgDistricts;
  }
  return (await readCollection('districts', { region_id: regionId })) || sortAddressItems(DISTRICTS.filter((item) => item.region_id === regionId));
}

export async function getAddressKhoroos(districtId: string) {
  const pgKhoroos = await getPostgresKhoroos(districtId).catch(() => null);
  if (pgKhoroos && pgKhoroos.length > 0) {
    return pgKhoroos;
  }
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

