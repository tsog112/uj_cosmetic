'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_MNT_PER_KRW,
  formatMoney,
  type DeliveryMarket,
  type DisplayCurrency,
} from '@/lib/currency';

type MarketSettings = {
  mntPerKrw: number;
  krShippingCost: number;
  krFreeShippingThreshold: number;
  krBankName: string;
  krBankAccount: string;
  krBankAccountName: string;
};

type MarketContextType = {
  deliveryMarket: DeliveryMarket;
  displayCurrency: DisplayCurrency;
  settings: MarketSettings;
  setDeliveryMarket: (market: DeliveryMarket) => void;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  formatMoney: (amountMnt: number) => string;
  mntPerKrw: number;
};

const STORAGE_MARKET_KEY = 'uj_delivery_market';
const STORAGE_CURRENCY_KEY = 'uj_display_currency';

const defaultSettings: MarketSettings = {
  mntPerKrw: DEFAULT_MNT_PER_KRW,
  krShippingCost: 5000,
  krFreeShippingThreshold: 80000,
  krBankName: '',
  krBankAccount: '',
  krBankAccountName: '',
};

const MarketContext = createContext<MarketContextType | null>(null);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [deliveryMarket, setDeliveryMarketState] = useState<DeliveryMarket>('MN');
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>('MNT');
  const [settings, setSettings] = useState<MarketSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedMarket = localStorage.getItem(STORAGE_MARKET_KEY) as DeliveryMarket | null;
    const savedCurrency = localStorage.getItem(STORAGE_CURRENCY_KEY) as DisplayCurrency | null;
    if (savedMarket === 'MN' || savedMarket === 'KR') setDeliveryMarketState(savedMarket);
    if (savedCurrency === 'MNT' || savedCurrency === 'KRW') setDisplayCurrencyState(savedCurrency);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : {}))
      .then((raw) => {
        const data = (raw || {}) as Record<string, unknown>;
        setSettings({
          mntPerKrw: Number(data.mntPerKrw) > 0 ? Number(data.mntPerKrw) : DEFAULT_MNT_PER_KRW,
          krShippingCost: Number(data.krShippingCost) >= 0 ? Number(data.krShippingCost) : defaultSettings.krShippingCost,
          krFreeShippingThreshold: Number(data.krFreeShippingThreshold) >= 0
            ? Number(data.krFreeShippingThreshold)
            : defaultSettings.krFreeShippingThreshold,
          krBankName: String(data.krBankName || ''),
          krBankAccount: String(data.krBankAccount || ''),
          krBankAccountName: String(data.krBankAccountName || ''),
        });
      })
      .catch(() => {});
  }, [hydrated]);

  const setDeliveryMarket = useCallback((market: DeliveryMarket) => {
    setDeliveryMarketState(market);
    localStorage.setItem(STORAGE_MARKET_KEY, market);
    if (market === 'KR') {
      setDisplayCurrencyState('KRW');
      localStorage.setItem(STORAGE_CURRENCY_KEY, 'KRW');
    }
  }, []);

  const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem(STORAGE_CURRENCY_KEY, currency);
  }, []);

  const formatMoneyFn = useCallback(
    (amountMnt: number) => formatMoney(amountMnt, displayCurrency, settings.mntPerKrw),
    [displayCurrency, settings.mntPerKrw],
  );

  const value = useMemo(
    () => ({
      deliveryMarket,
      displayCurrency,
      settings,
      setDeliveryMarket,
      setDisplayCurrency,
      formatMoney: formatMoneyFn,
      mntPerKrw: settings.mntPerKrw,
    }),
    [deliveryMarket, displayCurrency, settings, setDeliveryMarket, setDisplayCurrency, formatMoneyFn],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error('useMarket must be used within MarketProvider');
  }
  return ctx;
}

export function useMarketOptional() {
  return useContext(MarketContext);
}
