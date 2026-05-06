'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  },
  {
    slug: 'moisture-air-toner',
    name_mn: 'Нойтон Агаар Тоник',
    name_en: 'Moisture Air Toner',
    price: 65000,
    category: 'toner',
    description_mn: 'Арьсыг гүнээс нь чийгшүүлж, тэжээдэг хөнгөн бүтэцтэй тоник. Хайлуроны хүчил агуулсан найрлага.',
    ingredients: 'Гиалуроны хүчил, Алоэ вера экстракт, Глицерин, Пантенол, Бетаин, Тремелла экстракт',
    howToUse: 'Нүүрээ угааж цэвэрлэсний дараа хөвөн дээр эсвэл алган дээрээ тоник авч, нүүрэндээ зөөлөн тараана.',
    featured: true,
  },
  {
    slug: 'fine-nourishing-facial-oil',
    name_mn: 'Нарийн Шим Нүүрний Тос',
    name_en: 'Fine Nourishing Facial Oil',
    price: 120000,
    category: 'oil',
    description_mn: 'Байгалийн гаралтай тосны холимогоос бүтсэн арьс тэжээгч нүүрний тос.',
    ingredients: 'Жожоба тос, Аргании тос, Шипхангийн тос, Лавандарын тос, Витамин Е, Сквалан',
    howToUse: 'Арьс арчилгааны хамгийн сүүлийн алхам. 3-4 дусал тосыг алган дээрээ дулааруулж, нүүрэндээ зөөлөн дараж шингээнэ.',
    featured: true,
  },
  {
    slug: 'soft-shield-cream',
    name_mn: 'Зөөлөн Бамбай Тосолгоо',
    name_en: 'Soft Shield Cream',
    price: 78000,
    category: 'cream',
    description_mn: 'Арьсыг хамгаалах, чийгшүүлэх хоёр үйлдлийг нэгтгэсэн хөнгөн тосолгоо.',
    ingredients: 'Керамид NP, Керамид AP, Гиалуроны хүчил, Ши тос, Пантенол, Сквалан, Центелла азиатика',
    howToUse: 'Серум шингэсний дараа тохирох хэмжээг авч нүүр, хүзүүндээ зөөлөн тараана.',
    featured: true,
  },
  {
    slug: 'sun-protector-spf50',
    name_mn: 'Наран Хамгаалагч SPF50+',
    name_en: 'Sun Protector SPF50+',
    price: 55000,
    category: 'sunscreen',
    description_mn: 'SPF50+ PA++++ хамгаалалттай, хөнгөн бүтэцтэй наран хамгаалагч.',
    ingredients: 'Цинкийн оксид, Титаны диоксид, Ниацинамид, Гиалуроны хүчил, Витамин Е, Алоэ вера',
    howToUse: 'Арьс арчилгааны хамгийн сүүлийн алхам. 2-3 цаг тутамд дахин түрхэнэ.',
    featured: false,
  },
  {
    slug: 'facial-cleansing-gel',
    name_mn: 'Нүүрний Угаалгын Гель',
    name_en: 'Facial Cleansing Gel',
    price: 45000,
    category: 'cleanser',
    description_mn: 'Арьсны pH тэнцвэрийг хадгалсан зөөлөн угаалгын гель.',
    ingredients: 'Кокамидопропил бетаин, Глицерин, Пантенол, Ногоон цайны экстракт, Алоэ вера, Камомил экстракт',
    howToUse: 'Нүүрээ норгосны дараа тохирох хэмжээг авч, хөөсрүүлэн нүүрэндээ зөөлөн массаж хийнэ.',
    featured: false,
  },
  {
    slug: 'overnight-recovery-mask',
    name_mn: 'Шөнийн Нөхөн Сэргээгч Маск',
    name_en: 'Overnight Recovery Mask',
    price: 95000,
    category: 'mask',
    description_mn: 'Шөнийн цагаар арьсыг гүнээс нь нөхөн сэргээдэг унтлагын маск.',
    ingredients: 'Ретинол, Пептид комплекс, Ниацинамид, Аденозин, Гиалуроны хүчил, Ши тос, Сквалан',
    howToUse: 'Орой арьс арчилгааны хамгийн сүүлийн алхам. Нимгэн давхаргаар түрхэж, угаалгүйгээр унтана.',
    featured: false,
  },
  {
    slug: 'vitamin-c-toner',
    name_mn: 'Витамин С Тоник',
    name_en: 'Vitamin C Toner',
    price: 72000,
    category: 'toner',
    description_mn: 'Витамин С-ийн өндөр агууламжтай гэрэлтүүлэгч тоник.',
    ingredients: 'Аскорбил глюкозид (Витамин С), Ниацинамид, Арбутин, Цитрусын экстракт, Глицерин, Пантенол',
    howToUse: 'Нүүрээ угааж цэвэрлэсний дараа хөвөн дээр тоник авч, нүүрэндээ зөөлөн арчина.',
    featured: false,
  },
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
      // 1. Settings
      addLog('📋 Seeding settings/main...');
      await setDoc(doc(db, 'settings', 'main'), siteSettings, { merge: true });
      addLog('   ✅ settings/main written');

      // 2. Products
      addLog('');
      addLog('📦 Seeding products...');
      let count = 0;

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
            images: [],
            published: true,
            inStock: true,
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

      addLog('');
      addLog('─'.repeat(40));
      addLog('✅ Seeding complete!');
      addLog(`   • settings/main: 1 doc`);
      addLog(`   • products: ${count} docs`);
      addLog('─'.repeat(40));
      setDone(true);
    } catch (err: any) {
      addLog('');
      addLog(`❌ Error: ${err.message}`);
      addLog('');
      addLog('💡 Та admin эрхтэй хэрэглэгчээр нэвтэрсэн эсэхээ шалгана уу.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Анхны мэдээлэл оруулах</h1>
      <p className="text-sm text-gray-500 mb-8">
        Firestore-д 8 бүтээгдэхүүн, сайтын тохиргоо оруулна. Давтан ажиллуулахад аюулгүй (давхардахгүй).
      </p>

      <button
        onClick={handleSeed}
        disabled={seeding}
        className={`px-8 py-3 rounded-lg text-sm font-bold transition-colors ${
          done
            ? 'bg-green-600 text-white'
            : 'bg-[#FFB7D5] hover:bg-[#f5a0c5] text-[#1A1A1A] disabled:opacity-50'
        }`}
      >
        {seeding ? 'Оруулж байна...' : done ? '✅ Амжилттай!' : '🌱 Мэдээлэл оруулах'}
      </button>

      {logs.length > 0 && (
        <div className="mt-8 bg-gray-900 text-green-400 rounded-xl p-6 font-mono text-sm leading-relaxed max-h-[500px] overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className={log.startsWith('❌') ? 'text-red-400' : ''}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
