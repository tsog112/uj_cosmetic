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
  description: 'Curated Korean skincare for the modern minimalist. High-performance formulas, editorial-grade rituals.',
  keywords: 'UJ Cosmetic, Luxury Korean Skincare, Minimalist Beauty, Serum, Toner, Mongolia',
  openGraph: {
    title: 'UJ Cosmetic — Premium Skin Rituals',
    description: 'The intersection of nature and science. Elevate your daily ritual.',
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
    <html lang="mn" className={`${ebGaramond.variable} ${inter.variable}`}>
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
