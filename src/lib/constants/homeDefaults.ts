import type { AboutPageSettings, HomePageSettings, HomeTrustItem } from '@/types';

/** Admin «Анхны утга сэргээх» болон нүүр хуудсын fallback */
export const DEFAULT_HOME_TRUST_ITEMS: HomeTrustItem[] = [
  { title: 'Хүргэлттэй', sub: 'УБ болон орон нутаг', icon: 'Truck' },
  { title: 'Баталгаатай', sub: 'Сонгогдсон брэндүүд', icon: 'BadgeCheck' },
  { title: '7 хоног', sub: 'Буцаалт, солилцоо', icon: 'RotateCcw' },
  { title: 'Зөвлөгөө', sub: 'Арьсанд тохирсон сонголт', icon: 'MessageCircle' },
];

export const DEFAULT_HOME_PAGE: HomePageSettings = {
  promiseTitle: 'Өөртөө анхаарах мөч бүрийг илүү гоё болгоё',
  promiseCtaLabel: 'Бидний тухай',
  promiseCtaHref: '/about',
  careTitle: 'Онцлох коллекц',
  careBody: 'Манай онцлох бүтээгдэхүүнүүдийг эндээс танилцаарай. Таны өдөр тутмын routine-д тохирсон шилдэг сонголтууд.',
  careCtaLabel: 'Бүтээгдэхүүн үзэх',
  showcaseFeaturedTitle: 'Эрхэмсэг сонголтууд',
  showcaseNewestTitle: 'Шинэхэн ирсэн',
  showcaseSaleTitle: 'Зөөллөн үнэтэй санал',
};

export const DEFAULT_ABOUT_PAGE: AboutPageSettings = {
  heroImage: '/images/brand/about_hero.jpg',
  heroEyebrow: 'Бидний түүх',
  heroTitle: 'UJ Cosmetic',
  storyEyebrow: 'About us',
  storyTitle: 'Арьсны тусламж. Хүний хүч.',
  storyParagraphs: [
    'UJ Cosmetic нь 2022 онд Улаанбаатар хотод үүсгэн байгуулагдсан Солонгос гоо сайхны брэнд юм. Бид Солонгосын дэвшилтэт арьс арчилгааны технологийг Монгол эмэгтэйчүүдийн арьсны онцлогт тохируулан бүтээгдэхүүн бүтээж байна.',
    'Манай бүтээгдэхүүн бүр нь байгалийн гаралтай найрлагыг шинжлэх ухааны судалгаатай хослуулж, аюулгүй, үр дүнтэй, чанартай байхыг баталгаажуулдаг. Бүх бүтээгдэхүүн Солонгосоос шууд импортолсон.',
    'Бидний зорилго бол Монгол эмэгтэйчүүд бүрд гоо сайхны итгэл үнэмшил, эрүүл арьс бэлэглэх явдал юм.',
  ],
  storyImage: '/images/brand/about.jpg',
  philosophyEyebrow: 'Our philosophy',
  philosophyTitle: 'Цэвэр, энгийн, үр дүнтэй',
  philosophyParagraphs: [
    'Бид арьс арчилгааны энгийн, ойлгомжтой, үр дүнтэй арга барилыг дэмждэг. Хэрэггүй нэмэлт найрлагагүй, зөвхөн таны арьсанд хэрэгтэй зүйлсийг агуулсан бүтээгдэхүүн.',
    'Бүтээгдэхүүн тус бүрийг Солонгосын тэргүүлэх лабораторид хийсэн арьсны судалгаанд тулгуурлан боловсруулсан бөгөөд Монгол орны уур амьсгалын онцлогийг харгалзан тусгайлан тохируулсан.',
  ],
  valuesEyebrow: 'Our values',
  valuesTitle: 'Юугаараа онцлог вэ',
  values: [
    { title: 'Байгалийн найрлага', description: 'Бид зөвхөн байгалийн гаралтай, арьсанд ээлтэй найрлага ашиглан бүтээгдэхүүнээ бүтээдэг.', icon: 'Heart' },
    { title: 'Солонгос технологи', description: 'Солонгосын дэвшилтэт арьс арчилгааны технологийг Монголд хүргэн ажилладаг.', icon: 'Sparkles' },
    { title: 'Монгол арьсанд зориулсан', description: 'Монгол орны хуурай, хүйтэн уур амьсгалд тохирсон тусгай найрлагатай бүтээгдэхүүн.', icon: 'Gem' },
  ],
  showContactForm: true,
  contactEyebrow: 'Contact',
  contactTitle: 'Бидэнтэй холбогдох',
};
