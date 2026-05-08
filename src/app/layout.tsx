import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'UJ Cosmetic — Солонгос гоо сайхны бүтээгдэхүүн',
  description: 'Солонгос гоо сайхны шилдэг бүтээгдэхүүнийг Монголд хүргэж буй UJ Cosmetic. Серум, тоник, нүүрний тос, наран хамгаалагч.',
  keywords: 'UJ Cosmetic, Солонгос гоо сайхан, арьс арчилгаа, серум, тоник, Монгол',
  openGraph: {
    title: 'UJ Cosmetic — Солонгос гоо сайхны бүтээгдэхүүн',
    description: 'Арьсны тусламж. Хүний хүч.',
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
    <html lang="mn" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
