import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually to load variables in ts-node environments
const envLocalPath = path.resolve(process.cwd(), '.env.local');
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

import { PrismaClient } from '@prisma/client';
import { getAdminDb } from '../lib/firebaseAdmin';
import { REGIONS, DISTRICTS, KHOROOS } from '../lib/constants/addresses';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Firebase Admin DB
const db = getAdminDb();

async function seed() {
  console.log('🌱 Starting Administrative Address Seeding...');
  
  // 1. Seed SQLite via Prisma
  console.log('\n--- Seeding SQLite (Prisma) ---');
  
  console.log('Clearing old address records in SQLite...');
  await prisma.mnKhoroo.deleteMany({});
  await prisma.mnDistrict.deleteMany({});
  await prisma.mnRegion.deleteMany({});
  
  console.log(`Seeding ${REGIONS.length} regions in SQLite...`);
  for (const r of REGIONS) {
    await prisma.mnRegion.create({
      data: {
        id: r.id,
        type: r.type,
        nameMn: r.name_mn,
        nameShort: r.name_short,
        sortOrder: r.sort_order,
      }
    });
  }
  
  console.log(`Seeding ${DISTRICTS.length} districts in SQLite...`);
  for (const d of DISTRICTS) {
    await prisma.mnDistrict.create({
      data: {
        id: d.id,
        regionId: d.region_id,
        type: d.type,
        nameMn: d.name_mn,
        nameShort: d.name_short,
        sortOrder: d.sort_order,
      }
    });
  }
  
  console.log(`Seeding ${KHOROOS.length} khoroos/bags in SQLite...`);
  for (const k of KHOROOS) {
    await prisma.mnKhoroo.create({
      data: {
        id: k.id,
        districtId: k.district_id,
        type: k.type,
        nameMn: k.name_mn,
        sortOrder: k.sort_order,
      }
    });
  }
  console.log('✅ SQLite Address Seeding Completed.');

  // 2. Seed Firestore using Admin SDK
  console.log('\n--- Seeding Firestore (Admin SDK) ---');
  
  const allOps = [
    ...REGIONS.map(r => ({ type: 'regions', id: r.id, data: r })),
    ...DISTRICTS.map(d => ({ type: 'districts', id: d.id, data: d })),
    ...KHOROOS.map(k => ({ type: 'khoroos', id: k.id, data: k }))
  ];

  console.log(`Seeding ${allOps.length} documents into Firestore in admin batches...`);
  const chunkSize = 400;
  for (let i = 0; i < allOps.length; i += chunkSize) {
    const chunk = allOps.slice(i, i + chunkSize);
    const batch = db.batch();
    
    for (const op of chunk) {
      let collectionName = '';
      if (op.type === 'regions') collectionName = 'mn_regions';
      else if (op.type === 'districts') collectionName = 'mn_districts';
      else if (op.type === 'khoroos') collectionName = 'mn_khoroos';
      
      const docRef = db.collection(collectionName).doc(op.id);
      batch.set(docRef, op.data, { merge: true });
    }
    
    await batch.commit();
    console.log(`   Seeded batch: ${i} to ${Math.min(i + chunkSize, allOps.length)}`);
  }
  
  console.log('✅ Firestore Address Seeding Completed.');
}

seed()
  .catch((err) => {
    console.error('❌ Address Seeding Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 1000);
  });
