/**
 * One-time Firestore seed script for UJ Cosmetic.
 * 
 * Uses the client Firebase SDK (same config as the app) so no service account needed.
 * 
 * Run: npx ts-node --project tsconfig.seed.json src/scripts/seedFirestore.ts
 * Or:  npm run seed
 * 
 * Idempotent — uses setDoc with fixed doc IDs (slug-based for products, 'main' for settings).
 * Running twice will overwrite, not duplicate.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ─── Firebase Config (mirrors src/lib/firebase.ts) ───────────────
const firebaseConfig = {
  apiKey: 'AIzaSyB7Q2RfetAU7i0P6lCnTCUPnzal1Qd_5dM',
  authDomain: 'uj-cosmetic.firebaseapp.com',
  projectId: 'uj-cosmetic',
  storageBucket: 'uj-cosmetic.firebasestorage.app',
  messagingSenderId: '910374965191',
  appId: '1:910374965191:web:1043f2503605029f0253e2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Settings ────────────────────────────────────────────────────
const siteSettings = {
  announcementText: 'Монгол даяар хүргэлт хийдэг · 50,000₮-с дээш захиалгад үнэгүй хүргэлт',
  announcementActive: true,
  freeShippingThreshold: 50000,
  shippingCost: 5000,
  bankName: 'Хаан Банк',
  bankAccount: 'ТАНЫ_ДАНСНЫ_ДУГААР',
  bankAccountName: 'УЖ Косметик',
  instagramUrl: 'https://instagram.com/uj_cosmetic',
  phone: 'ТАНЫ_УТАСНЫ_ДУГААР',
  email: 'ТАНЫ_ИМЭЙЛ',
};

// ─── Products ────────────────────────────────────────────────────
const products = [
  {
    slug: 'skin-balancing-serum',
    name_mn: 'Арьс Тэнцвэржүүлэгч Серум',
    name_en: 'Skin Balancing Serum',
    price: 89000,
    category: 'serum',
    description_mn: 'Арьсны pH тэнцвэрийг хамгаалж, жижиг нүхийг нарийсгах тусгай бодисуудаар баяжуулсан.',
    ingredients: 'Усны экстракт, Ниацинамид 10%, Хиалурон хүчил, Пантенол, Витамин В5',
    howToUse: 'Арьсаа угааж цэвэрлэсний дараа тоник хэрэглэхээс өмнө 2-3 дусал авч арьсандаа шингээнэ.',
    featured: true,
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
  },
  {
    slug: 'moisture-air-toner',
    name_mn: 'Нойтон Агаар Тоник',
    name_en: 'Moisture Air Toner',
    price: 65000,
    category: 'toner',
    description_mn: 'Арьсыг гүнээс нь чийгшүүлж, тэжээдэг хөнгөн бүтэцтэй тоник. Хайлуроны хүчил агуулсан найрлага нь арьсны чийгийн тэнцвэрийг хадгална.',
    ingredients: 'Гиалуроны хүчил, Алоэ вера экстракт, Глицерин, Пантенол, Бетаин, Тремелла экстракт',
    howToUse: 'Нүүрээ угааж цэвэрлэсний дараа хөвөн дээр эсвэл алган дээрээ тоник авч, нүүрэндээ зөөлөн тараана.',
    featured: true,
    images: ["https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=600"],
  },
  {
    slug: 'fine-nourishing-facial-oil',
    name_mn: 'Нарийн Шим Нүүрний Тос',
    name_en: 'Fine Nourishing Facial Oil',
    price: 120000,
    category: 'oil',
    description_mn: 'Байгалийн гаралтай тосны холимогоос бүтсэн арьс тэжээгч нүүрний тос. Жожоба, аргании тос зэрэг үнэт найрлага.',
    ingredients: 'Жожоба тос, Аргании тос, Шипхангийн тос, Лавандарын тос, Витамин Е, Сквалан',
    howToUse: 'Арьс арчилгааны хамгийн сүүлийн алхам. 3-4 дусал тосыг алган дээрээ дулааруулж, нүүрэндээ зөөлөн дараж шингээнэ.',
    featured: true,
    images: ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600"],
  },
  {
    slug: 'soft-shield-cream',
    name_mn: 'Зөөлөн Бамбай Тосолгоо',
    name_en: 'Soft Shield Cream',
    price: 78000,
    category: 'cream',
    description_mn: 'Арьсыг хамгаалах, чийгшүүлэх хоёр үйлдлийг нэгтгэсэн хөнгөн тосолгоо. Керамид агуулсан найрлага.',
    ingredients: 'Керамид NP, Керамид AP, Гиалуроны хүчил, Ши тос, Пантенол, Сквалан, Центелла азиатика',
    howToUse: 'Серум шингэсний дараа тохирох хэмжээг авч нүүр, хүзүүндээ зөөлөн тараана.',
    featured: true,
    images: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600"],
  },
  {
    slug: 'sun-protector-spf50',
    name_mn: 'Наран Хамгаалагч SPF50+',
    name_en: 'Sun Protector SPF50+',
    price: 55000,
    category: 'sunscreen',
    description_mn: 'SPF50+ PA++++ хамгаалалттай, хөнгөн бүтэцтэй наран хамгаалагч. Цагаан үлдэгдэлгүй.',
    ingredients: 'Цинкийн оксид, Титаны диоксид, Ниацинамид, Гиалуроны хүчил, Витамин Е, Алоэ вера',
    howToUse: 'Арьс арчилгааны хамгийн сүүлийн алхам. 2-3 цаг тутамд дахин түрхэнэ.',
    featured: false,
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600"],
  },
  {
    slug: 'facial-cleansing-gel',
    name_mn: 'Нүүрний Угаалгын Гель',
    name_en: 'Facial Cleansing Gel',
    price: 45000,
    category: 'cleanser',
    description_mn: 'Арьсны pH тэнцвэрийг хадгалсан зөөлөн угаалгын гель. Арьсыг хатаалгүйгээр гүнзгий цэвэрлэнэ.',
    ingredients: 'Кокамидопропил бетаин, Глицерин, Пантенол, Ногоон цайны экстракт, Алоэ вера, Камомил экстракт',
    howToUse: 'Нүүрээ норгосны дараа тохирох хэмжээг авч, хөөсрүүлэн нүүрэндээ зөөлөн массаж хийнэ.',
    featured: false,
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
  },
  {
    slug: 'overnight-recovery-mask',
    name_mn: 'Шөнийн Нөхөн Сэргээгч Маск',
    name_en: 'Overnight Recovery Mask',
    price: 95000,
    category: 'mask',
    description_mn: 'Шөнийн цагаар арьсыг гүнээс нь нөхөн сэргээдэг унтлагын маск. Ретинол болон пептидийн хослол.',
    ingredients: 'Ретинол, Пептид комплекс, Ниацинамид, Аденозин, Гиалуроны хүчил, Ши тос, Сквалан',
    howToUse: 'Орой арьс арчилгааны хамгийн сүүлийн алхам. Нимгэн давхаргаар түрхэж, угаалгүйгээр унтана.',
    featured: false,
    images: ["https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=600"],
  },
  {
    slug: 'vitamin-c-toner',
    name_mn: 'Витамин С Тоник',
    name_en: 'Vitamin C Toner',
    price: 72000,
    category: 'toner',
    description_mn: 'Витамин С-ийн өндөр агууламжтай гэрэлтүүлэгч тоник. Арьсны өнгийг жигдрүүлж, хар толбыг бүдгэрүүлнэ.',
    ingredients: 'Аскорбил глюкозид (Витамин С), Ниацинамид, Арбутин, Цитрусын экстракт, Глицерин, Пантенол',
    howToUse: 'Нүүрээ угааж цэвэрлэсний дараа хөвөн дээр тоник авч, нүүрэндээ зөөлөн арчина.',
    featured: false,
    images: ["https://images.unsplash.com/photo-1617897903246-719242758050?w=600"],
  },
];

// ─── Seed ────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting Firestore seed...\n');

  // 1. Settings
  console.log('📋 Seeding settings/main...');
  await setDoc(doc(db, 'settings', 'main'), siteSettings, { merge: true });
  console.log('   ✅ settings/main written (1 doc)\n');

  // 2. Products
  console.log('📦 Seeding products...');
  let productCount = 0;

  for (const product of products) {
    const productRef = doc(db, 'products', product.slug);
    await setDoc(
      productRef,
      {
        ...product,
        id: product.slug,
        salePrice: null,
        saleEndDate: null,
        videoUrl: null,
        published: true,
        inStock: true,
        views: 0,
        orderCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    productCount++;
    console.log(`   ✅ products/${product.slug} — ${product.name_mn}`);
  }

  console.log(`\n   Total: ${productCount} products written\n`);

  // Summary
  console.log('─'.repeat(40));
  console.log('✅ Seeding complete!');
  console.log(`   • settings/main: 1 doc`);
  console.log(`   • products: ${productCount} docs`);
  console.log("✅ Images updated for all 8 products");
  console.log('─'.repeat(40));

  // Force exit since Firestore keeps connection open
  setTimeout(() => process.exit(0), 2000);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
