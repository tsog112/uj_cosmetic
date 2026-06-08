import fs from 'fs';
import path from 'path';
import { getAdminDb } from '../lib/firebaseAdmin';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

function toDate(value: any) {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `item-${Date.now()}`;
}

function images(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function legacyEmail(id: string) {
  return `${id.replace(/[^a-zA-Z0-9._-]/g, '_')}@legacy.local`;
}

const TEST_NAMES = new Set(['amintsog ariunjargal']);
const TEST_PHONES = new Set(['99112255', 'd']);
const TEST_ADDRESSES = new Set(['ssssssss', 'd']);

function isTestOrder(data: FirebaseFirestore.DocumentData) {
  const name = String(data.customerName || '').toLowerCase().trim();
  const phone = String(data.phone || data.customerPhone || '').toLowerCase().trim();
  const address = String(data.address || data.shippingAddress || '').toLowerCase().trim();
  return TEST_NAMES.has(name) || TEST_PHONES.has(phone) || TEST_ADDRESSES.has(address);
}

async function uniqueSlug(base: string, id: string, table: 'category' | 'product') {
  const candidate = base || slugify(id);
  const existing = table === 'category'
    ? await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } })
    : await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
  return existing && existing.id !== id ? `${candidate}-${id.slice(0, 6)}` : candidate;
}

async function migrateCategories(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('categories').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    await prisma.category.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        slug: await uniqueSlug(data.slug || doc.id || slugify(data.name_mn || data.name || doc.id), doc.id, 'category'),
        name: data.name || data.name_mn || doc.id,
        nameMn: data.name_mn || data.name || doc.id,
        image: data.image || null,
        icon: data.icon || 'Tags',
        color: data.color || '#E91E8C',
        showOnHome: data.showOnHome === true,
      },
      update: {
        slug: await uniqueSlug(data.slug || doc.id || slugify(data.name_mn || data.name || doc.id), doc.id, 'category'),
        name: data.name || data.name_mn || doc.id,
        nameMn: data.name_mn || data.name || doc.id,
        image: data.image || null,
        icon: data.icon || 'Tags',
        color: data.color || '#E91E8C',
        showOnHome: data.showOnHome === true,
      },
    });
  }
  console.log(`Migrated categories: ${snap.size}`);
}

async function migrateProducts(db: FirebaseFirestore.Firestore) {
  const fallbackCategory = await prisma.category.upsert({
    where: { slug: 'other' },
    create: { slug: 'other', name: 'Other', nameMn: 'Бусад' },
    update: {},
  });
  const snap = await db.collection('products').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const categoryId = data.category || data.categoryId || fallbackCategory.id;
    const category = await prisma.category.findUnique({ where: { id: categoryId } }) || fallbackCategory;
    const stock = Number(data.stockQuantity ?? data.stock ?? 0);
    await prisma.product.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        slug: await uniqueSlug(data.slug || slugify(data.name_mn || data.name || doc.id), doc.id, 'product'),
        name: data.name || data.name_mn || doc.id,
        nameMn: data.name_mn || data.name || doc.id,
        nameEn: data.name_en || '',
        brand: data.brand || null,
        description: data.description || data.description_mn || '',
        descriptionMn: data.description_mn || data.description || '',
        ingredients: data.ingredients || '',
        howToUse: data.howToUse || '',
        price: Number(data.price || 0),
        salePrice: data.salePrice == null ? null : Number(data.salePrice),
        stock,
        stockQuantity: stock,
        isVisible: data.isVisible !== false,
        published: data.published !== false,
        featured: data.featured === true,
        showOnHome: data.showOnHome === true,
        images: jsonValue(images(data.images || data.imageUrl)),
        videoUrl: data.videoUrl || null,
        categoryId: category.id,
        views: Number(data.views || 0),
        orderCount: Number(data.orderCount || 0),
      },
      update: {
        name: data.name || data.name_mn || doc.id,
        nameMn: data.name_mn || data.name || doc.id,
        price: Number(data.price || 0),
        salePrice: data.salePrice == null ? null : Number(data.salePrice),
        stock,
        stockQuantity: stock,
        isVisible: data.isVisible !== false,
        published: data.published !== false,
        featured: data.featured === true,
        images: jsonValue(images(data.images || data.imageUrl)),
        categoryId: category.id,
      },
    });
  }
  console.log(`Migrated products: ${snap.size}`);
}

