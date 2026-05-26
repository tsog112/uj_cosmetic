import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { toPublicProduct } from '@/lib/publicDto';
import { DEFAULT_SETTINGS, formatPrice } from '@/types';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

const brandInstructions = `
Чи бол UJ Cosmetic-ийн арьс арчилгаа, гоо сайхан, эрүүл мэндийн нэмэлт бүтээгдэхүүний борлуулалтын зөвлөх.
UJ Cosmetic нь Солонгосоос Монгол руу чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүн санал болгодог premium онлайн дэлгүүр.

Заавар:
- Зөвхөн Монгол кириллээр хариул.
- Хариултаа бүрэн өгүүлбэрээр дуусга. Дундаас нь тасархай өгүүлбэр үлдээж болохгүй.
- Хэрэглэгчийн асуултад шууд хариулсны дараа хэрэгтэй бол богино зөвлөгөө нэм.
- 2-5 богино өгүүлбэрээр ойлгомжтой хариул.
- Firebase context-д байгаа дэлгүүрийн тохиргоо, холбоо барих мэдээлэл, бүтээгдэхүүний мэдээллийг үндсэн эх сурвалж гэж үз.
- Pepe Juice, DJ Carbon Therapy зэрэг барааг зөв үед санал болго.
- Найрлага, хэрэглэх заавар product context-д байхгүй бол зохиож болохгүй. "Дэлгэрэнгүй мэдээллийг бүтээгдэхүүний хуудсаас шалгаарай" гэж хэл.
- Захиалга, хүргэлт, төлбөр, админтай холбогдох асуултад арьс арчилгааны intro давтахгүй, шууд үйлчилгээний хариу өг.
`.trim();

function cleanText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasAny(text: string, words: string[]) {
  return words.some(word => text.includes(word));
}

function productLine(product: any) {
  const name = cleanText(product.name_mn || product.name_en || product.slug);
  const price = formatPrice(Number(product.salePrice ?? product.price ?? 0));
  const stock = product.inStock === false ? 'дууссан' : 'бэлэн';
  const category = cleanText(product.category);
  const description = cleanText(product.description_mn).slice(0, 260);
  const ingredients = cleanText(product.ingredients).slice(0, 180);
  const howToUse = cleanText(product.howToUse).slice(0, 220);

  return [
    `- ${name}`,
    `ангилал: ${category || 'тодорхойгүй'}`,
    `үнэ: ${price}`,
    `төлөв: ${stock}`,
    description ? `тайлбар: ${description}` : '',
    ingredients ? `найрлага: ${ingredients}` : '',
    howToUse ? `хэрэглэх заавар: ${howToUse}` : '',
  ].filter(Boolean).join('; ');
}

async function getChatData() {
  const publicProducts = async () => {
    const snap = await getAdminDb().collection('products').where('published', '==', true).get();
    return snap.docs.map((doc) => toPublicProduct(doc.id, doc.data()));
  };

  const [settingsResult, productsResult] = await Promise.allSettled([
    getSiteSettings(),
    publicProducts(),
  ]);

  const settings = settingsResult.status === 'fulfilled' && settingsResult.value
    ? settingsResult.value
    : DEFAULT_SETTINGS;
  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];

  return { settings, products };
}

function buildContext(settings: typeof DEFAULT_SETTINGS, products: any[]) {
  const featuredProducts = products
    .filter(product => product.inStock !== false)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 20);

  const productContext = featuredProducts.length
    ? featuredProducts.map(productLine).join('\n')
    : [
        '- Pepe Juice: Солонгос premium бүтээгдэхүүн. Дэлгэрэнгүй мэдээллийг бүтээгдэхүүний хуудсаас шалгаарай.',
        '- DJ Carbon Therapy: Солонгос арьс арчилгааны premium бүтээгдэхүүн. Дэлгэрэнгүй мэдээллийг бүтээгдэхүүний хуудсаас шалгаарай.',
      ].join('\n');

  return `
Дэлгүүрийн Firebase тохиргоо:
- Концепц: Солонгосоос Монгол руу чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүн хүргэдэг UJ Cosmetic онлайн дэлгүүр.
- Хүргэлт: ${formatPrice(settings.shippingCost)}
- Үнэгүй хүргэлтийн босго: ${formatPrice(settings.freeShippingThreshold)}
- Банк: ${settings.bankName}
- Данс: ${settings.bankAccount}
- Данс эзэмшигч: ${settings.bankAccountName}
- Утас: ${settings.phone}
- Instagram: ${settings.instagramUrl}
- Имэйл: ${settings.email}

Бүтээгдэхүүний Firebase лавлах:
${productContext}
`.trim();
}

