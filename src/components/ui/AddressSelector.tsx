'use client';

import { useEffect, useMemo, useState } from 'react';

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
  const res = await fetch(url);
  if (!res.ok) throw new Error('Address data failed to load');
  return res.json();
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
  }, [selectedRegionId]);

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
  }, [selectedDistrictId]);

  const currentRegion = useMemo(() => regions.find((item) => item.id === selectedRegionId) || null, [regions, selectedRegionId]);
  const currentDistrict = useMemo(() => districts.find((item) => item.id === selectedDistrictId) || null, [districts, selectedDistrictId]);
  const currentKhoroo = useMemo(() => khoroos.find((item) => item.id === selectedKhorooId) || null, [khoroos, selectedKhorooId]);
  const districtLabel = currentRegion?.type === 'city' ? 'Дүүрэг' : 'Сум';
  const khorooLabel = currentDistrict?.type === 'duureg' ? 'Хороо' : 'Баг';

  const preview = useMemo(() => {
    const parts = [currentRegion?.name_mn, currentDistrict?.name_mn, currentKhoroo?.name_mn, detailAddress.trim()].filter(Boolean);
    return parts.length ? `📍 ${parts.join(', ')}` : '📍 Аймаг/хот сонгоно уу';
  }, [currentRegion, currentDistrict, currentKhoroo, detailAddress]);

  useEffect(() => {
    if (currentRegion && currentDistrict && currentKhoroo && detailAddress.trim().length >= 5) {
      onAddressChange({
        region_id: currentRegion.id,
        district_id: currentDistrict.id,
        khoroo_id: currentKhoroo.id,
        region: currentRegion.name_mn,
        district: currentDistrict.name_mn,
        district_short: currentDistrict.name_short,
        khoroo: currentKhoroo.name_mn,
        detail: detailAddress.trim(),
        full: `${currentRegion.name_mn}, ${currentDistrict.name_mn}, ${currentKhoroo.name_mn}, ${detailAddress.trim()}`,
      }, addressLabel.trim() || 'Гэр');
    } else {
      onAddressChange(null, addressLabel.trim());
    }
  }, [currentRegion, currentDistrict, currentKhoroo, detailAddress, addressLabel, onAddressChange]);

  return (
    <div className="space-y-4 rounded-2xl border border-[#fbeaf0] bg-white p-5 shadow-sm">
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-brand-text)]">Хүргэлтийн хаяг</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Аймаг/Хот">
          <select value={selectedRegionId} onChange={(e) => setSelectedRegionId(e.target.value)} className="field">
            <option value="">Сонгох</option>
            {regions.map((item) => <option key={item.id} value={item.id}>{item.name_mn}</option>)}
          </select>
        </Field>
        <Field label={districtLabel}>
          <select value={selectedDistrictId} disabled={!selectedRegionId} onChange={(e) => setSelectedDistrictId(e.target.value)} className="field disabled:bg-gray-50">
            <option value="">Сонгох</option>
            {districts.map((item) => <option key={item.id} value={item.id}>{item.name_mn}</option>)}
          </select>
        </Field>
        <Field label={khorooLabel}>
          <select value={selectedKhorooId} disabled={!selectedDistrictId} onChange={(e) => setSelectedKhorooId(e.target.value)} className="field disabled:bg-gray-50">
            <option value="">Сонгох</option>
            {khoroos.map((item) => <option key={item.id} value={item.id}>{item.name_mn}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Дэлгэрэнгүй хаяг">
        <textarea
          value={detailAddress}
          onChange={(e) => setDetailAddress(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="Байр, тоот, гудамж, орц гэх мэт"
          className="field min-h-20 rounded-2xl py-3 resize-none"
        />
      </Field>

      <Field label="Хаягийн нэр (заавал биш)">
        <input value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Гэр, ажил..." className="field" />
      </Field>

      <div className="rounded-[10px] border border-[#F4C0D1] bg-[#FBEAF0] px-4 py-3 text-[12px] font-semibold leading-5 text-[#993556]">
        {preview}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label} <span className="text-red-500">*</span></span>
      {children}
    </label>
  );
}
