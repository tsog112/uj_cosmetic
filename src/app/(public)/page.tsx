'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ArrowRight, BadgeCheck, Sparkles, Star, Truck, Droplet, Sun, Moon, Flower2, Leaf, Waves, Wind, Beaker, FlaskConical, Feather, Heart, Gem, ShieldPlus, MoreHorizontal, Tags, Syringe, Pill, Scale, Activity } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import ProductCard from '@/components/ui/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import FloatingPetals from '@/components/ui/FloatingPetals';
import { db } from '@/lib/firebase';
import { getAllProducts, getLatestReviews, getCategories } from '@/lib/services/firestoreService';
import { type Product, type Review } from '@/types';

type InstagramSlot = { id: string; instagramUrl: string; imageUrl: string };

const ICON_MAP: Record<string, React.ElementType> = {
  Droplet, Sparkles, Sun, Moon, Flower2, Leaf, Waves, Wind, Beaker, FlaskConical, Feather, Heart, Gem, ShieldPlus, Tags, MoreHorizontal, Syringe, Pill, Scale, Activity
};

function getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) {
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
    }
    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }
  return pages;
}

// ── Word-by-word staggered text reveal ───────────────────────────────────
function StaggeredText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────
function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5" style={{ color: '#E91E8C' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </div>
  );
}

