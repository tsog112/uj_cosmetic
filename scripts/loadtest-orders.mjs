// Concurrency ачааллын тест: олон захиалгыг зэрэг илгээж, давхцал / oversell
// үүсэхгүйг шалгана.
//
// Ажиллуулах (dev/staging сервер асаалттай байх ёстой):
//   BASE_URL=http://localhost:3000 \
//   PRODUCT_ID=<product cuid> REGION_ID=.. DISTRICT_ID=.. KHOROO_ID=.. \
//   CONCURRENCY=200 node scripts/loadtest-orders.mjs
//
// Анхаар: захиалга нь rate limit-д (orders-create: 10/мин/IP) хамаарна.
// Жинхэнэ ачааллын тестэд rate limit-ийг түр өсгөх эсвэл олон IP-аас явуулна.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PRODUCT_ID = process.env.PRODUCT_ID;
const REGION_ID = process.env.REGION_ID || '';
const DISTRICT_ID = process.env.DISTRICT_ID || '';
const KHOROO_ID = process.env.KHOROO_ID || '';
const CONCURRENCY = Number(process.env.CONCURRENCY || 100);
const QUANTITY = Number(process.env.QUANTITY || 1);

if (!PRODUCT_ID) {
  console.error('PRODUCT_ID шаардлагатай (.env эсвэл орчны хувьсагчаар).');
  process.exit(1);
}

function buildOrder(i) {
  return {
    items: [{ productId: PRODUCT_ID, quantity: QUANTITY, name_mn: 'loadtest', price: 0, imageUrl: '' }],
    customerName: `Loadtest ${i}`,
    phone: '99110000',
    shippingCost: 0,
    paymentMethod: 'bank_transfer',
    addressSnapshot: {
      region_id: REGION_ID,
      district_id: DISTRICT_ID,
      khoroo_id: KHOROO_ID,
      detail: 'Ачааллын тестийн хаяг, байр 1',
    },
  };
}

async function placeOrder(i) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOrder(i)),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, id: data.id, error: data.error, ms: Date.now() - started };
  } catch (error) {
    return { status: 0, ok: false, error: String(error), ms: Date.now() - started };
  }
}

async function main() {
  console.log(`→ ${CONCURRENCY} concurrent захиалга → ${BASE_URL}/api/orders/create`);
  const t0 = Date.now();
  const results = await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => placeOrder(i)));
  const totalMs = Date.now() - t0;

  const ok = results.filter((r) => r.ok);
  const rateLimited = results.filter((r) => r.status === 429);
  const outOfStock = results.filter((r) => !r.ok && /нөөц/.test(r.error || ''));
  const otherErrors = results.filter((r) => !r.ok && r.status !== 429 && !/нөөц/.test(r.error || ''));

  const ids = ok.map((r) => r.id).filter(Boolean);
  const uniqueIds = new Set(ids);
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log('───────────────────────────────');
  console.log(`Нийт:           ${results.length} (${totalMs}ms)`);
  console.log(`Амжилттай:      ${ok.length}`);
  console.log(`429 (rate lmt): ${rateLimited.length}`);
  console.log(`Нөөц дууссан:   ${outOfStock.length}`);
  console.log(`Бусад алдаа:    ${otherErrors.length}`);
  console.log(`Латенц p50/p95: ${p50}ms / ${p95}ms`);
  console.log(`Давхар ID:      ${ids.length - uniqueIds.size} (0 байх ёстой)`);
  if (otherErrors.length) console.log('Жишээ алдаа:', otherErrors.slice(0, 3).map((e) => e.error));

  if (ids.length !== uniqueIds.size) {
    console.error('❌ Давхар захиалгын ID илэрлээ!');
    process.exit(1);
  }
  console.log('✅ Давхцалгүй. Тест дууслаа.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
