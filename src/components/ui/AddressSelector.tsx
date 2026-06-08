'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Region = { id: string; type: 'aimag' | 'city'; name_mn: string; name_short: string };
type District = { id: string; type: 'duureg' | 'sum'; name_mn: string; name_short: string };
type Khoroo = { id: string; type: 'khoroo' | 'bag'; name_mn: string };

export interface AddressSnapshot {
  region_id: string;
  district_id: string;
  khoroo_id: string;
  region: string;
  district: string;
  district_short: string;
  khoroo: string;
  detail: string;
  full: string;
}

interface AddressSelectorProps {
  onAddressChange: (snapshot: AddressSnapshot | null, label: string) => void;
  initialValue?: {
    regionId?: string;
    districtId?: string;
    khorooId?: string;
    detail?: string;
    label?: string;
  };
}

const memoryCache: { regions?: Region[]; districts: Record<string, District[]>; khoroos: Record<string, Khoroo[]> } = {
  districts: {},
  khoroos: {},
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Address data failed to load');
  return response.json();
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label} {!optional && <span className="text-[var(--color-brand)]">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function AddressSelector({ onAddressChange, initialValue }: AddressSelectorProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [khoroos, setKhoroos] = useState<Khoroo[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState(initialValue?.regionId || '');
  const [selectedDistrictId, setSelectedDistrictId] = useState(initialValue?.districtId || '');
  const [selectedKhorooId, setSelectedKhorooId] = useState(initialValue?.khorooId || '');
  const [detailAddress, setDetailAddress] = useState(initialValue?.detail || '');
  const [addressLabel, setAddressLabel] = useState(initialValue?.label || '');

  useEffect(() => {
    let active = true;
    async function loadRegions() {
      const data = memoryCache.regions || await fetchJson<Region[]>('/api/address/regions');
      memoryCache.regions = data;
      if (active) setRegions(data);
    }
    void loadRegions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadDistricts() {
      if (!selectedRegionId) {
        setDistricts([]);
        setSelectedDistrictId('');
        setKhoroos([]);
        setSelectedKhorooId('');
        return;
      }
      const data = memoryCache.districts[selectedRegionId] || await fetchJson<District[]>(`/api/address/districts?region_id=${encodeURIComponent(selectedRegionId)}`);
      memoryCache.districts[selectedRegionId] = data;
      if (active) {
        setDistricts(data);
        if (!data.some((item) => item.id === selectedDistrictId)) {
          setSelectedDistrictId('');
          setSelectedKhorooId('');
          setKhoroos([]);
        }
      }
    }
    void loadDistricts();
    return () => { active = false; };
  }, [selectedRegionId, selectedDistrictId]);

  useEffect(() => {
    let active = true;
    async function loadKhoroos() {
      if (!selectedDistrictId) {
        setKhoroos([]);
        setSelectedKhorooId('');
        return;
      }
      const data = memoryCache.khoroos[selectedDistrictId] || await fetchJson<Khoroo[]>(`/api/address/khoroos?district_id=${encodeURIComponent(selectedDistrictId)}`);
      memoryCache.khoroos[selectedDistrictId] = data;
      if (active) {
        setKhoroos(data);
        if (!data.some((item) => item.id === selectedKhorooId)) setSelectedKhorooId('');
      }
    }
    void loadKhoroos();
    return () => { active = false; };
  }, [selectedDistrictId, selectedKhorooId]);

  const currentRegion = useMemo(() => regions.find((item) => item.id === selectedRegionId) || null, [regions, selectedRegionId]);
  const currentDistrict = useMemo(() => districts.find((item) => item.id === selectedDistrictId) || null, [districts, selectedDistrictId]);
  const currentKhoroo = useMemo(() => khoroos.find((item) => item.id === selectedKhorooId) || null, [khoroos, selectedKhorooId]);
  const districtLabel = currentRegion?.type === 'city' ? 'Дүүрэг' : 'Сум';
  const khorooLabel = currentDistrict?.type === 'duureg' ? 'Хороо' : 'Баг';

  const preview = useMemo(() => {
    const parts = [currentRegion?.name_mn, currentDistrict?.name_mn, currentKhoroo?.name_mn, detailAddress.trim()].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Аймаг/Хот сонгоно уу';
  }, [currentRegion, currentDistrict, currentKhoroo, detailAddress]);

  const onAddressChangeRef = useRef(onAddressChange);
  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  useEffect(() => {
    if (currentRegion && currentDistrict && currentKhoroo && detailAddress.trim().length >= 5) {
      onAddressChangeRef.current({
        region_id: currentRegion.id,
        district_id: currentDistrict.id,
        khoroo_id: currentKhoroo.id,
        region: currentRegion.name_mn,
        district: currentDistrict.name_mn,
        district_short: currentDistrict.name_short,
        khoroo: currentKhoroo.name_mn,
        detail: detailAddress.trim(),
        full: `${currentRegion.name_mn}, ${currentDistrict.name_mn}, ${currentKhoroo.name_mn}, ${detailAddress.trim()}`,
      }, addressLabel.trim() || 'Үндсэн');
    } else {
      onAddressChangeRef.current(null, addressLabel.trim());
    }
  }, [currentRegion, currentDistrict, currentKhoroo, detailAddress, addressLabel]);

  const fieldClass = 'min-h-12 w-full rounded-[14px] border border-[#F0E8ED] bg-white px-4 text-[13px] outline-none transition focus:border-[var(--color-brand)] disabled:bg-[#F7F3F5] disabled:opacity-70';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Аймаг / Хот">
          <select value={selectedRegionId} onChange={(event) => setSelectedRegionId(event.target.value)} className={fieldClass}>
            <option value="">Сонгох</option>
            {regions.map((item) => <option key={item.id} value={item.id}>{item.name_mn}</option>)}
          </select>
        </Field>
        <Field label={districtLabel}>
          <select value={selectedDistrictId} disabled={!selectedRegionId} onChange={(event) => setSelectedDistrictId(event.target.value)} className={fieldClass}>
            <option value="">Сонгох</option>
            {districts.map((item) => <option key={item.id} value={item.id}>{item.name_mn}</option>)}
          </select>
        </Field>
        <Field label={khorooLabel}>
          <select value={selectedKhorooId} disabled={!selectedDistrictId} onChange={(event) => setSelectedKhorooId(event.target.value)} className={fieldClass}>
            <option value="">Сонгох</option>
            {khoroos.map((item) => <option key={item.id} value={item.id}>{item.name_mn}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Дэлгэрэнгүй хаяг">
        <textarea
          value={detailAddress}
          onChange={(event) => setDetailAddress(event.target.value.slice(0, 200))}
          rows={2}
          placeholder="Байр, тоот, гудамж, орц гэх мэт"
          className={`${fieldClass} min-h-20 resize-none py-3`}
        />
      </Field>

      <Field label="Хаягийн нэр" optional>
        <input value={addressLabel} onChange={(event) => setAddressLabel(event.target.value)} placeholder="Гэр, ажил..." className={fieldClass} />
      </Field>

      <div className="rounded-[12px] border border-[var(--color-brand-mid)] bg-[var(--color-brand-light)] px-4 py-3 text-[12px] font-semibold leading-5 text-[var(--color-brand-dark)]">
        {preview}
      </div>
    </div>
  );
}
