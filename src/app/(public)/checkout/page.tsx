'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/types';
import { createOrder } from '@/lib/services/firestoreService';
import Link from 'next/link';
import AuthGuard from '@/components/ui/AuthGuard';

type FormData = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  note: string;
};

type FormErrors = Record<string, string>;

function validateForm(data: {
  name: string;
  email: string;
  phone: string;
  address: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.customerName = 'Нэр хамгийн багадаа 2 тэмдэгт байх ёстой';
  }
  if (/\d/.test(data.name)) {
    errors.customerName = 'Нэрэнд тоо оруулах боломжгүй';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Зөв имэйл хаяг оруулна уу (example@mail.com)';
  }

  const phoneClean = data.phone.replace(/[\s-]/g, '');
  if (!phoneClean || !/^[679]\d{7}$/.test(phoneClean)) {
    errors.phone = 'Монгол утасны дугаар 8 оронтой байх ёстой (6, 7, 9-ээр эхэлнэ)';
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.address = 'Хүргэлтийн хаягийг дэлгэрэнгүй бичнэ үү (хамгийн багадаа 10 тэмдэгт)';
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
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-20 text-center">
        <p className="text-sm text-text-muted">Уншиж байна...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-20 text-center">
        <h1 className="font-serif text-3xl text-text-primary mb-3">Сагс хоосон байна</h1>
        <Link href="/shop" className="btn-gold px-10 mt-6">Дэлгүүр рүү буцах</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    const errors = validateForm({
      name: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = await createOrder({
        userId: user?.uid || 'anonymous',
        items: items.map(i => ({
          productId: i.product.id,
          name_mn: i.product.name_mn,
          price: i.product.salePrice ?? i.product.price,
          quantity: i.quantity,
          imageUrl: i.product.images?.[0] || '',
        })),
        subtotal: cartSubtotal,
        shippingCost,
        total: cartTotal,
        customerName: formData.customerName,
        phone: formData.phone.replace(/[\s-]/g, ''),
        address: formData.address,
        note: formData.note,
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
            customerName: formData.customerName,
            phone: formData.phone,
            address: formData.address,
            items: items.map(i => ({
              name_mn: i.product.name_mn,
              quantity: i.quantity,
              price: i.product.salePrice ?? i.product.price,
            })),
            total: cartTotal,
          }),
        });
      } catch (emailErr) {
        console.warn('Admin email notification failed (non-blocking):', emailErr);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 md:py-20">
      <h1 className="section-heading text-3xl md:text-4xl mb-10">Захиалга баталгаажуулах</h1>

      <div className="mb-10 border border-border bg-white p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted">
            ТАНЫ ЗАХИАЛГА
          </h2>
          <span className="text-xs text-text-muted">{items.length} бүтээгдэхүүн</span>
        </div>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.product.id} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-primary">
                {item.product.name_mn} × {item.quantity} ширхэг
              </span>
              <span className="font-medium text-text-primary">
                {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
        <div>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-text-primary mb-2">Нэр *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`w-full border p-3 text-sm focus:outline-none focus:border-accent bg-white ${formErrors.customerName ? 'border-red-400' : 'border-border'}`}
                  placeholder="Таны нэр"
                />
                {formErrors.customerName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Имэйл хаяг *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border p-3 text-sm focus:outline-none focus:border-accent bg-white ${formErrors.email ? 'border-red-400' : 'border-border'}`}
                  placeholder="example@mail.com"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">Утасны дугаар *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full border p-3 text-sm focus:outline-none focus:border-accent bg-white ${formErrors.phone ? 'border-red-400' : 'border-border'}`}
                placeholder="99112233"
              />
              {formErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">Хүргэлтийн хаяг *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`w-full border p-3 text-sm focus:outline-none focus:border-accent bg-white resize-none ${formErrors.address ? 'border-red-400' : 'border-border'}`}
                placeholder="Дүүрэг, хороо, байр, орц, тоот..."
              />
              {formErrors.address && (
                <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-text-primary mb-2">Захиалгын тэмдэглэл (заавал биш)</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={2}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent bg-white resize-none"
                placeholder="Нэмэлт мэдээлэл..."
              />
            </div>

            <div className="pt-6 border-thin-t md:hidden">
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full py-4 text-center block disabled:opacity-50">
                {isSubmitting ? 'Захиалга илгээж байна...' : 'ЗАХИАЛАХ'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:sticky lg:top-[120px] self-start order-first lg:order-last mb-10 lg:mb-0">
          <div className="bg-cream-dark/50 border border-border p-8">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-6">Захиалгын дэлгэрэнгүй</h2>
            <div className="space-y-4 mb-6 pb-6 border-thin-b max-h-[300px] overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-text-primary flex-1 pr-4">
                    {item.product.name_mn} × {item.quantity} ширхэг
                  </span>
                  <span className="text-text-primary font-medium">
                    {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-4 mb-6 pb-6 border-thin-b">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Нийт дүн</span>
                <span className="text-text-primary font-medium">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Хүргэлт</span>
                <span className="text-text-primary font-medium">{shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}</span>
              </div>
            </div>
            <div className="flex justify-between mb-8">
              <span className="text-sm font-medium text-text-primary">Төлөх дүн</span>
              <span className="text-lg font-serif font-medium text-accent">{formatPrice(cartTotal)}</span>
            </div>
            <button type="submit" form="checkout-form" disabled={isSubmitting} className="hidden md:block btn-gold w-full py-4 text-center disabled:opacity-50">
              {isSubmitting ? 'Захиалга илгээж байна...' : 'ЗАХИАЛАХ'}
            </button>
          </div>
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
