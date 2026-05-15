'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/ui/AuthGuard';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/lib/services/firestoreService';
import { formatPrice } from '@/types';

type FormData = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  note: string;
};

type FormErrors = Record<string, string>;

function validateForm(data: Pick<FormData, 'customerName' | 'email' | 'phone' | 'address'>): FormErrors {
  const errors: FormErrors = {};

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.customerName = 'Нэрээ хамгийн багадаа 2 тэмдэгтээр оруулна уу.';
  }

  if (/\d/.test(data.customerName)) {
    errors.customerName = 'Нэр хэсэгт тоо оруулахгүй.';
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Зөв имэйл хаяг оруулна уу. Жишээ: example@mail.com';
  }

  const phoneClean = data.phone.replace(/[\s-]/g, '');
  if (!phoneClean || !/^[679]\d{7}$/.test(phoneClean)) {
    errors.phone = 'Монгол утасны 8 оронтой дугаар оруулна уу.';
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.address = 'Хүргэлтийн хаягаа арай дэлгэрэнгүй бичнэ үү.';
  }

  return errors;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, cartTotal, cartSubtotal, shippingCost, clearCart, isHydrated } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.displayName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-20 text-center lg:px-10">
        <p className="text-sm text-text-muted">Уншиж байна...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-20 text-center lg:px-10">
        <h1 className="mb-3 font-serif text-3xl text-text-primary">Сагс хоосон байна</h1>
        <Link href="/shop" className="btn-premium mt-6 rounded-full px-10">
          Дэлгүүр рүү буцах
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 140, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = await createOrder({
        userId: user?.uid || 'anonymous',
        items: items.map(item => ({
          productId: item.product.id,
          name_mn: item.product.name_mn,
          price: item.product.salePrice ?? item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.images?.[0] || '',
        })),
        subtotal: cartSubtotal,
        shippingCost,
        total: cartTotal,
        customerName: formData.customerName.trim(),
        customerEmail: formData.email.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/[\s-]/g, ''),
        address: formData.address.trim(),
        note: formData.note.trim(),
        status: 'pending',
        paymentMethod: 'bank_transfer',
        bankTransferRef: '',
      });

      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            customerName: formData.customerName.trim(),
            customerEmail: formData.email.trim(),
            phone: formData.phone,
            address: formData.address,
            items: items.map(item => ({
              name_mn: item.product.name_mn,
              quantity: item.quantity,
              price: item.product.salePrice ?? item.product.price,
            })),
            total: cartTotal,
          }),
        });
      } catch (emailError) {
        console.warn('Admin email notification failed (non-blocking):', emailError);
      }

      clearCart();
      router.push(`/checkout/success?order=${orderId}`);
    } catch (error: any) {
      console.error('Захиалга хадгалахад алдаа гарлаа:', error);
      alert(error.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const inputClass = 'field-control p-3 text-sm';

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-14 pt-24 sm:px-6 lg:px-10 md:py-20">
      <div className="mb-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D994B5]">Checkout</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-charcoal md:text-5xl">
          Захиалга баталгаажуулах
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted">
          Мэдээллээ шалгаад захиалгаа илгээгээрэй. Төлөв шинэчлэгдэх бүрт таны имэйл рүү мэдэгдэл очно.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        <form id="checkout-form" onSubmit={handleSubmit} className="surface-card p-5 shadow-brand-md md:p-7" noValidate>
          <h2 className="mb-6 font-serif text-2xl text-charcoal">Хүргэлтийн мэдээлэл</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Нэр *" error={formErrors.customerName}>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`${inputClass} ${formErrors.customerName ? 'border-red-300' : 'border-border-light'}`}
                placeholder="Таны нэр"
              />
            </Field>

            <Field label="Имэйл хаяг *" error={formErrors.email}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${inputClass} ${formErrors.email ? 'border-red-300' : 'border-border-light'}`}
                placeholder="example@mail.com"
              />
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5">
            <Field label="Утасны дугаар *" error={formErrors.phone}>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputClass} ${formErrors.phone ? 'border-red-300' : 'border-border-light'}`}
                placeholder="99112233"
              />
            </Field>

            <Field label="Хүргэлтийн хаяг *" error={formErrors.address}>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none ${formErrors.address ? 'border-red-300' : 'border-border-light'}`}
                placeholder="Дүүрэг, хороо, байр, орц, тоот..."
              />
            </Field>

            <Field label="Захиалгын тэмдэглэл">
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={2}
                className={`${inputClass} resize-none border-border-light`}
                placeholder="Нэмэлт мэдээлэл байвал бичээрэй..."
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-7 min-h-14 w-full px-6 text-sm shadow-brand-md disabled:opacity-50 lg:hidden"
          >
            {isSubmitting ? 'Захиалга илгээж байна...' : 'Захиалга баталгаажуулах'}
          </button>
        </form>

        <aside className="lg:sticky lg:top-[120px] self-start">
          <div className="rounded-[18px] border border-border-light bg-sand p-6 shadow-[0_18px_50px_rgba(91,46,67,0.08)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D994B5]">Захиалгын дэлгэрэнгүй</h2>

            <div className="mt-6 max-h-[300px] space-y-4 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between gap-4 text-sm">
                  <span className="flex-1 text-charcoal">
                    {item.product.name_mn} <span className="text-text-muted">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-charcoal">
                    {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4 border-t border-border-light pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Барааны дүн</span>
                <span className="font-semibold text-charcoal">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Хүргэлт</span>
                <span className="font-semibold text-charcoal">{shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between border-t border-border-light pt-6">
              <span className="text-sm font-semibold text-charcoal">Төлөх дүн</span>
              <span className="font-serif text-2xl text-[#D994B5]">{formatPrice(cartTotal)}</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="btn-primary mt-7 hidden min-h-14 w-full px-6 text-sm shadow-brand-md disabled:opacity-50 lg:flex"
            >
              {isSubmitting ? 'Захиалга илгээж байна...' : 'Захиалга баталгаажуулах'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-charcoal">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
