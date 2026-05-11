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
  'Хүргэлт хэд хоног вэ?',
  'Арьсандаа юу сонгох вэ?',
  'Захиалга яаж өгөх вэ?',
  'Төлбөр яаж хийх вэ?',
];

function buildReply(question: string, settings: SiteSettings) {
  const text = question.toLowerCase();

  if (text.includes('хүргэл') || text.includes('hurgelt') || text.includes('delivery')) {
    return `Хүргэлтийн үнэ ${settings.shippingCost.toLocaleString('mn-MN')}₮. ${settings.freeShippingThreshold.toLocaleString('mn-MN')}₮-өөс дээш захиалгад хүргэлт үнэгүй. Захиалга баталгаажсаны дараа хүргэлтийн мэдээллийг админ танд мэдэгдэнэ.`;
  }

  if (text.includes('төлбөр') || text.includes('банк') || text.includes('payment')) {
    return `Төлбөрийг банкны шилжүүлгээр төлнө. Захиалга үүсгэсний дараа дансны мэдээлэл гарч ирнэ. Гүйлгээний утга дээр захиалгын дугаараа бичвэл баталгаажуулахад хурдан.`;
  }

  if (text.includes('захиал') || text.includes('сагс') || text.includes('order')) {
    return 'Бүтээгдэхүүнээ сонгоод “Сагсанд нэмэх” эсвэл “Шууд худалдан авах” товч дарна. Дараа нь checkout дээр нэр, утас, хаягаа зөв бөглөөд захиалгаа илгээнэ.';
  }

  if (
    text.includes('арьс') ||
    text.includes('хуурай') ||
    text.includes('тослог') ||
    text.includes('эмзэг') ||
    text.includes('батга') ||
    text.includes('сонго')
  ) {
    return 'Арьсны төрлөөс хамаараад сонголт өөр. Хуурай бол чийгшүүлэх тос/серум, тослог бол хөнгөн бүтэцтэй toner/serum, эмзэг бол тайвшруулах найрлагатай бүтээгдэхүүнээс эхлэхийг зөвлөе. Та арьсны төрөл, гол асуудлаа бичвэл илүү нарийн чиглүүлж өгье.';
  }

  if (text.includes('instagram') || text.includes('инстаграм')) {
    return `Манай Instagram хаяг: ${settings.instagramUrl}. Тэнд шинэ бүтээгдэхүүн, хэрэглээний зөвлөгөө, бодит зурагнууд ордог.`;
  }

  if (text.includes('утас') || text.includes('холбог') || text.includes('phone')) {
    return `Та бидэнтэй ${settings.phone} дугаараар эсвэл Instagram-аар холбогдож болно.`;
  }

  return 'Би UJ Cosmetic-ийн туслах байна. Хүргэлт, төлбөр, захиалга, бүтээгдэхүүн сонголтын талаар асуугаарай. Арьсны төрөл болон хайж буй үр дүнгээ бичвэл илүү ойрхон зөвлөгөө өгнө.';
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Сайн байна уу? Би UJ Cosmetic-ийн туслах. Бүтээгдэхүүн сонгох, хүргэлт, төлбөрийн талаар асуугаарай.',
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
  }, [messages, open]);

  const instagramHandle = useMemo(
    () => settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic',
    [settings.instagramUrl]
  );

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages(prev => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: buildReply(trimmed, settings) },
    ]);
    setInput('');
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
                <h3 className="mt-1 font-serif text-2xl leading-none text-[#1A1A1A]">Арьс арчилгааны туслах</h3>
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
                  className={`max-w-[84%] rounded-[18px] px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'rounded-br-[6px] bg-[#1A1A1A] text-white'
                      : 'rounded-bl-[6px] bg-[#FFF0F6] text-[#4A3A40]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#F2A8C8]/35 bg-white p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map(question => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="shrink-0 rounded-full border border-[#F2A8C8]/70 px-3 py-2 text-xs text-[#8B6B78] transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A]"
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
                className="h-12 min-w-0 flex-1 rounded-full border border-[#F2A8C8]/70 bg-[#FFF8FB] px-4 text-sm outline-none placeholder:text-[#B79AA6] focus:border-[#FFB7D5]"
              />
              <button
                type="submit"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFB7D5] text-[#1A1A1A] transition-colors hover:bg-[#F2A8C8]"
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
