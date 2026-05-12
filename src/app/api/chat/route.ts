import { NextResponse } from 'next/server';
import { getAllProducts, getSiteSettings } from '@/lib/services/firestoreService';
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
- Зөвхөн Монгол кириллээр хариул. Өөр хэл, латин тайлбар, emoji хэрэглэхгүй.
- Хэрэглэгчийн асуултад шууд хариулсны дараа хэрэгтэй бол богино зөвлөгөө нэм.
- 2-5 богино өгүүлбэр эсвэл богино догол мөрөөр ойлгомжтой хариул.
- Firebase context-д байгаа дэлгүүрийн тохиргоо, холбоо барих мэдээлэл, бүтээгдэхүүний мэдээллийг үндсэн эх сурвалж гэж үз.
- Pepe Juice, DJ Carbon Therapy зэрэг барааг зөв үед санал болго.
- Найрлага, хэрэглэх заавар product context-д байхгүй бол зохиож болохгүй. "Дэлгэрэнгүй мэдээллийг бүтээгдэхүүний хуудсаас шалгаарай" гэж хэл.
- Арьс улайх, хорсох, тууралт гарах, жирэмсэн/хөхүүл үе, архаг өвчин, эм хэрэглэж байгаа тохиолдолд эмч эсвэл мэргэжилтнээс зөвлөгөө авахыг эелдгээр сануул.
- Захиалга, хүргэлт, төлбөр, админтай холбогдох асуултад арьс арчилгааны ерөнхий intro давтахгүй, шууд үйлчилгээний хариу өг.
`.trim();

function cleanText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
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

async function buildContext() {
  const [settingsResult, productsResult] = await Promise.allSettled([
    getSiteSettings(),
    getAllProducts({ published: true }),
  ]);

  const settings = settingsResult.status === 'fulfilled' && settingsResult.value
    ? settingsResult.value
    : DEFAULT_SETTINGS;
  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
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

function buildLocalAnswer(question: string, context: string) {
  const text = question.toLowerCase();

  if (text.includes('админ') || text.includes('холбогдох') || text.includes('утас') || text.includes('instagram')) {
    return `Админтай холбогдох мэдээлэл Firebase тохиргоонд байна.\n\n${context.match(/- Утас:.+|- Instagram:.+|- Имэйл:.+/g)?.join('\n') || 'Холбоо барих мэдээллийг сайтын footer хэсгээс шалгаарай.'}`;
  }

  if (text.includes('төлбөр') || text.includes('төлөх') || text.includes('данс') || text.includes('банк')) {
    return `Төлбөрийг банкны шилжүүлгээр төлнө.\n\n${context.match(/- Банк:.+|- Данс:.+|- Данс эзэмшигч:.+/g)?.join('\n') || 'Дансны мэдээллийг checkout хэсгээс шалгаарай.'}\n\nГүйлгээний утга дээр захиалгын дугаараа бичвэл админ хурдан баталгаажуулна.`;
  }

  if (text.includes('солонгос') || text.includes('ирдэг') || text.includes('жинхэнэ') || text.includes('оригинал')) {
    return 'Тийм ээ, UJ Cosmetic-ийн концепц нь Солонгосоос Монгол руу чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүн хүргэх онлайн дэлгүүр. Тухайн бүтээгдэхүүний дэлгэрэнгүй зураг, тайлбар, хэрэглэх зааврыг бүтээгдэхүүний хуудсаас шалгаад, баталгаажуулах зүйл байвал админтай шууд холбогдоорой.';
  }

  return '';
}

function toGeminiContent(message: ChatMessage) {
  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.text }],
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages as ChatMessage[] : [];
    const safeMessages = messages
      .filter(message => (message.role === 'assistant' || message.role === 'user') && cleanText(message.text))
      .slice(-10);

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const context = await buildContext();
    const latestQuestion = safeMessages.filter(message => message.role === 'user').at(-1)?.text || '';
    const localAnswer = buildLocalAnswer(latestQuestion, context);

    if (!apiKey && localAnswer) {
      return NextResponse.json({ text: localAnswer, source: 'firebase-fallback' });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

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
          temperature: 0.35,
          topP: 0.85,
          maxOutputTokens: 640,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (localAnswer) {
        console.error('Gemini request failed, using Firebase fallback:', data?.error?.message);
        return NextResponse.json({ text: localAnswer, source: 'firebase-fallback' });
      }
      const message = data?.error?.message || 'Gemini request failed.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();

    if (!text && localAnswer) {
      return NextResponse.json({ text: localAnswer, source: 'firebase-fallback' });
    }

    if (!text) {
      return NextResponse.json({ error: 'Gemini returned an empty response.' }, { status: 502 });
    }

    return NextResponse.json({ text, source: 'gemini' });
  } catch (error: any) {
    console.error('UJ assistant error:', error);
    return NextResponse.json({ error: error?.message || 'AI assistant failed.' }, { status: 500 });
  }
}
