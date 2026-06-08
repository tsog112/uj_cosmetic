'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, MapPin, Pencil, Search } from 'lucide-react';

export type KoreanAddressSnapshot = {
  type: 'kr';
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  detail: string;
  full: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          buildingName: string;
          userSelectedType: string;
        }) => void;
        width?: string;
        height?: string;
      }) => { embed: (element: HTMLElement) => void; open: () => void };
    };
  }
}

type KoreanAddressSelectorProps = {
  onAddressChange: (snapshot: KoreanAddressSnapshot | null) => void;
  initialDetail?: string;
  error?: string;
};

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-daum-postcode]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Daum script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.dataset.daumPostcode = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Daum postcode script failed to load'));
    document.head.appendChild(script);
  });
}

export default function KoreanAddressSelector({
  onAddressChange,
  initialDetail = '',
  error,
}: KoreanAddressSelectorProps) {
  const [zonecode, setZonecode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [jibunAddress, setJibunAddress] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [detail, setDetail] = useState(initialDetail);
  const [scriptReady, setScriptReady] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const hasBaseAddress = Boolean(zonecode && roadAddress);
  const hasCompleteAddress = hasBaseAddress && detail.trim().length >= 3;

  const emitSnapshot = useCallback(
    (next: {
      zonecode: string;
      roadAddress: string;
      jibunAddress: string;
      buildingName: string;
      detail: string;
    }) => {
      const trimmedDetail = next.detail.trim();
      if (!next.zonecode || !next.roadAddress || trimmedDetail.length < 3) {
        onAddressChange(null);
        return;
      }
      const base = `[${next.zonecode}] ${next.roadAddress}${next.buildingName ? ` ${next.buildingName}` : ''}`;
      onAddressChange({
        type: 'kr',
        zonecode: next.zonecode,
        roadAddress: next.roadAddress,
        jibunAddress: next.jibunAddress,
        buildingName: next.buildingName,
        detail: trimmedDetail,
        full: `${base}, ${trimmedDetail}`,
      });
    },
    [onAddressChange],
  );

  useEffect(() => {
    void loadDaumPostcodeScript()
      .then(() => setScriptReady(true))
      .catch(() => setScriptReady(false));
  }, []);

  useEffect(() => {
    emitSnapshot({ zonecode, roadAddress, jibunAddress, buildingName, detail });
  }, [zonecode, roadAddress, jibunAddress, buildingName, detail, emitSnapshot]);

  const openSearch = async () => {
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) return;
      new window.daum.Postcode({
        oncomplete: (data) => {
          const road = data.roadAddress || data.jibunAddress;
          setZonecode(data.zonecode);
          setRoadAddress(road);
          setJibunAddress(data.jibunAddress || '');
          setBuildingName(data.buildingName || '');
          setManualOpen(false);
        },
      }).open();
    } catch {
      setManualOpen(true);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void openSearch()}
        disabled={!scriptReady}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-brand)]/25 bg-white text-[13px] font-semibold text-[var(--color-brand)] transition hover:border-[var(--color-brand)]/45 hover:bg-[#FFF8FB] active:scale-[0.99] disabled:opacity-50"
      >
        <Search size={15} strokeWidth={2.2} />
        {scriptReady ? '주소 검색' : '주소 검색 ачааллаж байна…'}
      </button>

      {hasBaseAddress && !manualOpen && (
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[#FAF7F8] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-brand)] shadow-sm">
              <MapPin size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {zonecode}
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-[var(--color-text-primary)]">
                {roadAddress}
                {buildingName ? ` · ${buildingName}` : ''}
              </p>
              {detail ? (
                <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{detail}</p>
              ) : (
                <p className="mt-1 text-[12px] text-[#B45309]">상세 주소 оруулна уу</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-text-muted)] shadow-sm transition hover:text-[var(--color-brand)]"
              aria-label="Хаяг засах"
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>
      )}

      {(manualOpen || !hasBaseAddress) && (
        <div className="space-y-3 rounded-[20px] border border-dashed border-[var(--color-border)] bg-white/70 p-4">
          {hasBaseAddress && (
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-brand)]"
            >
              <ChevronDown size={14} className="rotate-180" />
              Хураангуй руу буцах
            </button>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">우편번호</span>
              <input
                value={zonecode}
                onChange={(e) => setZonecode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="luxury-input w-full px-4 text-sm outline-none"
                placeholder="12345"
                inputMode="numeric"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">건물명</span>
              <input
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="luxury-input w-full px-4 text-sm outline-none"
                placeholder="아파트/건물"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">도로명 주소</span>
            <input
              value={roadAddress}
              onChange={(e) => setRoadAddress(e.target.value)}
              className="luxury-input w-full px-4 text-sm outline-none"
              placeholder="서울특별시 …"
            />
          </label>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">상세 주소</span>
        <div className={`luxury-input gap-2 px-4 ${hasCompleteAddress ? 'border-[var(--color-brand)]/30' : ''}`}>
          <MapPin size={15} className="shrink-0 text-[var(--color-brand)]" />
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder="동/호수, 현관 비밀번호"
          />
        </div>
      </label>

      {error && <p className="px-1 text-[11px] font-semibold text-[#A32D2D]">{error}</p>}
    </div>
  );
}
