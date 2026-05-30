const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Parse .env.local manually to load variables
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) continue;
    const key = trimmed.slice(0, firstEquals).trim();
    let val = trimmed.slice(firstEquals + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!process.env[key]) {
      process.env[key] = val.replace(/\\n/g, '\n');
    }
  }
}

// LEVEL 1: 22 Regions config
const REGIONS_CONFIG = [
  { id: '1', type: 'city', name_mn: 'Улаанбаатар хот', name_short: 'УБ', sort_order: 1, match_names: ['Улаанбаатар', 'Улаанбаатар хот'] },
  { id: '2', type: 'aimag', name_mn: 'Архангай аймаг', name_short: 'Архангай', sort_order: 2, match_names: ['Архангай'] },
  { id: '3', type: 'aimag', name_mn: 'Баян-Өлгий аймаг', name_short: 'Баян-Өлгий', sort_order: 3, match_names: ['Баян-Өлгий'] },
  { id: '4', type: 'aimag', name_mn: 'Баянхонгор аймаг', name_short: 'Баянхонгор', sort_order: 4, match_names: ['Баянхонгор'] },
  { id: '5', type: 'aimag', name_mn: 'Булган аймаг', name_short: 'Булган', sort_order: 5, match_names: ['Булган'] },
  { id: '6', type: 'aimag', name_mn: 'Говь-Алтай аймаг', name_short: 'Говь-Алтай', sort_order: 6, match_names: ['Говь-Алтай'] },
  { id: '7', type: 'aimag', name_mn: 'Говьсүмбэр аймаг', name_short: 'Говьсүмбэр', sort_order: 7, match_names: ['Говьсүмбэр'] },
  { id: '8', type: 'aimag', name_mn: 'Дархан-Уул аймаг', name_short: 'Дархан', sort_order: 8, match_names: ['Дархан-Уул'] },
  { id: '9', type: 'aimag', name_mn: 'Дорноговь аймаг', name_short: 'Дорноговь', sort_order: 9, match_names: ['Дорноговь'] },
  { id: '10', type: 'aimag', name_mn: 'Дорнод аймаг', name_short: 'Дорнод', sort_order: 10, match_names: ['Дорнод'] },
  { id: '11', type: 'aimag', name_mn: 'Дундговь аймаг', name_short: 'Дундговь', sort_order: 11, match_names: ['Дундговь'] },
  { id: '12', type: 'aimag', name_mn: 'Завхан аймаг', name_short: 'Завхан', sort_order: 12, match_names: ['Завхан'] },
  { id: '13', type: 'aimag', name_mn: 'Орхон аймаг', name_short: 'Эрдэнэт', sort_order: 13, match_names: ['Орхон'] },
  { id: '14', type: 'aimag', name_mn: 'Өвөрхангай аймаг', name_short: 'Өвөрхангай', sort_order: 14, match_names: ['Өвөрхангай'] },
  { id: '15', type: 'aimag', name_mn: 'Өмнөговь аймаг', name_short: 'Өмнөговь', sort_order: 15, match_names: ['Өмнөговь'] },
  { id: '16', type: 'aimag', name_mn: 'Сүхбаатар аймаг', name_short: 'Сүхбаатар', sort_order: 16, match_names: ['Сүхбаатар'] },
  { id: '17', type: 'aimag', name_mn: 'Сэлэнгэ аймаг', name_short: 'Сэлэнгэ', sort_order: 17, match_names: ['Сэлэнгэ'] },
  { id: '18', type: 'aimag', name_mn: 'Төв аймаг', name_short: 'Төв', sort_order: 18, match_names: ['Төв'] },
  { id: '19', type: 'aimag', name_mn: 'Увс аймаг', name_short: 'Увс', sort_order: 19, match_names: ['Увс'] },
  { id: '20', type: 'aimag', name_mn: 'Ховд аймаг', name_short: 'Ховд', sort_order: 20, match_names: ['Ховд'] },
  { id: '21', type: 'aimag', name_mn: 'Хөвсгөл аймаг', name_short: 'Хөвсгөл', sort_order: 21, match_names: ['Хөвсгөл'] },
  { id: '22', type: 'aimag', name_mn: 'Хэнтий аймаг', name_short: 'Хэнтий', sort_order: 22, match_names: ['Хэнтий'] }
];

