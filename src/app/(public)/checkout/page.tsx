'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/types';
import { createOrder } from '@/lib/services/firestoreService';
import Link from 'next/link';
import AuthGuard from '@/components/ui/AuthGuard';

function CheckoutContent() {
  const router = useRouter();
  const { items, cartTotal, cartSubtotal, shippingCost, clearCart, isHydrated } = useCart();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  if (!isHydrated) return null;

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
        shippingCost: shippingCost,
        total: cartTotal,
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        note: formData.note,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        bankTransferRef: '',
      });

      // Call API to send admin email (fire-and-forget — don't block checkout on email failure)
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
        })
      } catch (emailErr) {
        console.warn('Admin email notification failed (non-blocking):', emailErr)
      }

      clearCart();
      router.push(`/checkout/success?order=${orderId}`);
    } catch (error: any) {
      console.error("Error saving order:", error);
      alert(error.message || "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 md:py-20">
      <h1 className="section-heading text-3xl md:text-4xl mb-10">Захиалга баталгаажуулах</h1>

      <div className="mb-10 border border-border bg-white p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted">
            Захиалгын хураангуй
          </h2>
          {items.length === 1 ? (
            <span className="text-xs font-medium text-accent">Шууд худалдан авах</span>
          ) : (
            <span className="text-xs text-text-muted">{items.length} бүтээгдэхүүн</span>
          )}
        </div>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.product.id} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-primary">
                {item.product.name_mn} x {item.quantity}
              </span>
              <span className="font-medium text-text-primary">
                {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
        {/* Form */}
        <div>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-text-primary mb-2">Нэр *</label>
                <input type="text" id="customerName" name="customerName" required value={formData.customerName} onChange={handleChange}
                  className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent bg-white" placeholder="Таны нэр" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Имэйл хаяг *</label>
                <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange}
                  className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent bg-white" placeholder="Имэйл хаяг" />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">Утасны дугаар *</label>
              <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent bg-white" placeholder="Утасны дугаар" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">Хүргэлтийн хаяг *</label>
              <textarea id="address" name="address" required value={formData.address} onChange={handleChange} rows={3}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent bg-white resize-none" placeholder="Дүүрэг, хороо, байр, орц, тоот..." />
            </div>
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-text-primary mb-2">Захиалгын тэмдэглэл (заавал биш)</label>
              <textarea id="note" name="note" value={formData.note} onChange={handleChange} rows={2}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent bg-white resize-none" placeholder="Нэмэлт мэдээлэл..." />
            </div>
            <div className="pt-6 border-thin-t md:hidden">
               <button type="submit" disabled={isSubmitting} className="btn-gold w-full py-4 text-center block disabled:opacity-50">
                {isSubmitting ? 'Уншиж байна...' : 'Захиалах'}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-[120px] self-start order-first lg:order-last mb-10 lg:mb-0">
          <div className="bg-cream-dark/50 border border-border p-8">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-6">Таны захиалга</h2>
            <div className="space-y-4 mb-6 pb-6 border-thin-b max-h-[300px] overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-text-primary flex-1 pr-4">{item.product.name_mn} x {item.quantity}</span>
                  <span className="text-text-primary font-medium">{formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}</span>
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
              {isSubmitting ? 'Уншиж байна...' : 'Захиалах'}
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
