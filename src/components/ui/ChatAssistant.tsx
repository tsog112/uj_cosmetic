'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getSiteSettings, getAllProducts } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings, Product } from '@/types';

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

const quickQuestions = [
  'Арьсанд тохирох бүтээгдэхүүн санал болго',
  'Хүргэлтийн үнэ хэд вэ?',
  'Төлбөрийг яаж төлөх вэ?',
  'Админтай яаж холбогдох вэ?',
];

function hasAny(text: string, words: string[]) {
  return words.some(w => text.includes(w));
}

/** Find products whose name matches the question */
function findMatchingProducts(question: string, products: Product[]): Product[] {
  const q = question.toLowerCase();
  return products.filter(p => {
    const name = (p.name_mn || p.name_en || '').toLowerCase();
    const slug = (p.slug || '').toLowerCase();
    // check if any 3+ char word in the product name appears in the question
    const words = name.split(/\s+/).filter(w => w.length >= 3);
    return words.some(w => q.includes(w)) || q.includes(slug.replace(/-/g, ' '));
  });
}

function buildProductReply(product: Product): string {
  const name  = product.name_mn || product.name_en || 'Бүтээгдэхүүн';
  const price = product.salePrice
    ? `${product.salePrice.toLocaleString('mn-MN')}₮ (хямдарсан)`
    : `${(product.price || 0).toLocaleString('mn-MN')}₮`;
  const stock   = product.inStock !== false ? 'Бэлэн байгаа' : 'Дууссан';
  const desc    = product.description_mn || '';
  const howTo   = product.howToUse ? `\n\nХэрэглэх заавар: ${product.howToUse}` : '';
  const ingr    = product.ingredients ? `\n\nНайрлага: ${product.ingredients.slice(0, 200)}${product.ingredients.length > 200 ? '…' : ''}` : '';

  return `**${name}**\n\nҮнэ: ${price}\nТөлөв: ${stock}${desc ? `\n\n${desc}` : ''}${howTo}${ingr}`;
}

function buildFallbackReply(question: string, settings: SiteSettings, products: Product[]) {
  const text    = question.toLowerCase();
  const compact = text.replace(/[\s._-]+/g, '');

  // greeting
  if (/^(сайн уу|сайнуу|hi|hello|hey|snu|sainuu)(\?)?$/i.test(compact)) {
    return 'Сайн байна уу. UJ Cosmetic-ийн арьс арчилгааны зөвлөх байна. Бүтээгдэхүүн сонголт, хэрэглэх заавар, төлбөр, хүргэлт болон дэлгүүрийн мэдээллээр тусалъя.';
  }

  // product-specific question
  if (products.length > 0) {
    const matched = findMatchingProducts(question, products);
    if (matched.length === 1) {
      return buildProductReply(matched[0]);
    }
    if (matched.length > 1) {
      const list = matched.slice(0, 4).map(p => `• ${p.name_mn || p.name_en || p.slug}`).join('\n');
      return `Дараах бүтээгдэхүүнүүд таны хайлттай таарч байна:\n\n${list}\n\nДэлгэрэнгүй мэдээллийг /shop хуудаснаас үзнэ үү.`;
    }
  }

  // skin type recommendation
  if (hasAny(text, ['арьс', 'хуурай', 'тосло', 'мэдрэмтгий', 'хутар', 'acne', 'ageing', 'хөгшрөлт', 'тодотгол', 'тунгалаг', 'гялалз'])) {
    const inStock = products.filter(p => p.inStock !== false).slice(0, 3);
    if (inStock.length > 0) {
      const list = inStock.map(p => `• ${p.name_mn || p.name_en}`).join('\n');
      return `Арьс арчилгааны асуудалд зориулж дараах бүтээгдэхүүнийг санал болгож болно:\n\n${list}\n\nТодорхой бүтээгдэхүүний нэрийг бичвэл дэлгэрэнгүй мэдээлэл өгье.`;
    }
    return 'Арьсны төрлөөсөө хамааран зөв бүтээгдэхүүн сонгоход тусалъя. Хуурай, тосло, мэдрэмтгий, эсвэл хутартай гэдгийг хэлбэл оновчтой санал болгоно.';
  }

  // payment
  if (hasAny(text, ['төлбөр', 'данс', 'банк', 'payment', 'шилжүүлэг'])) {
    return `Төлбөрийг банкны шилжүүлгээр төлнө.\n\nБанк: ${settings.bankName}\nДанс: ${settings.bankAccount}\nДанс эзэмшигч: ${settings.bankAccountName}\n\nГүйлгээний утга дээр захиалгын дугаараа бичнэ үү.`;
  }

  // contact
  if (hasAny(text, ['админ', 'холбогдох', 'утас', 'instagram', 'имэйл'])) {
    return `Дараах сувгаар холбогдоно уу:\n\nУтас: ${settings.phone}\nInstagram: ${settings.instagramUrl}\nИмэйл: ${settings.email}`;
  }

  // shipping
  if (hasAny(text, ['хүргэлт', 'хэд хоног', 'хэзээ ирэх', 'delivery'])) {
    return `Монгол доторх хүргэлт: ${settings.shippingCost.toLocaleString('mn-MN')}₮.\n${settings.freeShippingThreshold.toLocaleString('mn-MN')}₮-өөс дээш захиалгад хүргэлт үнэгүй.\n\nЗахиалга баталгаажсаны дараа админ хүргэлтийн явцыг мэдэгдэнэ.`;
  }

  // order
  if (hasAny(text, ['захиалах', 'сагс', 'checkout'])) {
    return 'Бүтээгдэхүүнээ сонгоод "Сагсанд хийх" эсвэл "Шууд авах" товч дарна. Дараа нь нэр, утас, хаягаа бөглөөд захиалгаа баталгаажуулаарай.';
  }

  // product list
  if (hasAny(text, ['бүтээгдэхүүн', 'бараа', 'юу байна', 'жагсаалт', 'product'])) {
    if (products.length > 0) {
      const list = products.filter(p => p.inStock !== false).slice(0, 5).map(p => `• ${p.name_mn || p.name_en}`).join('\n');
      return `Одоогийн бэлэн бүтээгдэхүүнүүдийн зарим нь:\n\n${list}\n\nБүгдийг /shop хуудаснаас харна уу.`;
    }
  }

  return 'Ойлголоо. Тодорхой бүтээгдэхүүний нэр эсвэл арьсны асуудлаа бичвэл UJ Cosmetic-ийн мэдээлэл дээр тулгуурлаад хариулъя.';
}