// LEVEL 2A: UB Districts
const UB_DISTRICTS = [
  { id: '101', region_id: '1', type: 'duureg', name_mn: 'Баянзүрх дүүрэг', name_short: 'БЗД', sort_order: 1, khoroo_count: 8 },
  { id: '102', region_id: '1', type: 'duureg', name_mn: 'Сүхбаатар дүүрэг', name_short: 'СБД', sort_order: 2, khoroo_count: 6 },
  { id: '103', region_id: '1', type: 'duureg', name_mn: 'Хан-Уул дүүрэг', name_short: 'ХУД', sort_order: 3, khoroo_count: 11 },
  { id: '104', region_id: '1', type: 'duureg', name_mn: 'Чингэлтэй дүүрэг', name_short: 'ЧД', sort_order: 4, khoroo_count: 8 },
  { id: '105', region_id: '1', type: 'duureg', name_mn: 'Баянгол дүүрэг', name_short: 'БГД', sort_order: 5, khoroo_count: 8 },
  { id: '106', region_id: '1', type: 'duureg', name_mn: 'Налайх дүүрэг', name_short: 'НД', sort_order: 6, khoroo_count: 9 },
  { id: '107', region_id: '1', type: 'duureg', name_mn: 'Сонгинохайрхан дүүрэг', name_short: 'СХД', sort_order: 7, khoroo_count: 32 },
  { id: '108', region_id: '1', type: 'duureg', name_mn: 'Багануур дүүрэг', name_short: 'БНД', sort_order: 8, khoroo_count: 5 },
  { id: '109', region_id: '1', type: 'duureg', name_mn: 'Багахангай дүүрэг', name_short: 'БХД', sort_order: 9, khoroo_count: 2 }
];

