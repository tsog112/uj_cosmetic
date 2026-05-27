'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Loader2, QrCode, Smartphone, X } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/services/firestoreService';
import { formatPrice } from '@/types';

type PaymentMethod = 'qpay' | 'bank_transfer';

type QPayInvoice = {
  invoiceId: string;
  qrText: string;
  qrImage: string;
  shortUrl: string;
  urls: Array<{ name: string; description?: string; logo?: string; link: string }>;
};

import { validatePhoneNumber } from '@/lib/phoneUtils';

function validate(data: { customerName: string; email: string; phone: string; address: string }) {
  const errors: Record<string, string> = {};
  if (data.customerName.trim().length < 2) errors.customerName = 'Нэрээ хамгийн багадаа 2 үсгээр оруулна уу.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Зөв имэйл хаяг оруулна уу.';

  // Determine countryCode and localNumber from input phone
  let countryCode = '+976';
  let localNumber = data.phone.replace(/[\s-()]/g, ''); // strip spaces, hyphens, parens
  if (localNumber.startsWith('+')) {
    if (localNumber.startsWith('+82')) {
      countryCode = '+82';
      localNumber = localNumber.slice(3);
    } else if (localNumber.startsWith('+1')) {
      countryCode = '+1';
      localNumber = localNumber.slice(2);
    } else if (localNumber.startsWith('+81')) {
      countryCode = '+81';
      localNumber = localNumber.slice(3);
    } else if (localNumber.startsWith('+976')) {
      countryCode = '+976';
      localNumber = localNumber.slice(4);
    }
  }

  const phoneRes = validatePhoneNumber(countryCode, localNumber);
  if (!phoneRes.isValid) {
    errors.phone = phoneRes.error || 'Утасны дугаар буруу байна.';
  }

  if (data.address.trim().length < 10) errors.address = 'Хүргэлтийн хаягаа дэлгэрэнгүй бичнэ үү.';
  return errors;
}

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, cartTotal, cartSubtotal, shippingCost, clearCart, isHydrated } = useCart();
  const [form, setForm] = useState({ customerName: '', email: '', phone: '', address: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<QPayInvoice | null>(null);
  const [qpayOrderId, setQpayOrderId] = useState('');
  const [qpayError, setQpayError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, customerName: user.displayName || prev.customerName, email: user.email || prev.email }));
  }, [user]);

  useEffect(() => {
    if (!invoice || !qpayOrderId) return;
    const timer = window.setInterval(() => void checkPayment(true), 4000);
    return () => window.clearInterval(timer);
  }, [invoice, qpayOrderId]);

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
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
    } catch (error: any) {
      if (!silent) setQpayError(error.message || 'Төлбөр шалгахад алдаа гарлаа.');
    } finally {
      if (!silent) setChecking(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setQpayError('');
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
        total: cartTotal,
        customerName: form.customerName.trim(),
        customerEmail: form.email.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/[\s-]/g, ''),
        address: form.address.trim(),
        note: form.note.trim(),
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'qpay' ? 'pending' : 'unpaid',
        bankTransferRef: '',
      });

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
    } catch (error: any) {
      setQpayError(error.message || 'Захиалга үүсгэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return <div className="p-4"><div className="h-48 rounded-[24px] animate-shimmer" /></div>;
  }

  if (!items.length && !invoice) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-[var(--color-text-dark)]">Сагс хоосон байна</h1>
        <Link href="/shop" className="mt-5 inline-flex h-12 items-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-extrabold text-white">Дэлгүүр үзэх</Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-5 px-4 pb-[104px]">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Checkout</p>
          <h1 className="mt-1 text-[25px] font-extrabold text-[var(--color-text-dark)]">Захиалга баталгаажуулах</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-medium)]">Хүргэлтийн мэдээллээ шалгаад төлбөрийн хэлбэрээ сонгоно уу.</p>
        </section>

        {qpayError && <div className="rounded-[18px] bg-[var(--status-error-bg)] p-3 text-[12px] font-bold text-[var(--status-error)]">{qpayError}</div>}

        <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <h2 className="text-[16px] font-extrabold text-[var(--color-text-dark)]">Хүргэлтийн мэдээлэл</h2>
          <Field label="Нэр" error={errors.customerName}><input value={form.customerName} onChange={(e) => update('customerName', e.target.value)} className="field" placeholder="Таны нэр" /></Field>
          <Field label="Имэйл" error={errors.email}><input value={form.email} onChange={(e) => update('email', e.target.value)} className="field" placeholder="example@mail.com" /></Field>
          <Field label="Утас" error={errors.phone}><input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="field" placeholder="99112233" /></Field>
          <Field label="Хаяг" error={errors.address}><textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={3} className="field resize-none" placeholder="Дүүрэг, хороо, байр, тоот..." /></Field>
          <Field label="Нэмэлт тэмдэглэл"><textarea value={form.note} onChange={(e) => update('note', e.target.value)} rows={2} className="field resize-none" placeholder="Хүргэлтийн нэмэлт мэдээлэл" /></Field>
        </section>

        <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <h2 className="mb-3 text-[16px] font-extrabold text-[var(--color-text-dark)]">Төлбөр</h2>
          <div className="grid grid-cols-2 gap-2">
            <PaymentButton active={paymentMethod === 'qpay'} icon={<QrCode size={18} />} title="QPay" onClick={() => setPaymentMethod('qpay')} />
            <PaymentButton active={paymentMethod === 'bank_transfer'} icon={<Building2 size={18} />} title="Данс" onClick={() => setPaymentMethod('bank_transfer')} />
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <h2 className="mb-3 text-[16px] font-extrabold text-[var(--color-text-dark)]">Захиалгын дүн</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[var(--color-soft-pink)]">
                  <Image src={item.product.images?.[0] || '/placeholder-product.svg'} alt={item.product.name_mn} fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{item.product.name_mn}</p>
                  <p className="mt-1 text-[12px] text-[var(--color-text-medium)]">{item.quantity} ширхэг</p>
                </div>
                <p className="text-[13px] font-extrabold">{formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#f8dbe8] pt-4 text-[13px]">
            <div className="flex justify-between"><span className="text-[var(--color-text-medium)]">Барааны дүн</span><strong>{formatPrice(cartSubtotal)}</strong></div>
            <div className="flex justify-between"><span className="text-[var(--color-text-medium)]">Хүргэлт</span><strong>{shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}</strong></div>
            <div className="flex justify-between text-[18px]"><span className="font-extrabold">Нийт</span><strong className="text-[var(--color-primary)]">{formatPrice(cartTotal)}</strong></div>
          </div>
        </section>

        <button disabled={isSubmitting} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-white shadow-lg disabled:opacity-60">
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {paymentMethod === 'qpay' ? 'QPay төлбөр үүсгэх' : 'Захиалга баталгаажуулах'}
        </button>
      </form>

      {invoice && <QPaySheet invoice={invoice} amount={cartTotal} error={qpayError} checking={checking} onClose={() => setInvoice(null)} onCheck={() => void checkPayment(false)} />}
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-extrabold text-[var(--color-text-medium)]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-bold text-[var(--status-error)]">{error}</span>}
    </label>
  );
}

