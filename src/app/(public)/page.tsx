'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Sparkles,
  Star,
} from 'lucide-react';
import Accordion from '@/components/ui/Accordion';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FadeInSection from '@/components/motion/FadeInSection';
import HeroSlideIndicator from '@/components/ui/HeroSlideIndicator';
import HorizontalScrollRow from '@/components/ui/HorizontalScrollRow';
import ProductCard from '@/components/ui/ProductCard';
import { getAllProducts, getLatestReviews } from '@/lib/services/firestoreService';
import { categoryToneFromColor, getCategoryIcon } from '@/lib/categoryIcons';
import { mobileSiteFooterClass } from '@/lib/layout/shell';
import { resolveHomePage, resolveTrustItems } from '@/lib/resolveSiteContent';
import { type HomePageSettings, type Product, type Review, type SiteSettings } from '@/types';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HomeCategory = {
  id: string;
  slug: string;
  name?: string;
  name_mn?: string;
  icon?: string;
  color?: string;
  image?: string;
  showOnHome?: boolean;
  sortOrder?: number;
  productCount?: number;
};

type InstagramSlot = {
  id: string;
  imageUrl?: string;
  instagramUrl?: string;
};

const serifStack = 'Georgia, "Times New Roman", serif';

function firstImage(product?: Product) {
  return product?.images?.find(Boolean) || '/placeholder-product.svg';
}

function productName(product?: Product) {
  return product?.name_mn || product?.name_en || '\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d';
}