function isLowQualityAiText(text: string) {
  const trimmed = text.trim();
  const cyrillicCount = (trimmed.match(/[А-Яа-яӨөҮүЁё]/g) || []).length;
  const tooLittleMongolian = cyrillicCount < Math.min(12, Math.floor(trimmed.length * 0.2));
  return tooLittleMongolian || trimmed.length < 20;
}

export default function ChatAssistant() {
  const [open,     setOpen]     = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Сайн байна уу. Би UJ Cosmetic-ийн арьс арчилгааны зөвлөх байна. Бүтээгдэхүүн сонголт, хэрэглэх заавар, төлбөр, хүргэлт болон дэлгүүрийн мэдээллээр тусалъя.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      getSiteSettings().catch(() => null),
      getAllProducts({ published: true }).catch(() => [] as Product[]),
    ]).then(([s, p]) => {
      if (s) setSettings(s);
      setProducts(p);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, sending]);

  const instagramHandle = useMemo(
    () => settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic',
    [settings.instagramUrl]
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages: Message[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.text || isLowQualityAiText(data.text)) {
        throw new Error(data?.error || 'AI response was not usable');
      }

      setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
    } catch {
      const fallback = buildFallbackReply(trimmed, settings, products);
      setMessages(prev => [...prev, { role: 'assistant', text: fallback }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-[92px] right-4 z-50 md:bottom-7 md:right-7">
      {open && (
        <div className="mb-3 flex h-[min(620px,76vh)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[22px] border border-border-faint bg-white shadow-brand-xl">
          {/* Header */}
          <div className="border-b border-border-faint bg-sand px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-subtle">UJ Assistant</p>
                <h3 className="mt-1 font-serif text-2xl leading-none text-charcoal">Арьс арчилгааны зөвлөх</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-blush hover:text-charcoal"
                aria-label="Чат хаах"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FFFDFD] px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[84%] whitespace-pre-line rounded-[18px] px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'rounded-br-[6px] bg-charcoal text-white'
                      : 'rounded-bl-[6px] bg-blush text-charcoal'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[84%] rounded-[18px] rounded-bl-[6px] bg-blush px-4 py-3 text-sm leading-6 text-text-subtle">
                  Танд тохирох зөвлөгөөг бэлдэж байна...
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border-faint bg-white p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map(question => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-border-light px-3 py-2 text-xs text-text-subtle transition-colors hover:bg-blush hover:text-charcoal disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Асуултаа бичээрэй..."
                disabled={sending}
                className="h-12 min-w-0 flex-1 rounded-full border border-border-light bg-sand px-4 text-sm outline-none placeholder:text-text-faint focus:border-dusty-rose disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dusty-rose text-white transition-colors hover:bg-charcoal disabled:opacity-50"
                aria-label="Илгээх"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M22 2 11 13" />
                  <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs text-text-subtle">
              <Link href="/shop" className="hover:text-charcoal">Дэлгүүр үзэх</Link>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-charcoal">
                @{instagramHandle}
              </a>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(prev => !prev)}
        className="ml-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-charcoal text-white shadow-brand-xl ring-4 ring-blush transition-transform hover:scale-105"
        aria-label={open ? 'Чат хаах' : 'Чат нээх'}
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" aria-hidden="true">
            <path d="M5 5.5h14a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2H10l-5 3v-12a2 2 0 0 1 2-2Z" />
            <path d="M12 8.2l.55 1.35L14 10.1l-1.45.55L12 12l-.55-1.35L10 10.1l1.45-.55L12 8.2Z" fill="currentColor" stroke="none" />
            <path d="M16.2 11.4l.35.85.85.35-.85.35-.35.85-.35-.85-.85-.35.85-.35.35-.85Z" fill="currentColor" stroke="none" />
            <path d="M8 13.5h4.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
