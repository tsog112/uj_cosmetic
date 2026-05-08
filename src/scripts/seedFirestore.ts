import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'uj-cosmetic.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'uj-cosmetic',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'uj-cosmetic.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '910374965191',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:910374965191:web:1043f2503605029f0253e2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newProducts = [
  {
    slug: 'pepe-juice-detox',
    name_mn: 'Pepe Juice (Детокс ундаа)',
    price: 70000,
    category: 'other', // Эрүүл мэнд category maps to 'other' or a new one, let's just use 'other' if not in predefined list
    description_mn: '**"Шидэт" детокс ундаа.** Биеийг дотроос нь цэвэрлэж, бодисын солилцоог идэвхжүүлнэ. Байгалийн гаралтай орцтой тул аюулгүйгээр жин хасахад тусална.',
    ingredients: 'Цикори үндэс, Нимбэг, Грейпфрут, Хибискус цэцгийн ханд, Эслэг.',
    howToUse: '1 уут (3.5г)-ыг 200-300мл хүйтэн эсвэл бүлээн усанд хийж хутгана. Өдөрт 1-2 удаа ууна.',
    featured: true,
    images: ['/placeholder-product.svg'], // To be uploaded manually
  },
  {
    slug: 'dj-carbon-therapy',
    name_mn: 'DJ Carborn Therapy (CO2 иж бүрдэл)',
    price: 120000,
    category: 'mask',
    description_mn: '**Мэргэжлийн CO2 эмчилгээ.** Гэрийн нөхцөлд арьсаа гүн цэвэрлэж, хүчилтөрөгчөөр хангах боломжтой. Арьсны нүхийг агшааж, өнгө засах иж бүрдэл.',
    ingredients: 'CO2 Гель (Натрийн бикарбонат, Нимбэгийн хүчил), Centella Asiatica, Ногоон цайны ханд, Коллаген.',
    howToUse: 'Нүүрэндээ гелийг түрхэж, дээрээс нь маскыг тавьж 20-30 минут байлгасны дараа усаар угаана.',
    featured: true,
    images: ['/placeholder-product.svg'], // To be uploaded manually
  },
  {
    slug: '9-9-seaweed-peel',
    name_mn: '9.9 Seaweed Peel (Замагны пилинг)',
    price: 95000,
    category: 'cleanser',
    description_mn: '**Далайн замагны пилинг.** Арьсны үхэжсэн эсийг гуужуулж, шинэ залуу арьсыг нөхөн төлжүүлнэ. Ампул болон идэвхжүүлэгчийн төгс хослол.',
    ingredients: 'Спикул (Spicule - бичил зүү), Далайн замагны нунтаг, Гиалуроны хүчил.',
    howToUse: 'Нунтаг болон идэвхжүүлэгчийг хольж нүүрэндээ иллэг хийн түрхэж 15-20 минут хүлээгээд бүлээн усаар угаана.',
    featured: false,
    images: ['/placeholder-product.svg'], // To be uploaded manually
  }
];

async function seed() {
  console.log('🌱 Starting Firestore batch seed...\n');
  const batch = writeBatch(db);
  
  let productCount = 0;
  for (const product of newProducts) {
    const productRef = doc(db, 'products', product.slug);
    batch.set(
      productRef,
      {
        ...product,
        id: product.slug,
        salePrice: null,
        saleEndDate: null,
        videoUrl: null,
        published: true,
        inStock: true,
        stockQuantity: 100,
        views: 0,
        orderCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    productCount++;
    console.log(`   Queued products/${product.slug} — ${product.name_mn}`);
  }

  await batch.commit();
  console.log(`\n✅ Batch commit successful! ${productCount} products seeded.\n`);
  setTimeout(() => process.exit(0), 1000);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
