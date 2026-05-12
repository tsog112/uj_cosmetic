'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

const quickQuestions = [
  'Pepe Juice надад тохирох уу?',
  'DJ Carbon Therapy-г яаж хэрэглэх вэ?',
  'Солонгосоос ирдэг нь үнэн үү?',
  'Админтай яаж холбогдох вэ?',
];

function hasAny(text: string, words: string[]) {
  return words.some(word => text.includes(word));
}

function buildFallbackReply(question: string, settings: SiteSettings) {
  const text = question.toLowerCase();
  const phone = settings.phone || 'сайтын холбоо барих дугаар';
  const instagram = settings.instagramUrl || 'Instagram хуудсаар';
  const email = settings.email || 'имэйлээр';

  if (hasAny(text, ['төлбөр', 'төлөх', 'данс', 'банк', 'payment', 'pay'])) {
    return `Төлбөрийг банкны шилжүүлгээр төлнө. Захиалга баталгаажуулах хэсэгт очиход төлөх дүн болон төлбөрийн мэдээлэл харагдана. Гүйлгээний утга дээр захиалгын дугаараа бичвэл админ хурдан тулгаж баталгаажуулна.`;
  }

  if (hasAny(text, ['солонгос', 'korea', 'korean', 'хаанаас', 'ирдэг', 'жинхэнэ', 'original', 'оригинал'])) {
    return 'Тийм ээ, UJ Cosmetic нь Солонгосоос Монгол руу чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүн санал болгодог онлайн дэлгүүрийн концепцтой. Тухайн бүтээгдэхүүний дэлгэрэнгүй мэдээлэл, зураг, тайлбарыг бүтээгдэхүүний хуудсаас шалгаарай. Баталгаажуулах зүйл байвал админтай шууд холбогдоод лавлаж болно.';
  }

  if (hasAny(text, ['админ', 'холбогдох', 'утас', 'дугаар', 'instagram', 'инстаграм', 'email', 'имэйл', 'support'])) {
    return `Админтай ${phone} дугаараар, эсвэл Instagram: ${instagram} хаягаар холбогдож болно. Мөн ${email} хаяг руу бичиж лавлагаа үлдээж болно. Захиалгын дугаар, нэр, утсаа хамт бичвэл илүү хурдан шалгаж өгнө.`;
  }

  if (hasAny(text, ['хүргэл', 'хэзээ', 'хоног', 'delivery', 'shipping'])) {
    return `Хүргэлтийн үнэ ${settings.shippingCost.toLocaleString('mn-MN')}₮. ${settings.freeShippingThreshold.toLocaleString('mn-MN')}₮-өөс дээш захиалгад хүргэлт үнэгүй. Захиалга баталгаажсаны дараа админ хүргэлтийн явцыг танд мэдэгдэнэ.`;
  }

  if (hasAny(text, ['захиал', 'сагс', 'авах', 'order', 'checkout'])) {
    return 'Бүтээгдэхүүнээ сонгоод "Сагсанд хийх" эсвэл "Шууд авах" товч дарна. Дараа нь checkout хэсэгт нэр, утас, хүргэлтийн хаягаа зөв бөглөөд захиалгаа баталгаажуулаарай.';
  }

  if (hasAny(text, ['pepe', 'juice', 'пепе'])) {
    return 'Pepe Juice-г сонирхож байвал таны хэрэглэх зорилгоос шалтгаалаад санал болгоно. Арьсны өнгө, чийгшил, ядралт эсвэл дотор гоо сайхны дэмжлэгийн аль тал дээр анхаарч байгаагаа хэлээрэй. Найрлага, хэрэглэх нарийн зааврыг бүтээгдэхүүний хуудсаас давхар шалгахыг зөвлөе.';
  }

  if (hasAny(text, ['dj', 'carbon', 'карбон'])) {
    return 'DJ Carbon Therapy-г арьсны бохирдол, тослогжилт, нүхжилтийн арчилгаанд сонирхож байгаа бол эхлээд 7 хоногт 1-2 удаа зөөлөн давтамжаар хэрэглэж арьсны хариу урвалыг ажиглаарай. Эмзэг, улаймтгай арьстай бол бага хэсэгт туршиж үзэх нь зүйтэй.';
  }

  if (hasAny(text, ['хуурай', 'тослог', 'холимог', 'эмзэг', 'батга', 'нүхжилт', 'сэвх', 'толбо', 'арьс'])) {
    return 'Арьсны төрөл болон гол асуудлаас хамаараад сонголт өөр байна. Хуурай бол чийгшүүлэх, тослог/нүхжилттэй бол цэвэрлэх ба тэнцвэржүүлэх, эмзэг бол тайвшруулах чиглэлийн бүтээгдэхүүнээс эхлэх нь зөөлөн. Та арьсны төрөл, нас, гол асуудлаа бичвэл илүү ойрхон санал болгож өгье.';
  }

  return 'Ойлголоо. Энэ талаар UJ Cosmetic-ийн бүтээгдэхүүн, захиалга, хүргэлт эсвэл арьс арчилгааны зөвлөгөөний аль талаас нь лавлаж байгаагаа жаахан дэлгэрүүлээд бичээрэй. Таны арьсны төрөл, хайж байгаа үр дүн, сонирхож буй бүтээгдэхүүний нэр байвал илүү оновчтой зөвлөе.';
}

