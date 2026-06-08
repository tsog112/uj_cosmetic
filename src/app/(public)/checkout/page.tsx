'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Loader2, QrCode, Smartphone, X } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import AddressSelector, { type AddressSnapshot } from '@/components/ui/AddressSelector';
import KoreanAddressSelector, { type KoreanAddressSnapshot } from '@/components/ui/KoreanAddressSelector';
import PhoneInput, { validatePhoneField } from '@/components/ui/PhoneInput';
import FormErrorSummary from '@/components/ui/FormErrorSummary';
import CurrencyToggle from '@/components/ui/CurrencyToggle';
import SegmentedControl from '@/components/ui/SegmentedControl';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useMarket } from '@/context/MarketContext';
import { toE164 } from '@/lib/currency';
import type { CountryCode } from '@/lib/phoneUtils';
import { createOrder } from '@/lib/services/firestoreService';
import { checkoutScrollPadClass, shopStickyFooterClass } from '@/lib/layout/shell';

type PaymentMethod = 'qpay' | 'bank_transfer';

type QPayInvoice = {
  invoiceId: string;
  qrText: string;
  qrImage: string;
  shortUrl: string;
  urls: Array<{ name: string; description?: string; logo?: string; link: string }>;
};

type SavedAddress = {
  id: string;
  label?: string;
  region_id?: string;
  district_id?: string;
  khoroo_id?: string;
  regionId?: string;
  districtId?: string;
  khorooId?: string;
  detail?: string;
  full_address?: string;
  fullAddress?: string;
  isDefault?: boolean;
  createdAt?: { toDate?: () => Date } | string;
};