async function migrateUsers(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const rawEmail = typeof data.email === 'string' && data.email.includes('@') ? data.email.trim().toLowerCase() : legacyEmail(doc.id);
    const emailOwner = await prisma.user.findUnique({ where: { email: rawEmail }, select: { id: true } });
    const email = emailOwner && emailOwner.id !== doc.id ? legacyEmail(doc.id) : rawEmail;
    await prisma.user.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        email,
        name: data.name || data.displayName || '',
        displayName: data.displayName || data.name || '',
        phone: data.phone || null,
        role: data.role === 'admin' ? 'admin' : 'customer',
        emailVerified: data.email_verified === true || data.emailVerified === true || Boolean(data.google_id),
        googleId: data.google_id || data.googleId || null,
        googleEmail: data.google_email || data.googleEmail || null,
        googleAvatarUrl: data.google_avatar_url || data.googleAvatarUrl || null,
      },
      update: {
        email,
        name: data.name || data.displayName || '',
        displayName: data.displayName || data.name || '',
        phone: data.phone || null,
        role: data.role === 'admin' ? 'admin' : 'customer',
        emailVerified: data.email_verified === true || data.emailVerified === true || Boolean(data.google_id),
      },
    });
  }
  console.log(`Migrated users: ${snap.size}`);
}

async function migrateOrders(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('orders').get();
  let migrated = 0;
  let skippedTest = 0;
  const docs = [...snap.docs].sort((a, b) => toDate(a.data().createdAt).getTime() - toDate(b.data().createdAt).getTime());
  const orderSequences = new Map<number, number>();

  for (const doc of docs) {
    const data = doc.data();
    if (isTestOrder(data)) {
      await prisma.order.deleteMany({ where: { id: doc.id } });
      skippedTest += 1;
      continue;
    }

    const addressSnapshot = data.addressSnapshot || data.address_snapshot || null;
    const rawUserId = data.userId || null;
    const userExists = rawUserId ? await prisma.user.findUnique({ where: { id: rawUserId }, select: { id: true } }) : null;
    const createdAt = toDate(data.createdAt);
    const year = createdAt.getFullYear();
    const sequence = (orderSequences.get(year) || 0) + 1;
    orderSequences.set(year, sequence);
    const orderNumber = data.orderNumber && /^#\d{4}-\d{4}$/.test(String(data.orderNumber))
      ? String(data.orderNumber)
      : `#${year}-${String(sequence).padStart(4, '0')}`;

    await prisma.order.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        orderNumber,
        userId: userExists?.id || null,
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || data.email || '',
        customerPhone: data.customerPhone || data.phone || '',
        phone: data.phone || data.customerPhone || '',
        status: String(data.status || 'pending').toLowerCase(),
        subtotal: Number(data.subtotal || data.total || 0),
        shippingCost: Number(data.shippingCost || 0),
        discount: Number(data.discount || 0),
        total: Number(data.total || 0),
        promoCode: data.promoCode || null,
        shippingAddress: data.address || data.shippingAddress || addressSnapshot?.full_address || addressSnapshot?.full || '',
        addressSnapshot: addressSnapshot ? jsonValue(addressSnapshot) : Prisma.JsonNull,
        archived: data.archived === true,
        archivedAt: data.archivedAt ? toDate(data.archivedAt) : null,
        createdAt,
        updatedAt: toDate(data.updatedAt),
      },
      update: {
        orderNumber,
        status: String(data.status || 'pending').toLowerCase(),
        total: Number(data.total || 0),
        archived: data.archived === true,
        archivedAt: data.archivedAt ? toDate(data.archivedAt) : null,
      },
    });

    for (const [index, item] of (Array.isArray(data.items) ? data.items : []).entries()) {
      const product = await prisma.product.findUnique({ where: { id: item.productId || '' } });
      if (!product) continue;
      await prisma.orderItem.upsert({
        where: { id: `${doc.id}-${item.productId || index}` },
        create: {
          id: `${doc.id}-${item.productId || index}`,
          orderId: doc.id,
          productId: product.id,
          name: item.name_mn || item.name || product.name,
          imageUrl: item.imageUrl || '',
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
        },
        update: {
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
        },
      });
    }
    migrated += 1;
  }
  console.log(`Migrated orders: ${migrated} (skipped test: ${skippedTest})`);
}