async function run() {
  console.log('📖 Reading mng_admin_boundaries.xlsx...');
  const xlsxPath = path.resolve(__dirname, '..', 'mng_admin_boundaries.xlsx');
  if (!fs.existsSync(xlsxPath)) {
    throw new Error('Mongolia administrative Excel boundaries file not found in root. Run inspect-xlsx.js first.');
  }

  const workbook = XLSX.readFile(xlsxPath);
  
  // 1. Process Regions
  const regions = REGIONS_CONFIG.map(r => ({
    id: r.id,
    type: r.type,
    name_mn: r.name_mn,
    name_short: r.name_short,
    sort_order: r.sort_order
  }));

  // 2. Process Districts / Sums from OCHA mng_admin2
  const districtsSheet = workbook.Sheets['mng_admin2'];
  const adm2Rows = XLSX.utils.sheet_to_json(districtsSheet);
  
  const districts = [...UB_DISTRICTS.map(d => ({
    id: d.id,
    region_id: d.region_id,
    type: d.type,
    name_mn: d.name_mn,
    name_short: d.name_short,
    sort_order: d.sort_order
  }))];

  let sumCounter = 100;
  
  // Map OCHA rows
  const nameToRegion = {};
  REGIONS_CONFIG.forEach(r => {
    r.match_names.forEach(name => {
      nameToRegion[name] = r.id;
    });
  });

  const processedSums = new Set();

  for (const row of adm2Rows) {
    const adm1Name = row.adm1_name1;
    const adm2Name = row.adm2_name1;
    const pcode = row.adm2_pcode;

    // Skip UB
    if (adm1Name === 'Улаанбаатар' || adm1Name === 'Улаанбаатар хот') continue;

    const regionId = nameToRegion[adm1Name];
    if (!regionId) {
      console.warn(`Could not find region ID for aimag: ${adm1Name}`);
      continue;
    }

    if (processedSums.has(pcode)) continue;
    processedSums.add(pcode);

    sumCounter++;
    const nameMn = adm2Name.endsWith(' сум') ? adm2Name : `${adm2Name} сум`;
    
    districts.push({
      id: pcode,
      region_id: regionId,
      type: 'sum',
      name_mn: nameMn,
      name_short: adm2Name,
      sort_order: sumCounter
    });
  }

  console.log(`Loaded ${regions.length} regions and ${districts.length} districts/sums (including 9 UB districts).`);

  // 3. Process Khoroos / Bags
  const khoroos = [];

  // UB Khoroos
  UB_DISTRICTS.forEach(d => {
    for (let k = 1; k <= d.khoroo_count; k++) {
      khoroos.push({
        id: `${d.id}-K${k}`,
        district_id: d.id,
        type: 'khoroo',
        name_mn: `${k}-р хороо`,
        sort_order: k
      });
    }
  });

  // Aimag bags
  districts.forEach(d => {
    if (d.type === 'duureg') return; // Skip UB

    // Darkhan sum bags specifically
    if (d.name_short === 'Дархан' && d.region_id === '8') {
      const darkhanBags = ['Зүүн-Уул баг', 'Хойд баг', 'Өмнөд баг', 'Орхон баг'];
      darkhanBags.forEach((bagName, idx) => {
        khoroos.push({
          id: `${d.id}-B${idx + 1}`,
          district_id: d.id,
          type: 'bag',
          name_mn: bagName,
          sort_order: idx + 1
        });
      });
    } else {
      // 4 dynamic bags for every other sum
      for (let b = 1; b <= 4; b++) {
        khoroos.push({
          id: `${d.id}-B${b}`,
          district_id: d.id,
          type: 'bag',
          name_mn: `${b}-р баг`,
          sort_order: b
        });
      }
    }
  });

  console.log(`Generated ${khoroos.length} khoroos/bags total.`);

  // 4. Write src/lib/constants/addresses.ts
  const addressesTsPath = path.resolve(__dirname, '..', 'src', 'lib', 'constants', 'addresses.ts');
  const codeContent = `export interface Region {
  id: string;
  type: 'aimag' | 'city';
  name_mn: string;
  name_short: string;
  sort_order: number;
}

export interface District {
  id: string;
  region_id: string;
  type: 'duureg' | 'sum';
  name_mn: string;
  name_short: string;
  sort_order: number;
}

export interface Khoroo {
  id: string;
  district_id: string;
  type: 'khoroo' | 'bag';
  name_mn: string;
  sort_order: number;
}

export const REGIONS: Region[] = ${JSON.stringify(regions, null, 2)};

export const DISTRICTS: District[] = ${JSON.stringify(districts, null, 2)};

export const KHOROOS: Khoroo[] = ${JSON.stringify(khoroos, null, 2)};
`;

  fs.writeFileSync(addressesTsPath, codeContent, 'utf8');
  console.log('✅ Generated src/lib/constants/addresses.ts successfully.');

  // 5. Seed local SQLite via Prisma
  console.log('\n🌱 Seeding local SQLite database via Prisma...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('Clearing old address tables...');
    await prisma.mnKhoroo.deleteMany({});
    await prisma.mnDistrict.deleteMany({});
    await prisma.mnRegion.deleteMany({});

    console.log('Inserting regions...');
    for (const r of regions) {
      await prisma.mnRegion.create({
        data: {
          id: r.id,
          type: r.type,
          nameMn: r.name_mn,
          nameShort: r.name_short,
          sortOrder: r.sort_order
        }
      });
    }

    console.log('Inserting districts...');
    for (const d of districts) {
      await prisma.mnDistrict.create({
        data: {
          id: d.id,
          regionId: d.region_id,
          type: d.type,
          nameMn: d.name_mn,
          nameShort: d.name_short,
          sortOrder: d.sort_order
        }
      });
    }

    console.log('Inserting khoroos/bags...');
    // Process in chunks to prevent SQLite variable limits
    const chunkSize = 100;
    for (let i = 0; i < khoroos.length; i += chunkSize) {
      const chunk = khoroos.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(k =>
          prisma.mnKhoroo.create({
            data: {
              id: k.id,
              districtId: k.district_id,
              type: k.type,
              nameMn: k.name_mn,
              sortOrder: k.sort_order
            }
          })
        )
      );
    }

    console.log('✅ SQLite Address Seeding Completed successfully.');
  } catch (err) {
    console.error('Error seeding SQLite:', err);
  } finally {
    await prisma.$disconnect();
  }

  // 6. Seed Firestore
  console.log('\n🔥 Seeding Firestore collections...');
  try {
    const { getAdminDb } = require('../src/lib/firebaseAdmin');
    const db = getAdminDb();

    const collections = [
      { name: 'address_regions', items: regions },
      { name: 'address_districts', items: districts },
      { name: 'address_khoroos', items: khoroos },
      // Also seed the mn_ prefixed ones to keep both in sync
      { name: 'mn_regions', items: regions.map(r => ({ id: r.id, type: r.type, nameMn: r.name_mn, nameShort: r.name_short, sortOrder: r.sort_order })) },
      { name: 'mn_districts', items: districts.map(d => ({ id: d.id, regionId: d.region_id, type: d.type, nameMn: d.name_mn, nameShort: d.name_short, sortOrder: d.sort_order })) },
      { name: 'mn_khoroos', items: khoroos.map(k => ({ id: k.id, districtId: k.district_id, type: k.type, nameMn: k.name_mn, sortOrder: k.sort_order })) }
    ];

    for (const coll of collections) {
      console.log(`Seeding ${coll.items.length} items to Firestore collection "${coll.name}"...`);
      const chunkSize = 400;
      for (let i = 0; i < coll.items.length; i += chunkSize) {
        const chunk = coll.items.slice(i, i + chunkSize);
        const batch = db.batch();
        
        for (const item of chunk) {
          const docRef = db.collection(coll.name).doc(item.id);
          batch.set(docRef, item, { merge: true });
        }
        
        await batch.commit();
        console.log(`   Seeded batch: ${i} to ${Math.min(i + chunkSize, coll.items.length)}`);
      }
    }
    console.log('✅ Firestore Seeding Completed successfully.');
  } catch (err) {
    console.error('Error seeding Firestore:', err);
  }
}

run()
  .then(() => {
    console.log('\n🌟 Seeding process finished successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
  });
