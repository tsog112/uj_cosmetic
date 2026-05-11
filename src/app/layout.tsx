import type { Metadata } from 'next';
import { EB_Garamond, Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'UJ Cosmetic — Premium Skin Rituals',
  description: 'Солонгосын чанартай гоо сайхан болон эрүүл мэндийн нэмэлт бүтээгдэхүүнийг Монгол хэрэглэгчдэд.',
  keywords: 'UJ Cosmetic, Korean beauty Mongolia, wellness supplements, skincare Mongolia, Солонгос бүтээгдэхүүн',
  openGraph: {
    title: 'UJ Cosmetic — Premium Skin Rituals',
    description: 'Солонгос чанартай бүтээгдэхүүнийг таны гарт.',
    type: 'website',
    locale: 'mn_MN',
    siteName: 'UJ Cosmetic',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" data-scroll-behavior="smooth" className={`${ebGaramond.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