async function migrateReviews(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('reviews').get();
  let migrated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const productId = String(data.productId || '').trim();
    if (!productId) {
      skipped += 1;
      continue;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      skipped += 1;
      continue;
    }

    const rawUserId = String(data.userId || '').trim() || `legacy-review-user-${doc.id}`;
    const user = await prisma.user.upsert({
      where: { id: rawUserId },
      create: {
        id: rawUserId,
        email: data.userEmail && String(data.userEmail).includes('@') ? String(data.userEmail).toLowerCase() : legacyEmail(rawUserId),
        name: data.userName || 'UJ хэрэглэгч',
        displayName: data.userName || 'UJ хэрэглэгч',
        emailVerified: true,
      },
      update: {
        name: data.userName || undefined,
        displayName: data.userName || undefined,
        emailVerified: true,
      },
    });

    const orderId = String(data.orderId || '').trim() || `legacy-review-order-${doc.id}`;
    const existingOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          id: orderId,
          orderNumber: `#LEGACY-${doc.id.slice(0, 8).toUpperCase()}`,
          userId: user.id,
          customerName: user.displayName || user.name || 'UJ хэрэглэгч',
          customerEmail: user.email,
          status: 'delivered',
          subtotal: Number(product.salePrice || product.price || 0),
          total: Number(product.salePrice || product.price || 0),
          shippingAddress: 'Legacy verified review',
          createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
          items: {
            create: [{
              productId: product.id,
              name: product.nameMn || product.name,
              imageUrl: images(product.images)[0] || '',
              quantity: 1,
              price: Number(product.salePrice || product.price || 0),
            }],
          },
        },
      });
    }

    const reviewId = `${user.id}_${product.id}_${orderId}`;
    const content = String(data.content || data.body || data.review || '').trim();
    if (content.length < 3) {
      skipped += 1;
      continue;
    }

    await prisma.review.upsert({
      where: { id: reviewId },
      create: {
        id: reviewId,
        productId: product.id,
        productSlug: product.slug,
        productName: product.nameMn || product.name,
        userId: user.id,
        userName: data.userName || user.displayName || user.name || 'UJ хэрэглэгч',
        userEmail: user.email,
        rating: Math.max(1, Math.min(5, Number(data.rating || 5))),
        content,
        body: content,
        imageUrls: jsonValue(Array.isArray(data.imageUrls) ? data.imageUrls : []),
        orderId,
        status: data.status === 'hidden' ? 'hidden' : 'visible',
        approved: data.approved !== false,
        featured: data.featured !== false,
        verifiedPurchase: true,
        createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
      },
      update: {
        rating: Math.max(1, Math.min(5, Number(data.rating || 5))),
        content,
        body: content,
        status: data.status === 'hidden' ? 'hidden' : 'visible',
        approved: data.approved !== false,
        featured: data.featured !== false,
      },
    });
    migrated += 1;
  }

  console.log(`Migrated reviews: ${migrated} (skipped: ${skipped})`);
}

async function migrateSettings(db: FirebaseFirestore.Firestore) {
  const doc = await db.collection('settings').doc('main').get();
  if (!doc.exists) return;
  await prisma.setting.upsert({
    where: { key: 'store_settings' },
    create: { id: 'MAIN', key: 'store_settings', value: jsonValue(doc.data() || {}) },
    update: { value: jsonValue(doc.data() || {}) },
  });
  console.log('Migrated settings');
}

async function main() {
  const db = getAdminDb();
  await migrateCategories(db);
  await migrateProducts(db);
  await migrateUsers(db);
  await migrateOrders(db);
  await migrateReviews(db);
  await migrateSettings(db);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
