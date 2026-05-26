'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { getAllProducts, getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, Product, SiteSettings, formatPrice } from '@/types';

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

const quickQuestions = [
  'Арьсанд тохирох бүтээгдэхүүн санал болго',
  'Хүргэлтийн үнэ хэд вэ?',
  'Төлбөр яаж төлөх вэ?',
  'Админтай яаж холбогдох вэ?',
];

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function findMatchingProducts(question: string, products: Product[]): Product[] {
  const q = question.toLowerCase();
  return products.filter((product) => {
    const name = (product.name_mn || product.name_en || '').toLowerCase();
    const slug = (product.slug || '').toLowerCase().replace(/-/g, ' ');
    const words = name.split(/\s+/).filter((word) => word.length >= 3);
    return words.some((word) => q.includes(word)) || q.includes(slug);
  });
}

function buildProductReply(product: Product): string {
  const name = product.name_mn || product.name_en || 'Бүтээгдэхүүн';
  const stock = product.inStock !== false ? 'Бэлэн байгаа' : 'Дууссан';
  const desc = product.description_mn ? `\n\n${product.description_mn}` : '';
  const howTo = product.howToUse ? `\n\nХэрэглэх заавар: ${product.howToUse}` : '';
  return `${name}\n\nҮнэ: ${formatPrice(product.salePrice ?? product.price)}\nТөлөв: ${stock}${desc}${howTo}`;
}

function buildFallbackReply(question: string, settings: SiteSettings, products: Product[]) {
  const text = question.toLowerCase();

  const matched = findMatchingProducts(question, products);
  if (matched.length === 1) return buildProductReply(matched[0]);
  if (matched.length > 1) {
    return `Таны хайлттай ойролцоо бүтээгдэхүүнүүд:\n\n${matched.slice(0, 4).map((product) => `• ${product.name_mn || product.name_en}`).join('\n')}\n\nДэлгэрэнгүйг дэлгүүр хэсгээс үзээрэй.`;
  }

  if (hasAny(text, ['арьс', 'acne', 'батга', 'хуурай', 'тослог', 'эмзэг', 'нүхжилт', 'толбо'])) {
    const available = products.filter((product) => product.inStock !== false).slice(0, 3);
    if (available.length) {
      return `Таны арьсны хэрэгцээнд дараах бүтээгдэхүүнүүдийг эхлээд үзэхийг санал болгож байна:\n\n${available.map((product) => `• ${product.name_mn || product.name_en}`).join('\n')}\n\nАрьсны төрөл, асуудлаа илүү тодорхой бичвэл илүү оновчтой санал өгье.`;
    }
    return 'Арьсны төрөл, асуудлаа бичвэл тохирох бүтээгдэхүүн санал болгоход тусалъя.';
  }

  if (hasAny(text, ['төлбөр', 'данс', 'банк', 'payment', 'шилжүүлэг'])) {
    return `Төлбөрийг банкны шилжүүлгээр төлнө.\n\nБанк: ${settings.bankName || 'Тохируулаагүй'}\nДанс: ${settings.bankAccount || 'Тохируулаагүй'}\nДанс эзэмшигч: ${settings.bankAccountName || 'Тохируулаагүй'}\n\nГүйлгээний утга дээр захиалгын дугаараа бичээрэй.`;
  }

  if (hasAny(text, ['хүргэлт', 'delivery', 'хэд хоног', 'үнэгүй'])) {
    return `Хүргэлтийн суурь үнэ: ${formatPrice(settings.shippingCost || 0)}\n${formatPrice(settings.freeShippingThreshold || 0)}-өөс дээш захиалгад хүргэлт үнэгүй тооцогдоно.\n\nЗахиалга баталгаажсаны дараа админ хүргэлтийн мэдээллийг мэдэгдэнэ.`;
  }

  if (hasAny(text, ['админ', 'холбогдох', 'утас', 'instagram', 'имэйл', 'email'])) {
    return `UJ Cosmetic-тэй холбогдох:\n\nУтас: ${settings.phone || 'Тохируулаагүй'}\nInstagram: ${settings.instagramUrl || 'Тохируулаагүй'}\nИмэйл: ${settings.email || 'Тохируулаагүй'}`;
  }

  if (hasAny(text, ['захиалах', 'сагс', 'checkout', 'авах'])) {
    return 'Бүтээгдэхүүний дэлгэрэнгүй дээрээс “Сагс” эсвэл “Авах” товч дарна. Дараа нь нэр, утас, хаягаа бөглөөд захиалгаа баталгаажуулна.';
  }

  return 'Ойлголоо. Бүтээгдэхүүн, арьсны төрөл, хүргэлт, төлбөр эсвэл захиалгын талаар асууж болно.';
}

function isLowQualityAiText(text: string) {
  const trimmed = text.trim();
  const mongolianCount = (trimmed.match(/[А-Яа-яӨөҮүЁё]/g) || []).length;
  return trimmed.length < 20 || mongolianCount < Math.min(12, Math.floor(trimmed.length * 0.2));
}

type ChatBodyProps = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: Message[];
  sending: boolean;
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onQuickQuestion: (q: string) => void;
  instagramHandle: string;
  settings: SiteSettings;
};

