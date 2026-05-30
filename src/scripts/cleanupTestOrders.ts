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

import { getAdminDb } from '../lib/firebaseAdmin';

const TEST_NAMES = ['amintsog ariunjargal'];
const TEST_PHONES = ['99112255', 'd'];
const TEST_ADDRESSES = ['ssssssss', 'd'];

async function main() {
  const db = getAdminDb();
  const snap = await db.collection('orders').get();
  const matches = snap.docs.filter((doc) => {
    const data = doc.data();
    const name = String(data.customerName || '').toLowerCase().trim();
    const phone = String(data.phone || data.customerPhone || '').toLowerCase().trim();
    const address = String(data.address || data.shippingAddress || '').toLowerCase().trim();
    return TEST_NAMES.includes(name) || TEST_PHONES.includes(phone) || TEST_ADDRESSES.includes(address);
  });

  if (!matches.length) {
    console.log('No test orders found.');
    return;
  }

  const dryRun = process.argv.includes('--dry-run');
  console.log(`${matches.length} test orders found.`);
  matches.forEach((doc) => console.log(doc.id, doc.data().orderNumber || ''));

  if (dryRun) {
    console.log('Dry run only. Re-run without --dry-run to delete.');
    return;
  }

  const batch = db.batch();
  matches.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted ${matches.length} test orders.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