function buildServiceAnswer(question: string, settings: typeof DEFAULT_SETTINGS) {
  const text = question.toLowerCase();
  const compact = text.replace(/[\s._-]+/g, '');

  if (/^(сайн уу|сайн байна уу|hi|hello|hey|snu|sainuu|sainbainuu)\??$/i.test(compact) || hasAny(text, ['sain uu', 'sain baina uu'])) {
    return 'Сайн байна уу. UJ Cosmetic-ийн зөвлөх байна. Та бүтээгдэхүүн сонголт, төлбөр, хүргэлт, Солонгосоос ирэх хугацаа эсвэл админтай холбогдох талаар асууж болно.';
  }

  if (hasAny(text, ['төлбөр', 'төлөх', 'данс', 'банк', 'payment', 'pay', 'tulbur', 'tolbor', 'tuluh', 'toloh', 'dans', 'bank'])) {
    return `Төлбөрийг банкны шилжүүлгээр төлнө.\n\nБанк: ${settings.bankName}\nДанс: ${settings.bankAccount}\nДанс эзэмшигч: ${settings.bankAccountName}\n\nГүйлгээний утга дээр захиалгын дугаараа бичвэл админ хурдан тулгаж баталгаажуулна.`;
  }

  if (hasAny(text, ['админ', 'холбогдох', 'утас', 'дугаар', 'instagram', 'инстаграм', 'email', 'имэйл', 'support', 'admin', 'holbogdoh', 'utas', 'dugaar', 'dugar'])) {
    return `Админтай дараах сувгаар холбогдож болно.\n\nУтас: ${settings.phone}\nInstagram: ${settings.instagramUrl}\nИмэйл: ${settings.email}\n\nЗахиалгын дугаар, нэр, утсаа хамт бичвэл илүү хурдан шалгаж өгнө.`;
  }

  if (
    hasAny(text, ['mongold', 'mongol', 'zahialsan', 'zahialga', 'baraa', 'hezee', 'ireh', 'irh', 'hureh', 'hurgelt', 'honog']) &&
    (hasAny(text, ['hezee', 'ireh', 'irh', 'hureh', 'hurgelt', 'honog']) || hasAny(text, ['захиалсан', 'хэзээ', 'ирэх', 'хүрэх']))
  ) {
    return `Захиалсан бараа тань хэзээ ирэх нь тухайн бүтээгдэхүүн бэлэн байгаа эсэх, Солонгосоос татан авалт хийгдэж байгаа эсэх, мөн хил гааль болон хүргэлтийн ачааллаас хамаарна.\n\nЗахиалга баталгаажсаны дараа админ танд илүү тодорхой хугацаа хэлж өгнө. Хэрэв захиалгын дугаартай бол админ руу дугаараа явуулаад явцыг нь шууд шалгуулаарай.`;
  }

  if (hasAny(text, ['солонгос', 'korea', 'korean', 'ирдэг', 'жинхэнэ', 'оригинал', 'original', 'solongos', 'solongosoos', 'ireh', 'irdeg', 'jinhene'])) {
    if (hasAny(text, ['хэд хоног', 'хэзээ', 'хугацаа', 'ирэх', 'тээвэр', 'хүргэлт', 'hed honog', 'hezee', 'hugatsaa', 'teever', 'hurgelt', 'ireh', 'honog'])) {
      return `Тийм ээ, UJ Cosmetic нь Солонгосоос Монгол руу чанартай бүтээгдэхүүн санал болгодог онлайн дэлгүүрийн концепцтой.\n\nСолонгосоос ирэх тээвэрлэлтийн яг хугацаа тухайн үеийн татан авалт, хил гааль, хүргэлтийн ачааллаас хамаардаг тул админ захиалгыг баталгаажуулахдаа илүү тодорхой хэлж өгнө. Бэлэн байгаа бүтээгдэхүүн бол Монгол доторх хүргэлтийн үнэ ${formatPrice(settings.shippingCost)}, ${formatPrice(settings.freeShippingThreshold)}-өөс дээш захиалгад хүргэлт үнэгүй.`;
    }

    return 'Тийм ээ, UJ Cosmetic нь Солонгосоос Монгол руу чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүн санал болгодог онлайн дэлгүүрийн концепцтой. Тухайн бүтээгдэхүүний зураг, тайлбар, хэрэглэх зааврыг бүтээгдэхүүний хуудсаас шалгаад, баталгаажуулах зүйл байвал админтай шууд холбогдоорой.';
  }

  if (hasAny(text, ['хүргэл', 'хэд хоног', 'хэзээ ирэх', 'delivery', 'shipping', 'hurgelt', 'hezee ireh', 'hed honog', 'honog'])) {
    return `Монгол доторх хүргэлтийн үнэ ${formatPrice(settings.shippingCost)}. ${formatPrice(settings.freeShippingThreshold)}-өөс дээш захиалгад хүргэлт үнэгүй.\n\nЗахиалга баталгаажсаны дараа админ хүргэлтийн явц болон ойролцоо хугацааг танд мэдэгдэнэ.`;
  }

  if (hasAny(text, ['захиал', 'сагс', 'авах', 'order', 'checkout', 'zahial', 'zahialsan', 'sags', 'avah'])) {
    return 'Бүтээгдэхүүнээ сонгоод "Сагсанд хийх" эсвэл "Шууд авах" товч дарна. Дараа нь checkout хэсэгт нэр, утас, хүргэлтийн хаягаа зөв бөглөөд захиалгаа баталгаажуулаарай.';
  }

  return '';
}

