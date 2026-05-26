import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';
import LoadingScreen from '@/components/ui/LoadingScreen';
import CustomCursor from '@/components/ui/CustomCursor';
import './globals.css';

export const metadata: Metadata = {
  title: 'UJ Beauty & Wellness — Тансаг арьс арчилгааг өдөр бүртээ',
  description: 'Солонгосын чанартай гоо сайхан, арьс арчилгаа болон wellness бүтээгдэхүүнийг Монгол хэрэглэгчдэд.',
  keywords: 'UJ Beauty, UJ Cosmetic, Korean beauty Mongolia, skincare Mongolia, арьс арчилгаа',
  openGraph: {
    title: 'UJ Beauty & Wellness',
    description: 'Тансаг арьс арчилгааг өдөр бүртээ — Korean beauty curated for Mongolia',
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
  themeColor: '#E91E8C',
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
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-[100dvh] antialiased" style={{ background: 'var(--color-brand-bg)' }}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <LoadingScreen />
              <CustomCursor />
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