// ── Section label with underline draw ────────────────────────────────────
function SectionLabel({ eyebrow, title, href, linkLabel }: {
  eyebrow: string; title: string; href?: string; linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <p
          className="text-label"
          style={{
            color: 'var(--color-primary)',
            fontFamily: '"Montserrat", sans-serif',
          }}
        >
          {eyebrow}
        </p>
        <h2
          className="mt-1 section-underline in-view leading-tight"
          style={{
            fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
            fontSize: 26,
            fontWeight: 500,
            color: 'var(--color-text-dark)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group flex items-center gap-1 text-[12px] font-bold transition-all"
          style={{ color: 'var(--color-primary)', letterSpacing: '0.02em' }}
        >
          {linkLabel}
          <ArrowRight
            size={12}
            strokeWidth={2.5}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  );
}

// ── Sparkle particles ─────────────────────────────────────────────────────
const SPARKLE_CONFIG = [
  { x: '15%', delay: '0s',   dur: '3s',   size: 10, opacity: 0.7 },
  { x: '40%', delay: '1.2s', dur: '4s',   size: 7,  opacity: 0.5 },
  { x: '70%', delay: '0.5s', dur: '3.5s', size: 12, opacity: 0.6 },
  { x: '85%', delay: '2.1s', dur: '5s',   size: 8,  opacity: 0.55 },
  { x: '55%', delay: '1.7s', dur: '3.8s', size: 6,  opacity: 0.45 },
];

function SparkleParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SPARKLE_CONFIG.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: `${20 + i * 12}%`,
            left: s.x,
            animation: `sparkleDrift ${s.dur} ${s.delay} ease-out infinite`,
            opacity: s.opacity,
          }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 24 24">
            <path
              d="M12 2L13.5 10L22 12L13.5 14L12 22L10.5 14L2 12L10.5 10Z"
              fill="#FFB6D9"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ── Instagram section ─────────────────────────────────────────────────────
function InstagramFeedSection() {
  const [slots, setSlots] = useState<InstagramSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'instagramFeed'), orderBy('order', 'asc')))
      .then((snap) =>
        setSlots(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as InstagramSlot))
            .filter((s) => s.imageUrl)
        )
      )
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && slots.length === 0) return null;

  return (
    <ScrollReveal>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>
            Instagram
          </p>
          <h2
            className="mt-1 section-underline in-view"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 26,
              fontWeight: 500,
              color: 'var(--color-text-dark)',
            }}
          >
            @uj_cosmetic
          </h2>
        </div>
        <a
          href="https://instagram.com/uj_cosmetic"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, #E91E8C, #C2185B)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(233,30,140,0.28)',
          }}
        >
          Дагах <ArrowRight size={11} strokeWidth={2.5} />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-shimmer rounded-[16px]" />
            ))
          : slots.slice(0, 6).map((slot, i) => (
              <a
                key={slot.id}
                href={slot.instagramUrl || 'https://instagram.com/uj_cosmetic'}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-[16px]"
                style={{ background: 'var(--color-soft-pink)' }}
              >
                <Image
                  src={slot.imageUrl}
                  alt={`UJ Cosmetic Instagram ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: 'rgba(233,30,140,0.30)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </a>
            ))}
      </div>
    </ScrollReveal>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isMobile, setIsMobile] = useState(true);

  // Parallax for hero text
  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 400], [0, -80]);
  const heroBgScale = useTransform(scrollY, [0, 400], [1, 1.08]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    Promise.all([
      getAllProducts({ published: true }).catch(() => [] as Product[]),
      getLatestReviews(12).catch(() => [] as Review[]),
      getCategories().catch(() => [] as any[]),
    ]).then(([productData, reviewData, categoriesData]) => {
      setProducts(productData || []);
      setReviews(reviewData || []);
      setCategories(categoriesData || []);
    }).finally(() => setLoading(false));
  }, []);

  const heroProducts = products.slice(0, 3);
  const newProducts  = products.slice(0, 4);
  const featured     = products.filter((p) => p.featured).slice(0, 4);
  const displayProducts = featured.length ? featured : products.slice(0, 4);
  const heroImage    = '/images/brand/hero.jpg';
  const averageRating = useMemo(
    () => reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
    [reviews]
  );

  const reviewsPerPage = isMobile ? 1 : 3;
  const totalReviewsPages = Math.ceil(reviews.length / reviewsPerPage) || 1;
  const currentReviews = useMemo(() => {
    const start = (reviewsPage - 1) * reviewsPerPage;
    return reviews.slice(start, start + reviewsPerPage);
  }, [reviews, reviewsPage, reviewsPerPage]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-[96px] md:pb-16">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative -mx-0 overflow-hidden"
        style={{ minHeight: 580, background: '#120810' }}
      >
        {/* Ken Burns background */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: heroBgScale }}
        >
          <div
            className="absolute inset-0"
            style={{ animation: 'kenBurns 14s ease-in-out infinite' }}
          >
            <Image
              src={heroImage}
              alt="UJ Beauty premium Korean skincare"
              fill
              sizes="100vw"
              className="object-cover"
              style={{ opacity: 0.78 }}
              priority
            />
          </div>
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 gradient-hero" />

        {/* Blob morphing accent */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: 320,
            height: 320,
            top: '-10%',
            right: '-15%',
            background: 'radial-gradient(ellipse, rgba(233,30,140,0.22) 0%, transparent 70%)',
            animation: 'blobMorph 9s ease-in-out infinite',
          }}
        />

        {/* Floating sakura petals */}
        <FloatingPetals count={7} />

        {/* Sparkle particles */}
        <SparkleParticles />

        {/* Noise texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
            opacity: 0.5,
          }}
        />

        {/* Hero content with parallax */}
        <motion.div
          className="absolute inset-x-5 bottom-7 text-white"
          style={{ y: heroTextY }}
        >
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.16)',
              fontFamily: '"Montserrat", sans-serif',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={12} strokeWidth={1.8} />
            Korean beauty curated
          </motion.div>

          {/* Main headline — staggered word reveal */}
          <h1
            style={{
              fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
              fontSize: 48,
              fontWeight: 400,
              lineHeight: 0.97,
              letterSpacing: '-0.01em',
              maxWidth: 360,
            }}
          >
            <StaggeredText text="Тансаг арьс арчилгааг" />
            {' '}
            <motion.em
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontStyle: 'italic', color: 'rgba(255,182,217,0.92)', display: 'inline-block' }}
            >
              өдөр бүртээ
            </motion.em>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 max-w-[300px] text-[13.5px] leading-[1.65]"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Эмэгтэйлэг, premium мэдрэмжтэй skincare сонголтыг нэг дороос.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex items-center gap-3"
          >
            <Link
              href="/shop"
              className="flex h-12 items-center gap-2 rounded-full px-6 text-[13px] font-bold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #E91E8C, #C2185B)',
                color: 'white',
                boxShadow: '0 8px 28px rgba(233,30,140,0.40)',
                fontFamily: '"Montserrat", sans-serif',
                letterSpacing: '0.06em',
              }}
            >
              Дэлгүүр үзэх <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link
              href="/reviews"
              className="flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'white',
              }}
              aria-label="Сэтгэгдэл үзэх"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </Link>
          </motion.div>

          {/* Hero product chips */}
          {heroProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 flex gap-2 overflow-x-auto hide-scrollbar"
            >
              {heroProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="flex min-w-[160px] items-center gap-2.5 rounded-[18px] p-2 transition-all active:scale-[0.98] hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <div
                    className="relative h-12 w-10 shrink-0 overflow-hidden rounded-[10px]"
                    style={{ background: 'rgba(255,255,255,0.18)' }}
                  >
                    <Image
                      src={product.images?.[0] || '/placeholder-product.svg'}
                      alt={product.name_mn}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[11.5px] font-semibold leading-snug">{product.name_mn}</p>
                    <p className="mt-0.5 text-[10px] font-medium" style={{ color: 'rgba(255,182,217,0.85)' }}>
                      Шууд үзэх →
                    </p>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────────────────── */}
      <ScrollReveal className="px-4">
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
          {[
            { icon: BadgeCheck, label: 'Сонгомол', sub: 'Curated beauty', color: '#C2185B', bg: 'rgba(194,24,91,0.08)' },
            { icon: Truck,      label: 'Шуурхай хүргэлт', sub: 'Fast delivery', color: '#7C5CBF', bg: 'rgba(124,92,191,0.08)' },
            { icon: Sparkles,   label: 'K-Beauty', sub: 'Premium care', color: '#0A8A9A', bg: 'rgba(10,138,154,0.08)' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex shrink-0 items-center gap-3 rounded-[18px] p-3 pr-4 transition-all hover:scale-[1.02]"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(233,30,140,0.06)', minWidth: 148 }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: item.bg, color: item.color }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[12px] font-bold leading-tight" style={{ color: 'var(--color-text-dark)' }}>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-text-medium)' }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>

      {/* ── NEW ARRIVALS ─────────────────────────────────────────────── */}
      <section className="px-4 md:px-8">
        <ScrollReveal>
          <SectionLabel eyebrow="New arrivals" title="Шинэ орсон" href="/shop?sort=newest" linkLabel="Бүгдийг харах" />
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-shimmer rounded-[24px]" style={{ height: 290 }} />
              ))
            : newProducts.map((product, i) => (
                <ScrollReveal key={product.id} delay={i * 60}>
                  <ProductCard product={product} compact />
                </ScrollReveal>
              ))}
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────── */}
      <ScrollReveal className="mx-4">
        <div
          className="rounded-[28px] p-5"
          style={{ background: '#FFFFFF', boxShadow: '0 4px 32px rgba(233,30,140,0.08)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>
                Real reviews
              </p>
              <h2
                className="mt-1 section-underline in-view"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 24,
                  fontWeight: 500,
                  color: 'var(--color-text-dark)',
                }}
              >
                Бодит сэтгэгдэл
              </h2>
            </div>
            {reviews.length > 0 && (
              <div className="text-right">
                <Stars rating={Math.round(averageRating)} size={14} />
                <p className="mt-1 text-[11px] font-bold" style={{ color: 'var(--color-text-medium)' }}>
                  {averageRating.toFixed(1)} · {reviews.length} сэтгэгдэл
                </p>
              </div>
            )}
          </div>

          {reviews.length ? (
            <div className="relative mt-6">
              <div className="relative overflow-hidden min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={reviewsPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {currentReviews.map((review) => (
                      <div key={review.id} className="w-full h-full">
                        <Link
                          href={`/shop/${review.productSlug}`}
                          className="block w-full rounded-[24px] p-5 transition-all hover:scale-[1.02] border border-[#fbe5f0] h-full flex flex-col justify-between"
                          style={{ background: 'var(--color-soft-pink)', boxShadow: '0 4px 16px rgba(233,30,140,0.03)' }}
                        >
                          <div>
                            {review.imageUrls?.[0] && (
                              <div
                                className="relative mb-4 aspect-[16/10] overflow-hidden rounded-[16px]"
                                style={{ background: 'var(--color-light-pink)' }}
                              >
                                <Image
                                  src={review.imageUrls[0]}
                                  alt={review.productName}
                                  fill
                                  sizes="(max-width: 768px) 340px, 400px"
                                  className="object-cover transition-transform duration-500 hover:scale-105"
                                />
                              </div>
                            )}
                            <Stars rating={review.rating} />
                            <p
                              className="mt-3 text-[13px] leading-relaxed text-gray-800 line-clamp-4"
                              style={{ minHeight: '80px' }}
                            >
                              {review.content}
                            </p>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-[#fbe5f0] pt-3 shrink-0">
                            <span className="text-[12px] font-bold text-[var(--color-primary)]">
                              — {review.userName || 'UJ хэрэглэгч'}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 truncate max-w-[140px]">
                              {review.productName}
                            </span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dynamic reviews pagination */}
              {totalReviewsPages >= 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (reviewsPage > 1) {
                        setReviewsPage((prev) => prev - 1);
                      }
                    }}
                    disabled={reviewsPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f8dbe8] bg-white text-[12px] font-bold text-[var(--color-text-dark)] shadow-sm transition-all hover:bg-[var(--color-soft-pink)] disabled:opacity-40 active:scale-95"
                  >
                    &lt;
                  </button>
                  
                  {getVisiblePages(reviewsPage, totalReviewsPages).map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="flex h-9 w-6 items-center justify-center text-[12px] font-bold text-[var(--color-brand-muted)]">
                          ...
                        </span>
                      );
                    }

                    const isActive = pageNum === reviewsPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setReviewsPage(pageNum as number);
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold transition-all shadow-sm active:scale-95 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#E91E8C] to-[#C2185B] text-white shadow-[0_3px_10px_rgba(233,30,140,0.20)]'
                            : 'border border-[#f8dbe8] bg-white text-[var(--color-text-dark)] hover:bg-[var(--color-soft-pink)]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      if (reviewsPage < totalReviewsPages) {
                        setReviewsPage((prev) => prev - 1 + 2);
                      }
                    }}
                    disabled={reviewsPage === totalReviewsPages}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f8dbe8] bg-white text-[12px] font-bold text-[var(--color-text-dark)] shadow-sm transition-all hover:bg-[var(--color-soft-pink)] disabled:opacity-40 active:scale-95"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p
              className="mt-4 rounded-[14px] p-4 text-[13px] leading-relaxed"
              style={{ background: 'var(--color-soft-pink)', color: 'var(--color-text-medium)' }}
            >
              Хэрэглэгчдийн зурагтай сэтгэгдэл энд харагдана.
            </p>
          )}

          <Link
            href="/reviews"
            className="mt-4 flex h-11 items-center justify-center rounded-full text-[12px] font-bold transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(233,30,140,0.08), rgba(194,24,91,0.06))',
              color: 'var(--color-primary)',
              border: '1.5px solid rgba(233,30,140,0.15)',
              fontFamily: '"Montserrat", sans-serif',
              letterSpacing: '0.06em',
            }}
          >
            Бүх сэтгэгдэл үзэх
          </Link>
        </div>
      </ScrollReveal>

      {/* ── RECOMMENDED ──────────────────────────────────────────────── */}
      <section className="px-4 md:px-8">
        <ScrollReveal>
          <SectionLabel eyebrow="Recommended" title="Санал болгох" href="/shop" linkLabel="Бүгдийг харах" />
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-shimmer rounded-[24px]" style={{ height: 310 }} />
              ))
            : displayProducts.map((product, i) => (
                <ScrollReveal key={product.id} delay={i * 60}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────── */}
      <section className="px-4 md:px-8">
        <ScrollReveal>
          <SectionLabel eyebrow="Browse" title="Ангиллаар" />
        </ScrollReveal>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8 px-1">
          {categories.filter(c => c.showOnHome).slice(0, 8).map((category, i) => {
            const Icon = ICON_MAP[category.icon] || Tags;
            const color = category.color || '#E91E8C';
            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 24, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="group relative flex h-full flex-col items-center justify-start gap-3 rounded-[24px] p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(233,30,140,0.12)] bg-white/60 backdrop-blur-md border border-white/40"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                >
                  <div
                    className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                    style={{ color: color, background: `linear-gradient(135deg, ${color}1A 0%, ${color}0D 100%)`, border: `1px solid ${color}26` }}
                  >
                    <Icon size={24} strokeWidth={1.5} />
                    <div className="absolute inset-0 rounded-[18px] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: `0 8px 24px ${color}33` }} />
                  </div>
                  <p 
                    className="text-[11px] font-bold leading-tight tracking-wide text-gray-800 line-clamp-2 px-1"
                  >
                    {category.name_mn}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── INSTAGRAM ─────────────────────────────────────────────────── */}
      <section className="px-4 md:px-8">
        <InstagramFeedSection />
      </section>

      {/* ── PROMISE ───────────────────────────────────────────────────── */}
      <ScrollReveal className="mx-4">
        <section
          className="relative overflow-hidden rounded-[28px] p-7 text-center"
          style={{
            background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 60%, #8B0037 100%)',
            color: 'white',
          }}
        >
          {/* Blob decoration */}
          <div
            className="pointer-events-none absolute"
            style={{
              width: 200,
              height: 200,
              top: '-30%',
              right: '-10%',
              background: 'rgba(255,255,255,0.08)',
              animation: 'blobMorph 10s ease-in-out infinite',
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              width: 140,
              height: 140,
              bottom: '-20%',
              left: '-5%',
              background: 'rgba(255,255,255,0.06)',
              animation: 'blobMorph 8s ease-in-out infinite reverse',
            }}
          />

          <p
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Our promise
          </p>
          <h2
            className="relative mt-3"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.25,
            }}
          >
            Өөртөө анхаарах мөч бүрийг илүү гоё болгоё
          </h2>
          <Link
            href="/about"
            className="relative mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] font-bold transition-all hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              fontFamily: '"Montserrat", sans-serif',
              letterSpacing: '0.06em',
            }}
          >
            Бидний тухай <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </section>
      </ScrollReveal>

    </div>
  );
}