function isIncompleteText(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 12) return true;
  return !/[.!?。！？…]$/.test(trimmed) && !/[а-яөүё]$/i.test(trimmed.slice(-1));
}

function toGeminiContent(message: ChatMessage) {
  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.text }],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages as ChatMessage[] : [];
    const safeMessages = messages
      .filter(message => (message.role === 'assistant' || message.role === 'user') && cleanText(message.text))
      .slice(-10);

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const latestQuestion = safeMessages.filter(message => message.role === 'user').at(-1)?.text || '';
    const { settings, products } = await getChatData();
    const serviceAnswer = buildServiceAnswer(latestQuestion, settings);

    if (serviceAnswer) {
      return NextResponse.json({ text: serviceAnswer, source: 'firebase-service' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        text: 'Одоогоор AI зөвлөх түр холбогдох боломжгүй байна. Та арьсны төрөл, хайж буй үр дүн, сонирхож байгаа бүтээгдэхүүний нэрээ бичвэл админд лавлахад тохиромжтой байдлаар чиглүүлж өгье.',
        source: 'fallback',
      });
    }

    const context = buildContext(settings, products);
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${brandInstructions}\n\n${context}` }],
        },
        contents: safeMessages.map(toGeminiContent),
        generationConfig: {
          temperature: 0.28,
          topP: 0.85,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'Gemini request failed.';
      console.error('Gemini request failed:', message);
      return NextResponse.json({
        text: 'AI зөвлөхөөс хариу авахад түр саатал гарлаа. Та асуултаа арай тодорхой бичвэл би UJ Cosmetic-ийн мэдээлэл дээр тулгуурлан тусалъя.',
        source: 'fallback',
      });
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();
    const finishReason = data?.candidates?.[0]?.finishReason;

    if (!text || finishReason === 'MAX_TOKENS' || isIncompleteText(text)) {
      console.error('Gemini returned incomplete response:', { finishReason, text });
      return NextResponse.json({
        text: 'AI зөвлөхөөс бүрэн хариу ирсэнгүй. Гэхдээ би танд тусалж чадна: захиалга, хүргэлт, төлбөр, админтай холбогдох эсвэл бүтээгдэхүүний нэрээ бичээрэй. Арьс арчилгааны зөвлөгөө авах бол арьсны төрөл, гол асуудлаа хамт бичвэл илүү оновчтой санал болгоно.',
        source: 'fallback',
      });
    }

    return NextResponse.json({ text, source: 'gemini' });
  } catch (error: any) {
    console.error('UJ assistant error:', error);
    return NextResponse.json({ error: error?.message || 'AI assistant failed.' }, { status: 500 });
  }
}
