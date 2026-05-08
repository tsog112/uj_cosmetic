'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';

const products = [
  {
    slug: 'pepe-juice-detox',
    name_mn: 'Pepe Juice (Детокс ундаа)',
    price: 70000,
    category: 'Эрүүл мэнд',
    description_mn: '**"Шидэт" детокс ундаа.** Биеийг дотроос нь цэвэрлэж, бодисын солилцоог идэвхжүүлнэ. Байгалийн гаралтай орцтой тул аюулгүйгээр жин хасахад тусална.',
    ingredients: 'Цикори үндэс, Нимбэг, Грейпфрут, Хибискус цэцгийн ханд, Эслэг.',
    howToUse: '1 уут (3.5г)-ыг 200-300мл хүйтэн эсвэл бүлээн усанд хийж хутгана. Өдөрт 1-2 удаа ууна.',
    featured: true,
    images: ['/placeholder-product.svg'], // Placeholder until manually uploaded
  },
  {
    slug: 'dj-carbon-therapy',
    name_mn: 'DJ Carborn Therapy (CO2 иж бүрдэл)',
    price: 120000,
    category: 'Арьс арчилгаа',
    description_mn: '**Мэргэжлийн CO2 эмчилгээ.** Гэрийн нөхцөлд арьсаа гүн цэвэрлэж, хүчилтөрөгчөөр хангах боломжтой. Арьсны нүхийг агшааж, өнгө засах иж бүрдэл.',
    ingredients: 'CO2 Гель (Натрийн бикарбонат, Нимбэгийн хүчил), Centella Asiatica, Ногоон цайны ханд, Коллаген.',
    howToUse: 'Нүүрэндээ гелийг түрхэж, дээрээс нь маскыг тавьж 20-30 минут байлгасны дараа усаар угаана.',
    featured: true,
    images: ['/placeholder-product.svg'], // Placeholder until manually uploaded
  },
  {
    slug: '9-9-seaweed-peel',
    name_mn: '9.9 Seaweed Peel (Замагны пилинг)',
    price: 95000,
    category: 'Гүн цэвэрлэгээ',
    description_mn: '**Далайн замагны пилинг.** Арьсны үхэжсэн эсийг гуужуулж, шинэ залуу арьсыг нөхөн төлжүүлнэ. Ампул болон идэвхжүүлэгчийн төгс хослол.',
    ingredients: 'Спикул (Spicule - бичил зүү), Далайн замагны нунтаг, Гиалуроны хүчил.',
    howToUse: 'Нунтаг болон идэвхжүүлэгчийг хольж нүүрэндээ иллэг хийн түрхэж 15-20 минут хүлээгээд бүлээн усаар угаана.',
    featured: false,
    images: ['/placeholder-product.svg'], // Placeholder until manually uploaded
  }
];

export default function AdminSeedPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setLogs([]);
    setDone(false);

    try {
      addLog('📦 Багц (Batch) үүсгэж байна...');
      const batch = writeBatch(db);
      let count = 0;

      for (const product of products) {
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
        count++;
        addLog(`   ✅ products/${product.slug} — ${product.name_mn}`);
      }

      addLog('🔄 Firestore рүү илгээж байна...');
      await batch.commit();

      addLog('');
      addLog('─'.repeat(40));
      addLog('✅ Багц амжилттай хадгалагдлаа!');
      addLog(`   • Нийт бүтээгдэхүүн: ${count}`);
      addLog('─'.repeat(40));
      setDone(true);
    } catch (err: any) {
      addLog('');
      addLog(`❌ Алдаа гарлаа: ${err.message}`);
      addLog('');
      addLog('💡 Та admin эрхтэй хэрэглэгчээр нэвтэрсэн эсэхээ шалгана уу.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl bg-sand border border-border p-10 shadow-sm rounded-sm">
      <h1 className="text-3xl font-serif text-charcoal mb-4">Өгөгдөл оруулах</h1>
      <p className="font-sans text-sm text-neutral-600 mb-8 tracking-wide">
        Firestore-д 3 шинэ бүтээгдэхүүн (Pepe Juice, CO2, Seaweed Peel) багцаар (batch) оруулна.
      </p>

      <button
        onClick={handleSeed}
        disabled={seeding}
        className={`btn-premium w-full md:w-auto ${
          done
            ? 'bg-charcoal text-sand'
            : 'bg-dusty-rose border-dusty-rose text-charcoal hover:bg-transparent hover:text-dusty-rose disabled:opacity-50'
        }`}
      >
        {seeding ? 'Түр хүлээнэ үү...' : done ? '✅ Амжилттай!' : '🌱 Өгөгдөл оруулах (Batch)'}
      </button>

      {logs.length > 0 && (
        <div className="mt-8 bg-charcoal text-sand-dark rounded-sm p-6 font-mono text-sm leading-relaxed max-h-[500px] overflow-y-auto shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className={log.startsWith('❌') ? 'text-red-400' : ''}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
