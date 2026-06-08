import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { MarketProvider } from '@/context/MarketContext';
import { ToastProvider } from '@/components/ui/Toast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import CustomCursor from '@/components/ui/CustomCursor';
import './globals.css';
import './animations.css';

export const metadata: Metadata = {
  title: 'UJ Beauty & Wellness',
  description: 'Солонгосын гоо сайхан, арьс арчилгаа, wellness бүтээгдэхүүний premium сонголт.',
  keywords: 'UJ Beauty, UJ Cosmetic, Korean beauty Mongolia, skincare Mongolia, арьс арчилгаа',
  openGraph: {
    title: 'UJ Beauty & Wellness',
    description: 'Korean beauty curated for Mongolia.',
    type: 'website',
    locale: 'mn_MN',
    siteName: 'UJ Beauty & Wellness',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#D4537E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap"
        />
      </head>
      <body className="min-h-[100dvh] antialiased" style={{ background: 'var(--color-brand-bg)' }}>
        <AuthProvider>
          <LocaleProvider>
            <MarketProvider>
            <CartProvider>
              <WishlistProvider>
                <NotificationProvider>
                  <ToastProvider>
                    <LoadingScreen />
                    <CustomCursor />
                    {children}
                  </ToastProvider>
                </NotificationProvider>
              </WishlistProvider>
            </CartProvider>
            </MarketProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
