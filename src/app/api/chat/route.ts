import { NextResponse } from 'next/server';
import { getAllProducts, getSiteSettings } from '@/lib/services/firestoreService';
import { formatPrice } from '@/types';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

const brandInstructions = `
Чи бол UJ Cosmetic-ийн арьс арчилгаа, гоо сайхан, эрүүл мэндийн нэмэлт бүтээгдэхүүний борлуулалтын зөвлөх.
UJ Cosmetic нь Солонгосоос Монгол руу чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүн санал болгодог premium онлайн дэлгүүр.

Дүрэм:
- Монгол хэлээр, найрсаг, дулаан, дээд зэрэглэлийн харилцаатай ярь.
- Хэт урт биш, 2-5 богино догол мөрөөр тодорхой зөвлө.
- Pepe Juice, DJ Carbon Therapy зэрэг барааг тохиромжтой үед санал болго.
- Хэрэглэх дараалал, давтамж, юутай хослуулахыг энгийнээр тайлбарла.
- Бүтээгдэхүүний найрлага, заавар product context-д байхгүй бол зохиож болохгүй. "Дэлгэрэнгүй найрлагыг бүтээгдэхүүний хуудсаас шалгаарай" гэж хэл.
- Арьс улайх, хорсох, тууралт гарах, жирэмсэн/хөхүүл үе, архаг өвчин, эм хэрэглэж байгаа тохиолдолд эмч/мэргэжилтнээс зөвлөгөө авахыг эелдгээр сануул.
- Захиалга, хүргэлт, төлбөрийн тухай асуувал UJ Cosmetic-ийн мэдээллээр хариул.
- Ярианы төгсгөлд хэрэглэгчийн арьсны төрөл, гол асуудал, төсөв эсвэл хэрэглэх зорилгоос нэгийг нь асууж дараагийн алхам руу зөөлөн чиглүүл.
`.trim();

function cleanText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function productLine(product: any) {
  const name = cleanText(product.name_mn || product.name_en || product.slug);
  const price = formatPrice(Number(product.salePrice ?? product.price ?? 0));
  const stock = product.inStock === false ? 'дууссан' : 'бэлэн';
  const description = cleanText(product.description_mn).slice(0, 220);
  const howToUse = cleanText(product.howToUse).slice(0, 180);
  return `- ${name} (${price}, ${stock})${description ? `: ${description}` : ''}${howToUse ? ` Хэрэглэх: ${howToUse}` : ''}`;
}

async function buildContext() {
  const [settingsResult, productsResult] = await Promise.allSettled([
    getSiteSettings(),
    getAllProducts({ published: true }),
  ]);

  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const featuredProducts = products
    .filter(product => product.inStock !== false)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 14);

  const productContext = featuredProducts.length
    ? featuredProducts.map(productLine).join('\n')
    : [
        '- Pepe Juice: Солонгос чанартай арьс арчилгаа/дотор гоо сайхны чиглэлийн бүтээгдэхүүн. Дэлгэрэнгүй найрлага, хэрэглэх зааврыг бүтээгдэхүүний хуудсаас шалгаарай.',
        '- DJ Carbon Therapy: арьс арчилгааны premium бүтээгдэхүүн. Дэлгэрэнгүй найрлага, хэрэглэх зааврыг бүтээгдэхүүний хуудсаас шалгаарай.',
      ].join('\n');

  const storeContext = settings
    ? `
Дэлгүүрийн мэдээлэл:
- Хүргэлт: ${formatPrice(settings.shippingCost)}${settings.freeShippingThreshold ? `, ${formatPrice(settings.freeShippingThreshold)}-өөс дээш үнэгүй хүргэлт` : ''}
- Утас: ${settings.phone}
- Instagram: ${settings.instagramUrl}
- Имэйл: ${settings.email}
`.trim()
    : '';

  return `${storeContext}\n\nБүтээгдэхүүний лавлах:\n${productContext}`.trim();
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

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages as ChatMessage[] : [];
    const safeMessages = messages
      .filter(message => (message.role === 'assistant' || message.role === 'user') && cleanText(message.text))
      .slice(-10);

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const context = await buildContext();
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
          temperature: 0.72,
          topP: 0.9,
          maxOutputTokens: 720,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || 'Gemini request failed.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();

    if (!text) {
      return NextResponse.json({ error: 'Gemini returned an empty response.' }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('UJ assistant error:', error);
    return NextResponse.json({ error: error?.message || 'AI assistant failed.' }, { status: 500 });
  }
}