function ChatBody({ scrollRef, messages, sending, input, setInput, onSubmit, onQuickQuestion, instagramHandle, settings }: ChatBodyProps) {
  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-brand-bg)] px-4 py-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[84%] whitespace-pre-line rounded-[20px] px-4 py-3 text-[13px] leading-6 ${message.role === 'user' ? 'rounded-br-[6px] bg-[var(--color-brand-text)] text-white' : 'rounded-bl-[6px] bg-white text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)]'}`}>
              {message.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-[20px] rounded-bl-[6px] bg-white px-4 py-3 text-[13px] font-bold text-[var(--color-brand-muted)] shadow-[var(--shadow-mobile-card)]">
              Зөвлөгөө бэлдэж байна...
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-[#f8dbe8] bg-white p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {quickQuestions.map((question) => (
            <button key={question} onClick={() => onQuickQuestion(question)} disabled={sending} className="shrink-0 rounded-full bg-[var(--color-brand-secondary)] px-3 py-2 text-[11px] font-extrabold leading-tight text-[var(--color-brand-text)] disabled:opacity-50">
              {question}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Асуултаа бичээрэй..." disabled={sending} className="h-12 min-w-0 flex-1 rounded-full bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none placeholder:text-[var(--color-brand-muted)] focus:ring-2 focus:ring-[#f3b8cf] disabled:opacity-60" />
          <button type="submit" disabled={sending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-white disabled:opacity-50" aria-label="Илгээх">
            <Send size={18} />
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between text-[12px] font-bold text-[var(--color-brand-muted)]">
          <Link href="/shop" className="hover:text-[var(--color-brand-text)]">Дэлгүүр үзэх</Link>
          <a href={settings.instagramUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-brand-text)]">@{instagramHandle}</a>
        </div>
      </div>
    </>
  );
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Сайн байна уу. Би UJ Cosmetic-ийн арьс арчилгааны туслах байна. Бүтээгдэхүүн сонголт, хэрэглэх заавар, хүргэлт, төлбөрийн талаар асуугаарай.' },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      getSiteSettings().catch(() => null),
      getAllProducts({ published: true }).catch(() => [] as Product[]),
    ]).then(([nextSettings, nextProducts]) => {
      if (nextSettings) setSettings(nextSettings);
      setProducts(nextProducts);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, sending]);

  const instagramHandle = useMemo(() => settings.instagramUrl?.split('/').filter(Boolean).pop() || 'uj_cosmetic', [settings.instagramUrl]);

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
      if (!response.ok || !data?.text || isLowQualityAiText(data.text)) throw new Error(data?.error || 'AI response was not usable');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: buildFallbackReply(trimmed, settings, products) }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {/* Mobile: inside shell, above bottom nav */}
      <div className="fixed bottom-[72px] inset-x-0 mx-auto z-[55] w-full max-w-[430px] px-4 pointer-events-none md:hidden">
        {open && (
          <div className="pointer-events-auto mb-3 ml-auto flex h-[min(580px,72dvh)] w-full max-w-[390px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(166,66,112,0.22)]">
            <div className="bg-[var(--color-brand-accent)] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">UJ Assistant</p>
                    <h3 className="mt-1 text-[17px] font-extrabold leading-tight">Арьс арчилгааны зөвлөх</h3>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Чат хаах">
                  <X size={18} />
                </button>
              </div>
            </div>
            <ChatBody
              scrollRef={scrollRef}
              messages={messages}
              sending={sending}
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              onQuickQuestion={sendMessage}
              instagramHandle={instagramHandle}
              settings={settings}
            />
          </div>
        )}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="pointer-events-auto ml-auto flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-white shadow-[0_14px_34px_rgba(228,95,154,0.34)] ring-4 ring-white transition-transform active:scale-95"
          aria-label={open ? 'Чат хаах' : 'Чат нээх'}
        >
          {open ? <X size={24} /> : <MessageCircle size={26} />}
        </button>
      </div>

      {/* Desktop: fixed bottom-right, independent */}
      <div className="fixed bottom-8 right-8 z-[55] hidden pointer-events-none md:flex md:flex-col md:items-end">
        {open && (
          <div className="pointer-events-auto mb-3 flex h-[min(620px,80vh)] w-[380px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(166,66,112,0.22)]">
            <div className="bg-[var(--color-brand-accent)] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">UJ Assistant</p>
                    <h3 className="mt-1 text-[17px] font-extrabold leading-tight">Арьс арчилгааны зөвлөх</h3>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Чат хаах">
                  <X size={18} />
                </button>
              </div>
            </div>
            <ChatBody
              scrollRef={scrollRef}
              messages={messages}
              sending={sending}
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              onQuickQuestion={sendMessage}
              instagramHandle={instagramHandle}
              settings={settings}
            />
          </div>
        )}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="pointer-events-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-white shadow-[0_14px_34px_rgba(228,95,154,0.34)] ring-4 ring-white transition-transform hover:scale-105 active:scale-95"
          aria-label={open ? 'Чат хаах' : 'Чат нээх'}
        >
          {open ? <X size={24} /> : <MessageCircle size={26} />}
        </button>
      </div>
    </>
  );
}