function PaymentButton({ active, icon, title, onClick }: { active: boolean; icon: React.ReactNode; title: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex h-12 items-center justify-center gap-2 rounded-full text-[13px] font-extrabold ${active ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-brand-bg)] text-[var(--color-text-dark)]'}`}>{icon}{title}</button>;
}

function QPaySheet({ invoice, amount, error, checking, onClose, onCheck }: { invoice: QPayInvoice; amount: number; error: string; checking: boolean; onClose: () => void; onCheck: () => void }) {
  const qrImage = invoice.qrImage ? (invoice.qrImage.startsWith('data:') ? invoice.qrImage : `data:image/png;base64,${invoice.qrImage}`) : '';
  return (
    <div className="fixed inset-0 z-[120] flex items-end bg-black/35 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[30px] bg-white p-5 pb-[env(safe-area-inset-bottom)]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold">QPay төлбөр</h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-medium)]">{formatPrice(amount)}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[var(--color-soft-pink)] p-2"><X size={18} /></button>
        </div>
        <div className="mx-auto flex max-w-[280px] items-center justify-center rounded-[24px] bg-[var(--color-brand-bg)] p-4">
          {qrImage ? <img src={qrImage} alt="QPay QR" className="aspect-square w-full object-contain" /> : <QrCode size={72} className="text-[var(--color-primary)]" />}
        </div>
        {error && <p className="mt-4 rounded-[18px] bg-[var(--status-error-bg)] p-3 text-[12px] font-bold text-[var(--status-error)]">{error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {invoice.shortUrl && <a href={invoice.shortUrl} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-soft-pink)] text-[12px] font-extrabold"><Smartphone size={16} /> Аппаар нээх</a>}
          <button onClick={onCheck} disabled={checking} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] text-[12px] font-extrabold text-white disabled:opacity-60">{checking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Шалгах</button>
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