function isLowQualityAiText(text: string) {
  const cyrillicCount = (text.match(/[А-Яа-яӨөҮүЁё]/g) || []).length;
  return text.length < 8 || cyrillicCount < Math.min(12, Math.floor(text.length * 0.2));
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Сайн байна уу. Би UJ Cosmetic-ийн арьс арчилгааны зөвлөх байна. Бүтээгдэхүүн сонголт, хэрэглэх заавар, төлбөр, хүргэлт болон админтай холбогдох мэдээллээр тусалъя.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then(siteSettings => {
        if (siteSettings) setSettings(siteSettings);
      })
      .catch(() => {});
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
    } catch (error) {
      console.error('UJ assistant failed, using local fallback:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: buildFallbackReply(trimmed, settings) }]);
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
        <div className="mb-3 flex h-[min(620px,76vh)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[22px] border border-[#F2A8C8]/60 bg-white shadow-[0_24px_70px_rgba(216,148,172,0.25)]">
          <div className="border-b border-[#F2A8C8]/40 bg-[#FFF8FB] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8B6B78]">UJ Assistant</p>
                <h3 className="mt-1 font-serif text-2xl leading-none text-[#1A1A1A]">Арьс арчилгааны зөвлөх</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#8B6B78] transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A]"
                aria-label="Чат хаах"
              >
                ×
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FFFDFD] px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[84%] whitespace-pre-line rounded-[18px] px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'rounded-br-[6px] bg-[#1A1A1A] text-white'
                      : 'rounded-bl-[6px] bg-[#FFF0F6] text-[#4A3A40]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[84%] rounded-[18px] rounded-bl-[6px] bg-[#FFF0F6] px-4 py-3 text-sm leading-6 text-[#8B6B78]">
                  Танд тохирох зөвлөгөөг бэлдэж байна...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#F2A8C8]/35 bg-white p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map(question => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-[#F2A8C8]/70 px-3 py-2 text-xs text-[#8B6B78] transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A] disabled:opacity-50"
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
                className="h-12 min-w-0 flex-1 rounded-full border border-[#F2A8C8]/70 bg-[#FFF8FB] px-4 text-sm outline-none placeholder:text-[#B79AA6] focus:border-[#FFB7D5] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFB7D5] text-[#1A1A1A] transition-colors hover:bg-[#F2A8C8] disabled:opacity-50"
                aria-label="Илгээх"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M22 2 11 13" />
                  <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs text-[#8B6B78]">
              <Link href="/shop" className="hover:text-[#1A1A1A]">Дэлгүүр үзэх</Link>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#1A1A1A]">
                @{instagramHandle}
              </a>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(prev => !prev)}
        className="ml-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#1A1A1A] text-white shadow-[0_16px_45px_rgba(216,148,172,0.35)] ring-4 ring-[#FFF0F6] transition-transform hover:scale-105"
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