function validateCheckout(data: {
  customerName: string;
  email: string;
  phoneCountry: CountryCode;
  phoneLocal: string;
  address: string;
  market: 'MN' | 'KR';
  hasMnAddress: boolean;
  hasKrAddress: boolean;
}) {
  const errors: Record<string, string> = {};

  if (data.customerName.trim().length < 2) {
    errors.customerName = 'Нэрээ хамгийн багадаа 2 тэмдэгтээр оруулна уу.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Зөв и-мэйл хаяг оруулна уу.';
  }

  const phoneResult = validatePhoneField(data.phoneCountry, data.phoneLocal);
  if (!phoneResult.isValid) {
    errors.phone = phoneResult.error || 'Утасны дугаар буруу байна.';
  }

  if (data.market === 'KR') {
    if (!data.hasKrAddress) {
      errors.address = '한국 배송 주소를 완성해 주세요 (우편번호, 도로명, 상세주소).';
    }
  } else if (!data.hasMnAddress) {
    errors.address = 'Хүргэлтийн хаягаа бүрэн сонгож, дэлгэрэнгүй хэсгийг 5-200 тэмдэгтээр бичнэ үү.';
  }

  return errors;
}

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { deliveryMarket, setDeliveryMarket, displayCurrency, settings, formatMoney } = useMarket();
  const { items, cartSubtotal, clearCart, isHydrated, freeShippingThreshold, shippingCost: mnShippingCost } = useCart();
  const [form, setForm] = useState({ customerName: '', email: '', note: '' });
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(deliveryMarket === 'KR' ? '+82' : '+976');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(deliveryMarket === 'KR' ? 'bank_transfer' : 'qpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<QPayInvoice | null>(null);
  const [qpayOrderId, setQpayOrderId] = useState('');
  const [qpayError, setQpayError] = useState('');
  const [checking, setChecking] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [addressSnapshot, setAddressSnapshot] = useState<AddressSnapshot | null>(null);
  const [koreanAddressSnapshot, setKoreanAddressSnapshot] = useState<KoreanAddressSnapshot | null>(null);
  const [addressLabel, setAddressLabel] = useState('Үндсэн');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [submitHint, setSubmitHint] = useState('');
  const [initialAddressValue, setInitialAddressValue] = useState<{
    regionId?: string;
    districtId?: string;
    khorooId?: string;
    detail?: string;
    label?: string;
  } | null>(null);

  const shippingCost = useMemo(() => {
    if (deliveryMarket === 'KR') {
      const threshold = settings.krFreeShippingThreshold;
      const cost = settings.krShippingCost;
      return cartSubtotal >= threshold ? 0 : cost;
    }
    return cartSubtotal >= freeShippingThreshold ? 0 : mnShippingCost;
  }, [deliveryMarket, cartSubtotal, freeShippingThreshold, mnShippingCost, settings]);

  const finalTotal = Math.max(0, cartSubtotal - discountAmount) + shippingCost;

  const orderTotalLabel = useMemo(() => {
    const label = formatMoney(finalTotal);
    if (appliedPromo) return `${label} · ${appliedPromo}`;
    return label;
  }, [appliedPromo, finalTotal, formatMoney]);

  useEffect(() => {
    setPhoneCountry(deliveryMarket === 'KR' ? '+82' : '+976');
    if (deliveryMarket === 'KR') {
      setPaymentMethod('bank_transfer');
      setAddressSnapshot(null);
    } else {
      setKoreanAddressSnapshot(null);
    }
  }, [deliveryMarket]);

  useEffect(() => {
    if (!user) return;

    const loadSavedAddresses = async () => {
      try {
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
        const db = getFirestore();
        const q = query(collection(db, 'user_addresses'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as SavedAddress))
          .sort((a, b) => {
            const aTime = a.createdAt && typeof a.createdAt !== 'string' && a.createdAt.toDate
              ? a.createdAt.toDate().getTime()
              : new Date((a.createdAt as string) || 0).getTime();
            const bTime = b.createdAt && typeof b.createdAt !== 'string' && b.createdAt.toDate
              ? b.createdAt.toDate().getTime()
              : new Date((b.createdAt as string) || 0).getTime();
            return bTime - aTime;
          });

        setSavedAddresses(list);

        const defaultAddress = list.find((address) => address.isDefault) || list[0];
        if (defaultAddress) {
          hydrateAddress(defaultAddress);
        }
      } catch (error) {
        console.error('Failed to load user addresses:', error);
      }
    };

    void loadSavedAddresses();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: user.displayName || prev.customerName,
      email: user.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!invoice || !qpayOrderId) return;
    const timer = window.setInterval(() => void checkPayment(true), 4000);
    return () => window.clearInterval(timer);
  }, [invoice, qpayOrderId]);

  const hydrateAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    const regionId = address.region_id || address.regionId || '';
    const districtId = address.district_id || address.districtId || '';
    const khorooId = address.khoroo_id || address.khorooId || '';
    const detail = String(address.detail || '').trim();
    const full = String(address.full_address || address.fullAddress || '').trim();

    setInitialAddressValue({
      regionId,
      districtId,
      khorooId,
      detail,
      label: address.label,
    });
    setAddressLabel(address.label || 'Үндсэн');

    if (regionId && districtId && khorooId && detail.length >= 5) {
      setAddressSnapshot({
        region_id: regionId,
        district_id: districtId,
        khoroo_id: khorooId,
        region: '',
        district: '',
        district_short: '',
        khoroo: '',
        detail,
        full: full || detail,
      });
    } else {
      setAddressSnapshot(null);
    }
  };

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);

    if (!addressId) {
      setInitialAddressValue(null);
      setAddressSnapshot(null);
      return;
    }

    const selected = savedAddresses.find((address) => address.id === addressId);
    if (selected) hydrateAddress(selected);
  };

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePhoneChange = (code: CountryCode, local: string) => {
    setPhoneCountry(code);
    setPhoneLocal(local);
    setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const applyPromoCode = async () => {
    setPromoError('');
    const code = promoInput.trim();
    if (!code) {
      setPromoError('Урамшууллын код оруулна уу.');
      return;
    }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: Math.round(cartSubtotal) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid) {
        setDiscountAmount(Number(data.discount || 0));
        setAppliedPromo(data.code);
        return;
      }
      setPromoError(data.error || 'Урамшууллын код олдсонгүй.');
      setAppliedPromo('');
      setDiscountAmount(0);
    } catch {
      setPromoError('Код шалгахад алдаа гарлаа. Дахин оролдоно уу.');
      setAppliedPromo('');
      setDiscountAmount(0);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo('');
    setPromoInput('');
    setDiscountAmount(0);
    setPromoError('');
  };

  const checkPayment = async (silent = false) => {
    if (!qpayOrderId) return;
    if (!silent) {
      setChecking(true);
      setQpayError('');
    }

    try {
      const response = await fetch('/api/qpay/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: qpayOrderId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Төлбөр шалгахад алдаа гарлаа.');

      if (data.paid) {
        clearCart();
        router.push(`/checkout/success?order=${qpayOrderId}&payment=qpay`);
      } else if (!silent) {
        setQpayError('Төлбөр хараахан баталгаажаагүй байна. Төлсний дараа дахин шалгана уу.');
      }
    } catch (error: unknown) {
      if (!silent) {
        setQpayError(error instanceof Error ? error.message : 'Төлбөр шалгахад алдаа гарлаа.');
      }
    } finally {
      if (!silent) setChecking(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitHint('');

    const hasMnAddress = Boolean(
      addressSnapshot &&
      addressSnapshot.region_id &&
      addressSnapshot.district_id &&
      addressSnapshot.khoroo_id &&
      addressSnapshot.detail.length >= 5 &&
      addressSnapshot.detail.length <= 200,
    );
    const hasKrAddress = Boolean(
      koreanAddressSnapshot &&
      koreanAddressSnapshot.zonecode &&
      koreanAddressSnapshot.roadAddress &&
      koreanAddressSnapshot.detail.length >= 3,
    );

    const nextErrors = validateCheckout({
      ...form,
      phoneCountry,
      phoneLocal,
      address: addressSnapshot?.full || koreanAddressSnapshot?.full || '',
      market: deliveryMarket,
      hasMnAddress,
      hasKrAddress,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstError = Object.values(nextErrors)[0] || 'Захиалгын мэдээлэл дутуу байна.';
      setSubmitHint(firstError);
      toast(firstError, 'error');
      const targetId = nextErrors.address
        ? 'checkout-address'
        : nextErrors.customerName || nextErrors.phone || nextErrors.email
          ? 'checkout-contact'
          : 'checkout-errors';
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setQpayError('');

    const resolvedSnapshot = deliveryMarket === 'KR' ? koreanAddressSnapshot : addressSnapshot;
    const fullAddress = resolvedSnapshot?.full || '';

    try {
      const orderId = await createOrder({
        userId: user?.uid || 'anonymous',
        items: items.map((item) => ({
          productId: item.product.id,
          productSlug: item.product.slug,
          name_mn: item.product.name_mn,
          price: item.product.salePrice ?? item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.images?.[0] || '',
        })),
        subtotal: cartSubtotal,
        shippingCost,
        total: finalTotal,
        customerName: form.customerName.trim(),
        customerEmail: form.email.trim(),
        email: form.email.trim(),
        phone: toE164(phoneCountry, phoneLocal),
        phoneCountry,
        phoneLocal: phoneLocal.replace(/\D/g, ''),
        address: fullAddress,
        note: form.note.trim(),
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'qpay' ? 'pending' : 'unpaid',
        bankTransferRef: '',
        promoCode: appliedPromo || null,
        discount: discountAmount,
        addressSnapshot: resolvedSnapshot,
        market: deliveryMarket,
        currency: displayCurrency,
      } as any);

      if (user && saveToProfile && addressSnapshot && deliveryMarket === 'MN') {
        try {
          const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
          const db = getFirestore();
          await addDoc(collection(db, 'user_addresses'), {
            userId: user.uid,
            label: addressLabel || 'Үндсэн',
            region_id: addressSnapshot.region_id,
            district_id: addressSnapshot.district_id,
            khoroo_id: addressSnapshot.khoroo_id,
            regionId: addressSnapshot.region_id,
            districtId: addressSnapshot.district_id,
            khorooId: addressSnapshot.khoroo_id,
            detail: addressSnapshot.detail,
            full_address: addressSnapshot.full,
            fullAddress: addressSnapshot.full,
            isDefault: savedAddresses.length === 0,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Failed to save new user address:', error);
        }
      }

      if (paymentMethod === 'qpay') {
        const response = await fetch('/api/qpay/invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'QPay нэхэмжлэл үүсгэхэд алдаа гарлаа.');
        setQpayOrderId(orderId);
        setInvoice(data);
        return;
      }

      clearCart();
      router.push(`/checkout/success?order=${orderId}`);
    } catch (error: unknown) {
      setQpayError(error instanceof Error ? error.message : 'Захиалга үүсгэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <main className="luxury-shell pb-[104px]">
        <div className="luxury-card space-y-4 p-5">
          <div className="h-5 w-32 rounded-full animate-shimmer" />
          <div className="h-24 rounded-[20px] animate-shimmer" />
          <div className="h-24 rounded-[20px] animate-shimmer" />
        </div>
      </main>
    );
  }

  if (!items.length && !invoice) {
    return (
      <main className="luxury-shell pb-[104px]">
        <section className="luxury-card px-6 py-14 text-center">
          <p className="luxury-eyebrow">Checkout</p>
          <h1 className="luxury-title mt-3">Сагс хоосон байна</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Сонгосон бүтээгдэхүүнээ сагсанд нэмээд захиалгаа үргэлжлүүлээрэй.
          </p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white">
            Дэлгүүр үзэх
          </Link>
        </section>
      </main>
    );
  }

  return (
    <>
      <form
        id="checkout-form"
        onSubmit={submit}
        className={`mx-auto w-full max-w-[760px] space-y-3 px-4 pt-3 md:space-y-4 md:px-5 md:pt-6 ${checkoutScrollPadClass}`}
      >
        <section className="px-0.5">
          <p className="luxury-eyebrow">Secure checkout</p>
          <h1 className="luxury-title mt-1.5 text-[1.45rem] leading-tight md:text-[1.75rem]">Захиалга баталгаажуулах</h1>
        </section>

        <section className="luxury-card p-3.5 md:p-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Хүргэлтийн бүс</p>
              <SegmentedControl
                value={deliveryMarket}
                options={[
                  { value: 'MN', label: 'Монгол', shortLabel: 'Монгол' },
                  { value: 'KR', label: 'Солонгос', shortLabel: 'Солонгос' },
                ]}
                onChange={setDeliveryMarket}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Үнийн валют</p>
              <CurrencyToggle compact />
            </div>
          </div>
          <p className="mt-2.5 text-[11px] leading-5 text-[var(--color-text-muted)]">
            {deliveryMarket === 'KR'
              ? 'Солонгос хаяг, дугаар, банкны данс.'
              : 'Монгол хаяг, QPay эсвэл МН данс.'}
          </p>
        </section>

        <FormErrorSummary errors={errors} />

        {qpayError && (
          <div id="checkout-errors" className="rounded-[18px] border border-[#F4B8B8] bg-[#FCEBEB] p-4 text-sm font-semibold text-[#A32D2D]">
            {qpayError}
          </div>
        )}

        <section id="checkout-contact" className="luxury-card p-4 md:p-5">
          <SectionHeading eyebrow="Contact" title="Хүлээн авагч" />
          <div className="mt-3 space-y-3">
            <Field label="Нэр" error={errors.customerName}>
              <input value={form.customerName} onChange={(event) => update('customerName', event.target.value)} className="luxury-field" placeholder="Таны нэр" autoComplete="name" />
            </Field>
            <Field label="И-мэйл" error={errors.email}>
              <input value={form.email} onChange={(event) => update('email', event.target.value)} className="luxury-field" placeholder="example@mail.com" inputMode="email" autoComplete="email" />
            </Field>
            <Field label="Утас">
              <PhoneInput
                countryCode={phoneCountry}
                localNumber={phoneLocal}
                onChange={handlePhoneChange}
                market={deliveryMarket}
                error={errors.phone}
              />
            </Field>
          </div>
        </section>

        <section id="checkout-address" className="luxury-card p-4 md:p-5">
          <SectionHeading
            eyebrow="Delivery"
            title={deliveryMarket === 'KR' ? '한국 배송 주소' : 'Хүргэлтийн хаяг'}
          />

          {deliveryMarket === 'MN' && user && savedAddresses.length > 0 && (
            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Хадгалсан хаяг</label>
              <select value={selectedAddressId} onChange={(event) => handleSelectSavedAddress(event.target.value)} className="luxury-field">
                <option value="">Шинэ хаяг оруулах</option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label || 'Хаяг'} {address.fullAddress || address.full_address ? `- ${address.fullAddress || address.full_address}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {deliveryMarket === 'KR' ? (
              <KoreanAddressSelector
                onAddressChange={(snapshot) => {
                  setKoreanAddressSnapshot(snapshot);
                  setErrors((prev) => ({ ...prev, address: '' }));
                }}
                error={errors.address}
              />
            ) : (
              <>
                <AddressSelector
                  key={selectedAddressId || 'new'}
                  initialValue={initialAddressValue || undefined}
                  onAddressChange={(snapshot, label) => {
                    setAddressSnapshot(snapshot);
                    setAddressLabel(label);
                    setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                />
                {errors.address && <p className="px-1 text-xs font-semibold text-[#A32D2D]">{errors.address}</p>}
              </>
            )}
          </div>

          {deliveryMarket === 'MN' && user && !selectedAddressId && (
            <label className="mt-4 flex min-h-11 items-center gap-3 rounded-[18px] border border-[#F0E8ED] bg-[#F7F3F5] px-4 text-sm font-medium text-[var(--color-text-primary)]">
              <input type="checkbox" checked={saveToProfile} onChange={(event) => setSaveToProfile(event.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
              Энэ хаягийг профайлд хадгалах
            </label>
          )}

          <Field label="Нэмэлт тэмдэглэл">
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              rows={3}
              className="luxury-field luxury-field--textarea resize-none"
              placeholder="Хүргэлттэй холбоотой нэмэлт мэдээлэл"
            />
          </Field>
        </section>

        <section className="luxury-card p-4 md:p-5">
          <SectionHeading eyebrow="Payment" title="Төлбөрийн хэлбэр" />
          {deliveryMarket === 'KR' ? (
            <div className="mt-4">
              <div className="flex items-start gap-3 rounded-[20px] border border-[var(--color-border)] bg-[#FAF7F8] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-brand)] shadow-sm">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">한국 계좌 이체</p>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--color-text-muted)]">
                    Захиалга үүсгэсний дараа дансны мэдээлэл харагдана.
                  </p>
                  {settings.krBankName && settings.krBankAccount && (
                    <p className="mt-2 rounded-[14px] bg-white px-3 py-2 font-mono text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {settings.krBankName} · {settings.krBankAccount}
                      {settings.krBankAccountName ? ` · ${settings.krBankAccountName}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <PaymentButton active={paymentMethod === 'qpay'} icon={<QrCode size={17} />} title="QPay" onClick={() => setPaymentMethod('qpay')} />
              <PaymentButton active={paymentMethod === 'bank_transfer'} icon={<Building2 size={17} />} title="Банк" onClick={() => setPaymentMethod('bank_transfer')} />
            </div>
          )}
        </section>

        <section className="luxury-card p-4 md:p-5">
          <SectionHeading eyebrow="Order" title="Захиалгын дүн" />
          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[#F7F3F5]">
                  <Image src={item.product.images?.[0] || '/placeholder-product.svg'} alt={item.product.name_mn} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{item.product.name_mn}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.quantity} ширхэг</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  <PriceDisplay amountMnt={(item.product.salePrice ?? item.product.price) * item.quantity} />
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[#F0E8ED] pt-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Урамшууллын код</span>
            {appliedPromo ? (
              <div className="mt-2 flex min-h-12 items-center justify-between rounded-[18px] border border-[#A5D38A] bg-[#EAF3DE] px-4 text-sm font-semibold text-[#3B6D11]">
                <span>10% хөнгөлөлт ашиглагдлаа</span>
                <button type="button" onClick={removePromoCode} className="text-xs text-[var(--color-text-muted)]">Хасах</button>
              </div>
            ) : (
              <div className="mt-2 flex items-stretch gap-2">
                <input
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value)}
                  placeholder="WELCOME10"
                  className="luxury-field min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={applyPromoCode}
                  className="h-12 shrink-0 rounded-[16px] bg-[var(--color-brand)] px-4 text-[13px] font-semibold text-white active:scale-[0.98]"
                >
                  Ашиглах
                </button>
              </div>
            )}
            {promoError && <p className="mt-2 text-xs font-semibold text-[#A32D2D]">{promoError}</p>}
          </div>

          <div className="mt-5 space-y-2 border-t border-[#F0E8ED] pt-5 text-sm">
            <SummaryRow label="Барааны дүн" value={formatMoney(cartSubtotal)} />
            {discountAmount > 0 && <SummaryRow label="Хөнгөлөлт" value={`-${formatMoney(discountAmount)}`} positive />}
            <SummaryRow label="Хүргэлт" value={shippingCost === 0 ? 'Үнэгүй' : formatMoney(shippingCost)} />
            <div className="flex items-center justify-between border-t border-[#F0E8ED] pt-3 text-base font-semibold text-[var(--color-text-primary)]">
              <span>Нийт</span>
              <strong className="text-[17px] text-[var(--color-brand)]">{formatMoney(finalTotal)}</strong>
            </div>
          </div>
        </section>
      </form>

      <div className={`luxury-bottom-bar ${shopStickyFooterClass} px-4 py-2.5`}>
        {submitHint && !Object.keys(errors).length && (
          <p className="mb-2 rounded-[12px] border border-[#F0D4D4] bg-[#FFF8F8] px-3 py-1.5 text-[11px] font-semibold leading-5 text-[#A32D2D]">
            {submitHint}
          </p>
        )}
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-[var(--color-text-muted)]">
          <span>Төлөх дүн</span>
          <strong className="text-[15px] font-bold text-[var(--color-text-primary)]">{orderTotalLabel}</strong>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
          {paymentMethod === 'qpay' ? 'QPay төлбөр үүсгэх' : 'Захиалга баталгаажуулах'}
        </button>
      </div>

      {invoice && (
        <QPaySheet
          invoice={invoice}
          amount={finalTotal}
          error={qpayError}
          checking={checking}
          onClose={() => setInvoice(null)}
          onCheck={() => void checkPayment(false)}
        />
      )}
    </>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="luxury-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-[20px] font-semibold leading-tight text-[var(--color-text-primary)] sm:text-[22px]">{title}</h2>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</span>
      {children}
      {error && <span className="block px-0.5 text-[11px] font-semibold text-[#A32D2D]">{error}</span>}
    </label>
  );
}

function PaymentButton({ active, icon, title, onClick }: { active: boolean; icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11px] font-semibold transition active:scale-[0.98] ${
        active
          ? 'border border-[var(--color-brand)]/30 bg-[#FFF5F9] text-[var(--color-brand)] shadow-[inset_0_0_0_1px_rgba(212,83,126,0.08)]'
          : 'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:bg-[#FAF7F8]'
      }`}
    >
      <span className={active ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'}>{icon}</span>
      {title}
    </button>
  );
}

function SummaryRow({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${positive ? 'text-[#3B6D11]' : 'text-[var(--color-text-muted)]'}`}>
      <span>{label}</span>
      <strong className={positive ? 'text-[#3B6D11]' : 'text-[var(--color-text-primary)]'}>{value}</strong>
    </div>
  );
}

function QPaySheet({
  invoice,
  amount,
  error,
  checking,
  onClose,
  onCheck,
}: {
  invoice: QPayInvoice;
  amount: number;
  error: string;
  checking: boolean;
  onClose: () => void;
  onCheck: () => void;
}) {
  const { formatMoney } = useMarket();
  const qrImage = invoice.qrImage ? (invoice.qrImage.startsWith('data:') ? invoice.qrImage : `data:image/png;base64,${invoice.qrImage}`) : '';

  return (
    <div className="sheet-overlay fixed inset-0 z-[80] flex items-end bg-black/45 backdrop-blur-sm">
      <div className="sheet-enter w-full max-h-[90svh] overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between">
          <div>
            <p className="luxury-eyebrow">QPay</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--color-text-primary)]">Төлбөр төлөх</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{formatMoney(amount)}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F3F5] text-[var(--color-text-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto mt-5 flex max-w-[280px] items-center justify-center rounded-[24px] border border-[#F0E8ED] bg-[#F7F3F5] p-4">
          {qrImage ? <img src={qrImage} alt="QPay QR" className="aspect-square w-full object-contain" /> : <QrCode size={72} className="text-[var(--color-brand)]" />}
        </div>

        {error && <p className="mt-4 rounded-[18px] border border-[#F4B8B8] bg-[#FCEBEB] p-4 text-sm font-semibold text-[#A32D2D]">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {invoice.shortUrl && (
            <a href={invoice.shortUrl} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#F0E8ED] bg-[#F7F3F5] text-sm font-semibold text-[var(--color-text-primary)]">
              <Smartphone size={16} />
              Апп нээх
            </a>
          )}
          <button type="button" onClick={onCheck} disabled={checking} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] text-sm font-semibold text-white disabled:opacity-60">
            {checking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Шалгах
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