function initials(name?: string) {
  return (name || 'UJ').trim().split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [instagramSlots, setInstagramSlots] = useState<InstagramSlot[]>([]);
  const [homePage, setHomePage] = useState<HomePageSettings>({});
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllProducts({ published: true }).catch(() => []),
      getLatestReviews(10).catch(() => []),
      fetch('/api/categories').then((res) => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/instagram-feed').then((res) => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/settings').then((res) => res.ok ? res.json() : {}).catch(() => ({})),
    ]).then(([productData, reviewData, categoryData, instagramData, settingsData]) => {
      setProducts(Array.isArray(productData) ? productData : []);
      setReviews(Array.isArray(reviewData) ? reviewData.filter((review) => review.status === 'visible') : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setInstagramSlots(Array.isArray(instagramData) ? instagramData : []);
      const settings = settingsData as SiteSettings;
      setHomePage(resolveHomePage(settings?.homePage && typeof settings.homePage === 'object' ? settings.homePage : undefined));
    });
  }, []);

  const heroProducts = useMemo(() => {
    const featured = products.filter((product) => product.featured);
    return (featured.length ? featured : products).slice(0, 5);
  }, [products]);

  const heroReady = heroProducts.length > 0;

  useGSAP(() => {
    if (!heroReady) return;

    const mm = gsap.matchMedia();
    const scope = rootRef.current;
    if (!scope) return;

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const pill = scope.querySelector('[data-hero-pill]');
      const title = scope.querySelector('[data-hero-title]');
      const subtitle = scope.querySelector('[data-hero-subtitle]');
      const actions = scope.querySelector('[data-hero-actions]');

      if (pill || title || subtitle || actions) {
        const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
        if (pill) heroTimeline.from(pill, { y: 16, opacity: 0, duration: 0.45 });
        if (title) heroTimeline.from(title, { y: 24, opacity: 0, duration: 0.55 }, '-=0.18');
        if (subtitle) heroTimeline.from(subtitle, { y: 18, opacity: 0, duration: 0.45 }, '-=0.2');
        if (actions) heroTimeline.from(actions, { y: 12, opacity: 0, duration: 0.4 }, '-=0.2');
      }

      const rows = gsap.utils.toArray<HTMLElement>('[data-showcase-row]', scope);
      rows.forEach((row) => {
        gsap.from(row, {
          y: 26,
          opacity: 0,
          duration: 0.55,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 88%',
            once: true,
          },
        });
      });
    });

    return () => mm.revert();
  }, { scope: rootRef, dependencies: [heroReady] });

  const slideCount = Math.max(heroProducts.length, 1);

  useEffect(() => {
    if (paused || slideCount <= 1) return;
    const timer = window.setTimeout(() => {
      setSlideIndex((current) => (current + 1) % slideCount);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [paused, slideIndex, slideCount]);

  useEffect(() => {
    if (slideIndex >= slideCount) setSlideIndex(0);
  }, [slideIndex, slideCount]);

  const featuredProducts = useMemo(() => {
    const flagged = products.filter((product) => product.showcaseFeatured);
    if (flagged.length) return flagged.slice(0, 10);
    const featured = products.filter((product) => product.featured || product.orderCount > 0);
    return (featured.length ? featured : products).slice(0, 10);
  }, [products]);

  const newestProducts = useMemo(() => {
    const flagged = products.filter((product) => product.showcaseNewest);
    const pool = flagged.length ? flagged : [...products];
    return pool
      .sort((a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime())
      .slice(0, 10);
  }, [products]);

  const saleProducts = useMemo(() => {
    const flagged = products.filter((product) => product.showcaseSale);
    if (flagged.length) return flagged.slice(0, 10);
    return products
      .filter((product) => product.salePrice != null && product.salePrice < (product.price ?? 0))
      .slice(0, 10);
  }, [products]);

  const trustItems = useMemo(() => resolveTrustItems(homePage), [homePage]);

  const careProducts = useMemo(() => {
    const featured = products.filter((p) => p.showcaseFeatured || p.featured);
    return (featured.length ? featured : products).slice(0, 4);
  }, [products]);

  const activeProduct = heroProducts[slideIndex] || heroProducts[0];
  const heroSubtitle = activeProduct?.description_mn?.slice(0, 160) || '';

  return (
    <div ref={rootRef} className="luxury-shell min-h-screen text-[var(--color-text-primary)]">
      <section
        className="relative overflow-hidden bg-[#2d1823] text-white"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {activeProduct ? (
          <>
        <div className="absolute inset-0">
          <Image src={firstImage(activeProduct)} alt={productName(activeProduct)} fill priority sizes="100vw" className="object-cover opacity-65" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(35,20,28,0.88),rgba(35,20,28,0.56)_46%,rgba(35,20,28,0.16))]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(35,20,28,0.78),rgba(35,20,28,0.1)_55%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-160px)] max-w-[1180px] items-end px-4 pb-12 pt-20 md:min-h-[680px] md:items-center md:px-8 md:py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              className="max-w-[560px]"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div data-hero-pill className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
                <Sparkles size={14} />
                {activeProduct.featured ? 'Онцлох' : 'Шинэ'}
              </div>
              <h1 data-hero-title className="mt-5 text-[clamp(32px,7vw,68px)] font-medium leading-[1.04]" style={{ fontFamily: serifStack }}>
                {productName(activeProduct)}
              </h1>
              {heroSubtitle ? <p data-hero-subtitle className="mt-4 max-w-[460px] text-[14px] font-medium leading-6 text-white/78">{heroSubtitle}</p> : null}
              <div data-hero-actions className="mt-7 flex flex-wrap items-center gap-2.5">
                <Link href={`/shop/${activeProduct.slug}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-6 text-[13px] font-semibold text-white">
                  Дэлгэрэнгүй
                  <ArrowRight size={17} strokeWidth={1.8} />
                </Link>
                <Link href="/shop" className="inline-flex h-11 items-center justify-center rounded-full border border-white/28 bg-white/12 px-5 text-[13px] font-semibold text-white backdrop-blur">
                  {'\u0411\u04af\u0433\u0434\u0438\u0439\u0433 \u0445\u0430\u0440\u0430\u0445'}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>

        <HeroSlideIndicator current={slideIndex} total={slideCount} />
          </>
        ) : (
          <div className="relative z-10 mx-auto flex min-h-[320px] max-w-[1180px] items-center px-4 py-16 md:px-8">
            <p className="text-white/70">Одоогоор бүтээгдэхүүн байхгүй байна.</p>
          </div>
        )}
      </section>

      <section className="border-b border-[#f5d5e0] bg-white" style={{ boxShadow: 'var(--shadow-xs)' }}>
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 md:grid-cols-4">
          {trustItems.map(({ title, sub, icon }) => {
            const Icon = getCategoryIcon(icon);
            return (
            <div key={title} className="px-4 py-4 text-center md:border-r md:border-[#f5d5e0] md:last:border-r-0">
              <Icon className="mx-auto text-[var(--color-brand)]" size={19} strokeWidth={1.7} />
              <p className="mt-2 text-[13px] font-semibold">{title}</p>
              <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{sub}</p>
            </div>
          );})}
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-14 px-5 py-10 md:px-8 md:py-14">
        <FadeInSection><IntroSection homePage={homePage} /></FadeInSection>
        <CategoryEditorial categories={categories} />
        <FadeInSection delay={0.08}><PromiseBanner homePage={homePage} /></FadeInSection>
        <FadeInSection delay={0.1}><ProductShowcase title={homePage.showcaseFeaturedTitle || 'Эрхэмсэг сонголтууд'} href="/shop" products={featuredProducts} autoScroll /></FadeInSection>
        <ProductShowcase title={homePage.showcaseNewestTitle || 'Шинэхэн ирсэн'} href="/shop?sort=newest" products={newestProducts} autoScroll />
        {careProducts.length > 0 ? <CareNote products={careProducts} homePage={homePage} /> : null}
        <ProductShowcase title={homePage.showcaseSaleTitle || 'Зөөллөн үнэтэй санал'} href="/shop?onSale=true" products={saleProducts} autoScroll />
        {reviews.length > 0 ? <ReviewEditorial reviews={reviews} /> : null}
        <InstagramEditorial slots={instagramSlots} products={products} />
        {homePage.faqItems && homePage.faqItems.length > 0 ? <FaqSection homePage={homePage} /> : null}
      </main>

      <Footer />
    </div>
  );
}

function IntroSection({ homePage }: { homePage: HomePageSettings }) {
  if (!homePage.introTitle && !homePage.introBody) return null;
  return (
    <section className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-end">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">UJ beauty note</p>
        {homePage.introTitle ? (
          <h2 className="mt-3 max-w-[560px] text-[clamp(30px,5vw,46px)] font-medium leading-[1.06] text-[#2a1d24]" style={{ fontFamily: serifStack }}>
            {homePage.introTitle}
          </h2>
        ) : null}
      </div>
      {homePage.introBody ? (
        <p className="max-w-[520px] text-sm leading-7 text-[var(--color-text-secondary)] md:justify-self-end">{homePage.introBody}</p>
      ) : null}
    </section>
  );
}

function CategoryHomeCard({ category }: { category: HomeCategory }) {
  const Icon = getCategoryIcon(category.icon);
  const name = category.name_mn || category.name || category.slug;
  const tone = categoryToneFromColor(category.color);

  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category.slug)}`}
      className="group flex min-w-0 w-full flex-col items-center rounded-[18px] border border-[#f0e4ea] bg-white px-1.5 py-3 text-center transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)]/35 hover:shadow-[var(--shadow-sm)] md:rounded-[22px] md:px-2 md:py-5"
      style={{ textDecoration: 'none', boxShadow: 'var(--shadow-xs)' }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition md:h-14 md:w-14 md:rounded-[18px]"
        style={{ backgroundColor: tone.background, borderColor: tone.border, color: tone.color }}
      >
        <Icon className="h-[18px] w-[18px] md:h-5 md:w-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="mt-2 line-clamp-2 w-full px-0.5 text-[10px] font-bold leading-[1.2] text-[#1f2530] md:text-[12px] md:leading-5">
        {name}
      </span>
    </Link>
  );
}

function CategoryEditorial({ categories }: { categories: HomeCategory[] }) {
  const display = categories
    .filter((category) => category.showOnHome !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (!display.length) return null;

  return (
    <section className="-mx-5 rounded-[24px] bg-[#fdf5f8] px-5 py-6 md:mx-0 md:bg-transparent md:px-0 md:py-0">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">Browse</p>
          <h2 className="mt-1.5 text-[26px] font-medium leading-[1.06] text-[#2a1d24] md:text-[clamp(28px,4vw,40px)]" style={{ fontFamily: serifStack }}>
            {'\u0410\u043d\u0433\u0438\u043b\u043b\u0430\u0430\u0440'}
          </h2>
          <div className="mt-2 h-[3px] w-10 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
        </div>
        <Link href="/shop" className="shrink-0 pb-1 text-[12px] font-semibold text-[var(--color-brand)] md:text-[13px]">
          {'\u0411\u04af\u0433\u0434\u0438\u0439\u0433 \u0445\u0430\u0440\u0430\u0445'}
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:mt-6 md:gap-2.5 lg:grid-cols-[repeat(auto-fit,minmax(96px,1fr))]">
        {display.map((category) => (
          <CategoryHomeCard key={category.id || category.slug} category={category} />
        ))}
      </div>
    </section>
  );
}

function PromiseBanner({ homePage }: { homePage: HomePageSettings }) {
  if (!homePage.promiseTitle) return null;
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(110deg,#d4537e,#8b2f52)] px-6 py-12 text-center text-white md:px-10" style={{ boxShadow: 'var(--shadow-md)' }}>
      <div className="absolute -left-12 bottom-[-70px] h-44 w-44 rounded-full bg-white/10" />
      <div className="absolute -right-12 top-[-70px] h-44 w-44 rounded-full bg-white/10" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Our promise</p>
      <h2 className="relative mx-auto mt-4 max-w-[740px] text-[26px] font-medium leading-tight md:text-[34px]" style={{ fontFamily: serifStack }}>
        {homePage.promiseTitle}
      </h2>
      {homePage.promiseBody ? <p className="relative mx-auto mt-3 max-w-[640px] text-sm text-white/80">{homePage.promiseBody}</p> : null}
      <Link href={homePage.promiseCtaHref || '/about'} className="relative mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/18 px-8 text-sm font-semibold text-white">
        {homePage.promiseCtaLabel || 'Бидний тухай'}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function CareNote({ products, homePage }: { products: Product[]; homePage: HomePageSettings }) {
  if (!products.length) return null;
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#f5d5e0] bg-[#fdf8fa]" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="grid gap-6 p-5 md:grid-cols-2 md:items-center md:gap-8 md:p-8">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fbe8f1] px-4 py-2 text-[12px] font-semibold text-[var(--color-brand-dark)]">
            <Sparkles size={15} />
            Онцлох
          </div>
          <h2 className="mt-4 text-[clamp(24px,4vw,32px)] font-medium leading-tight text-[#2a1d24]" style={{ fontFamily: serifStack }}>
            {homePage.careTitle || 'Онцлох коллекц'}
          </h2>
          <p className="mt-3 max-w-[480px] text-sm leading-7 text-[var(--color-text-secondary)]">
            {homePage.careBody || 'Манай онцлох бүтээгдэхүүнүүдийг эндээс танилцаарай.'}
          </p>
          <Link href="/shop" className="mt-6 inline-flex h-12 w-fit items-center justify-center rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white transition-transform active:scale-[0.98]">
            {homePage.careCtaLabel || 'Бүтээгдэхүүн үзэх'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, 4).map((product, index) => (
            <Link key={product.id} href={`/shop/${product.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#fbe8f1] animate-[fadeUp_0.7s_var(--ease-spring)_both]" style={{ animationDelay: `${index * 70}ms`, textDecoration: 'none', boxShadow: 'var(--shadow-xs)' }}>
              <Image src={firstImage(product)} alt={productName(product)} fill sizes="(max-width: 768px) 42vw, 220px" className="object-cover transition-transform duration-500 hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="line-clamp-2 text-[12px] font-semibold leading-4 text-white">{productName(product)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase({ title, href, products, autoScroll = false }: { title: string; href: string; products: Product[]; autoScroll?: boolean }) {
  if (!products.length) return null;
  const displayProducts = products.slice(0, 10);

  return (
    <section data-showcase-row className="min-w-0 overflow-visible">
      <SectionTitle title={title} href={href} />
      <div className="mt-5 hidden gap-3 md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-5">
        {displayProducts.slice(0, 5).map((product) => (
          <div key={product.id} className="min-w-0 [&_article]:!w-full [&_article]:!min-w-0">
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
      <HorizontalScrollRow className="-mx-5 mt-5 px-5 md:hidden" autoScroll={autoScroll}>
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </HorizontalScrollRow>
    </section>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <article
      className="flex h-full min-h-[228px] w-[min(76vw,200px)] shrink-0 snap-start flex-col rounded-[16px] border border-[#f5d5e0] bg-white p-3 animate-[fadeUp_0.7s_var(--ease-spring)_both] md:min-h-[248px] md:w-full md:rounded-[18px] md:p-4"
      style={{ animationDelay: `${index * 60}ms`, boxShadow: 'var(--shadow-xs)' }}
    >
      {review.imageUrls?.[0] && (
        <div className="relative mb-2 h-[80px] shrink-0 overflow-hidden rounded-[12px] bg-[#fbe8f1] md:h-[96px]">
          <Image src={review.imageUrls[0]} alt={review.productName || 'Review image'} fill sizes="(max-width: 768px) 200px, 320px" className="object-cover" />
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 gap-0.5" aria-label={`${review.rating} star review`}>
          {Array.from({ length: Math.max(1, Math.min(5, review.rating)) }).map((_, starIndex) => (
            <Star key={starIndex} className="h-[11px] w-[11px] md:h-[12px] md:w-[12px]" fill="var(--color-brand)" color="var(--color-brand)" />
          ))}
        </div>
        <p className="mt-2 flex-1 text-[11px] font-normal leading-[1.45] text-[#2a1d24] line-clamp-4 md:text-[12px] md:leading-[1.5]">
          &ldquo;{review.content || review.body}&rdquo;
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-[#f5ebef] pt-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fbe8f1] text-[10px] font-semibold text-[var(--color-brand)]">
              {initials(review.userName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold">{review.userName || 'UJ \u0445\u044d\u0440\u044d\u0433\u043b\u044d\u0433\u0447'}</p>
              <p className="truncate text-[10px] text-[var(--color-text-muted)]">{review.productName}</p>
            </div>
          </div>
          <BadgeCheck className="shrink-0 text-[#3B6D11]" size={15} />
        </div>
      </div>
    </article>
  );
}

function ReviewEditorial({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const displayReviews = reviews.slice(0, 8);

  return (
    <section data-showcase-row className="min-w-0 overflow-visible">
      <div className="flex items-end justify-between gap-3">
        <h2
          className="max-w-[72%] text-[22px] font-medium leading-[1.12] text-[#2a1d24] md:max-w-none md:text-[clamp(28px,4vw,40px)] md:leading-[1.06]"
          style={{ fontFamily: serifStack }}
        >
          {'\u0425\u044d\u0440\u044d\u0433\u043b\u044d\u0433\u0447\u0434\u0438\u0439\u043d \u0431\u043e\u0434\u0438\u0442 \u0441\u044d\u0442\u0433\u044d\u0433\u0434\u044d\u043b'}
        </h2>
        <Link href="/reviews" className="shrink-0 pb-0.5 text-[12px] font-semibold text-[var(--color-brand)] md:text-[13px]">
          {'\u0411\u04af\u0433\u0434\u0438\u0439\u0433 \u0445\u0430\u0440\u0430\u0445'}
        </Link>
      </div>

      <div className="mt-5 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {displayReviews.slice(0, 6).map((review, index) => (
          <ReviewCard key={review.id} review={review} index={index} />
        ))}
      </div>

      <HorizontalScrollRow className="-mx-5 mt-3 px-5 md:hidden" autoScroll>
        {displayReviews.map((review, index) => (
          <ReviewCard key={review.id} review={review} index={index} />
        ))}
      </HorizontalScrollRow>
    </section>
  );
}

function InstagramEditorial({ slots }: { slots: InstagramSlot[]; products: Product[] }) {
  const displaySlots = slots.filter((slot) => slot.imageUrl).slice(0, 6);

  if (!displaySlots.length) return null;

  return (
    <section className="rounded-[28px] border border-[#f5d5e0] bg-white p-5 md:p-8" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fbe8f1] px-4 py-2 text-[12px] font-semibold text-[var(--color-brand-dark)]">
            <Camera size={15} />
            Instagram
          </div>
          <h2 className="mt-4 text-[clamp(28px,4vw,40px)] font-medium leading-[1.06] text-[#2a1d24]" style={{ fontFamily: serifStack }}>{'UJ-\u0438\u0439\u043d \u0433\u043e\u043e \u0441\u0430\u0439\u0445\u043d\u044b \u0436\u0438\u0436\u0438\u0433 \u0442\u044d\u043c\u0434\u044d\u0433\u043b\u044d\u043b\u04af\u04af\u0434'}</h2>
        </div>
        <p className="max-w-[420px] text-sm leading-7 text-[var(--color-text-secondary)]">
          {'Texture, routine \u0441\u0430\u043d\u0430\u0430, \u0448\u0438\u043d\u044d\u0445\u044d\u043d \u0438\u0440\u0441\u044d\u043d \u0441\u043e\u043d\u0433\u043e\u043b\u0442\u0443\u0443\u0434\u044b\u0433 \u0438\u043b\u04af\u04af \u043e\u0439\u0440\u043e\u043e\u0441 \u0445\u0430\u0440\u0430\u0430\u0440\u0430\u0439.'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {displaySlots.map((slot, index) => (
          <Link
            key={slot.id || index}
            href={slot.instagramUrl || '#'}
            className="group relative aspect-square overflow-hidden rounded-[20px] bg-[#fbe8f1] animate-[scaleIn_0.6s_var(--ease-spring)_both]"
            style={{ animationDelay: `${index * 50}ms`, textDecoration: 'none' }}
            target={slot.instagramUrl?.startsWith('http') ? '_blank' : undefined}
            rel={slot.instagramUrl?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            <Image src={slot.imageUrl || '/placeholder-product.svg'} alt={`UJ Instagram ${index + 1}`} fill sizes="(max-width: 768px) 45vw, 170px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function FaqSection({ homePage }: { homePage: HomePageSettings }) {
  if (!homePage.faqItems?.length) return null;
  return (
    <section className="grid gap-8 rounded-[28px] bg-[#fbe8f1] p-6 md:grid-cols-[0.8fr_1.2fr] md:p-8" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">Help desk</p>
        {homePage.faqTitle ? (
          <h2 className="mt-3 text-[clamp(28px,4vw,40px)] font-medium leading-[1.06] text-[#2a1d24]" style={{ fontFamily: serifStack }}>{homePage.faqTitle}</h2>
        ) : null}
        {homePage.faqBody ? (
          <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">{homePage.faqBody}</p>
        ) : null}
      </div>
      <Accordion items={homePage.faqItems} />
    </section>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-[clamp(28px,4vw,40px)] font-medium leading-[1.06] text-[#2a1d24]" style={{ fontFamily: serifStack }}>{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-[13px] font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]">
          {'\u0411\u04af\u0433\u0434\u0438\u0439\u0433 \u0445\u0430\u0440\u0430\u0445'}
        </Link>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className={`bg-[#21151c] px-5 pt-12 text-white/60 md:px-8 md:py-12 ${mobileSiteFooterClass}`}>
      <div className="mx-auto grid max-w-[1180px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-block" style={{ textDecoration: 'none' }}>
            <span className="block text-[32px] font-medium text-white" style={{ fontFamily: serifStack }}>UJ</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">Beauty & Wellness</span>
          </Link>
          <p className="mt-4 max-w-[260px] text-[13px] leading-7">{'\u0410\u0440\u044c\u0441 \u0430\u0440\u0447\u0438\u043b\u0433\u0430\u0430, \u0433\u043e\u043e \u0441\u0430\u0439\u0445\u0430\u043d, wellness \u0441\u043e\u043d\u0433\u043e\u043b\u0442\u0443\u0443\u0434\u044b\u0433 \u043d\u044d\u0433 \u0434\u043e\u0440\u043e\u043e\u0441.'}</p>
        </div>
        <FooterLinks title={'\u0414\u044d\u043b\u0433\u04af\u04af\u0440'} links={[{ label: '\u041d\u04af\u04af\u0440', href: '/' }, { label: '\u0414\u044d\u043b\u0433\u04af\u04af\u0440', href: '/shop' }, { label: '\u0425\u044f\u043c\u0434\u0440\u0430\u043b', href: '/shop?onSale=true' }]} />
        <FooterLinks title={'\u041c\u044d\u0434\u044d\u044d\u043b\u044d\u043b'} links={[{ label: '\u0411\u0438\u0434\u043d\u0438\u0439 \u0442\u0443\u0445\u0430\u0439', href: '/about' }, { label: '\u0421\u044d\u0442\u0433\u044d\u0433\u0434\u044d\u043b', href: '/reviews' }, { label: '\u0417\u0430\u0445\u0438\u0430\u043b\u0433\u0430\u0430 \u0445\u044f\u043d\u0430\u0445', href: '/profile/orders' }, { label: '\u0421\u0430\u0433\u0441', href: '/cart' }]} />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{'\u0425\u043e\u043b\u0431\u043e\u0433\u0434\u043e\u0445'}</p>
          <div className="mt-4 flex flex-col gap-3 text-[13px]">
            <span>Messenger</span>
            <span>Instagram</span>
            <span>Facebook</span>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1180px] flex-col gap-2 border-t border-white/10 pt-5 text-[12px] text-white/35 md:flex-row md:justify-between">
        <span>&copy; {new Date().getFullYear()} UJ Beauty & Wellness</span>
        <span>{'\u0423\u043b\u0430\u0430\u043d\u0431\u0430\u0430\u0442\u0430\u0440 \u0445\u043e\u0442, \u041c\u043e\u043d\u0433\u043e\u043b \u0423\u043b\u0441'}</span>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{title}</p>
      <nav className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-[13px] text-white/60 transition-colors hover:text-white" style={{ textDecoration: 'none' }}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
