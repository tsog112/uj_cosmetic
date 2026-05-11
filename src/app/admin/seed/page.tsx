'use client';

import { useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const products = [
  {
    slug: 'pepe-juice-detox',
    name_mn: 'Pepe Juice Detox',
    price: 70000,
    category: 'other',
    description_mn: 'Детокс ундаа. Биеийг дотроос нь дэмжих зориулалттай бүтээгдэхүүн.',
    ingredients: 'Цикори үндэс, чимбэг, грейпфрут, хибискус, эслэг.',
    howToUse: '1 уутыг 200-300мл усанд найруулж хэрэглэнэ.',
    featured: true,
    images: ['/placeholder-product.svg'],
  },
  {
    slug: 'dj-carbon-therapy',
    name_mn: 'DJ Carbon Therapy',
    price: 120000,
    category: 'mask',
    description_mn: 'CO2 арчилгааны иж бүрдэл. Арьсыг сэргээж, өнгийг жигд харагдуулахад тусална.',
    ingredients: 'CO2 гель, centella asiatica, ногоон цайны ханд, коллаген.',
    howToUse: 'Цэвэр арьсан дээр түрхэж 20-30 минут байлгаад угаана.',
    featured: true,
    images: ['/placeholder-product.svg'],
  },
  {
    slug: '9-9-seaweed-peel',
    name_mn: '9.9 Seaweed Peel',
    price: 95000,
    category: 'other',
    description_mn: 'Далайн замагтай пилинг. Арьсны гадаргууг цэвэр, толигор харагдуулахад тусална.',
    ingredients: 'Spicule, далайн замаг, гиалуроны хүчил.',
    howToUse: 'Зааврын дагуу түрхэж хэрэглэнэ. Мэдрэмтгий арьсанд болгоомжтой хэрэглэнэ.',
    featured: false,
    images: ['/placeholder-product.svg'],
  },
];

export default function AdminSeedPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (message: string) => setLogs(prev => [...prev, message]);

  async function handleSeed() {
    setSeeding(true);
    setLogs([]);
    setDone(false);

    try {
      addLog('Batch үүсгэж байна...');
      const batch = writeBatch(db);

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
        addLog(`products/${product.slug} бэлтгэгдлээ`);
      }

      addLog('Firestore руу илгээж байна...');
      await batch.commit();
      addLog(`Амжилттай хадгалагдлаа. Нийт: ${products.length} бүтээгдэхүүн`);
      setDone(true);
    } catch (error: any) {
      addLog(`Алдаа гарлаа: ${error.message}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4 md:space-y-8 max-w-2xl">
      <div>
        <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Системийн хэрэгсэл</p>
        <h2 className="text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Өгөгдөл оруулах</h2>
      </div>

      <div className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
        <p className="text-sm text-[#8B6B78] leading-7 mb-6">
          Firestore-д жишээ бүтээгдэхүүнүүдийг batch хэлбэрээр нэмнэ. Энэ үйлдэл одоо байгаа document-уудыг merge хийнэ.
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className={`min-h-11 rounded-[10px] px-5 text-sm w-full md:w-auto disabled:opacity-50 ${
            done ? 'bg-[#FFF0F6] border border-[#FFB7D5] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white'
          }`}
        >
          {seeding ? 'Түр хүлээнэ үү...' : done ? 'Амжилттай' : 'Өгөгдөл оруулах'}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="rounded-[16px] bg-[#1A1A1A] text-[#FFF8FB] p-5 font-mono text-xs leading-6 max-h-[420px] overflow-y-auto">
          {logs.map((log, index) => <div key={index}>{log}</div>)}
        </div>
      )}
    </div>
  );
}
