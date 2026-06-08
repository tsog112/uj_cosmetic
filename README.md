# UJ Cosmetic

Монгол болон Солонгос зах зээлд зориулсан cosmetic e-commerce веб апп. Next.js App Router дээр public shop, checkout, admin panel, QPay төлбөр, Firebase auth, Postgres (Prisma) backend.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Backend | Next.js Route Handlers, Prisma 5, PostgreSQL |
| Auth | Firebase (client), Firebase Admin (server), Kakao (KR) |
| Payments | QPay (MN), bank transfer settings (KR) |
| Media | Cloudinary |
| Email | Resend |
| Tests | Vitest |

## Features

- **Public shop** — каталог, cart, wishlist, reviews, profile
- **Dual market (MN / KR)** — хаяг, утас, валют (MNT/KRW), төлбөрийн урсгал
- **Checkout** — MN: аймаг/дүүрэг/хороо + QPay; KR: Daum postcode + bank transfer
- **Admin** — захиалга (market filter, KR/MN байршлын шүүлтүүр), бүтээгдэхүүн, analytics, settings
- **Delivery portal** — token-оор хүргэлтийн хуудас
- **AI chat assistant** — Gemini (optional)

## Quick start

### Шаардлага

- Node.js 20+
- PostgreSQL
- `.env.local` (доорх хувьсагчид)

### Суулгах

```bash
git clone <repo-url>
cd uj_cosmetic
npm install
```

### Database

`.env.local` файлд `DATABASE_URL` (Postgres connection string) заана. Дараа нь:

```bash
npm run db:migrate
npm run db:generate   # шаардлагатай бол
```

### Dev server

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) — public  
[http://localhost:3000/admin](http://localhost:3000/admin) — admin

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit tests) |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:migrate` | Prisma migrate deploy (`.env` уншина) |
| `npm run db:generate` | Prisma client generate |
| `npm run loadtest` | Order API load test script |

## Project structure

```
src/
├── app/
│   ├── (public)/          # Shop, cart, checkout, auth, profile
│   ├── admin/             # Admin UI
│   ├── api/               # REST API routes
│   └── delivery/          # Delivery driver portal
├── components/            # UI + admin components
├── context/               # Auth, Cart, Market, Locale, …
├── lib/                   # Services, hooks, utils, qpay, prisma
└── locales/               # i18n (mn.json)
prisma/
└── schema.prisma          # Database schema
scripts/                   # Prisma env helper, loadtest
.cursor/rules/             # Cursor AI rules (token efficiency)
AGENTS.md                  # Cursor agent entry guide
```

### Гол entry points

| Бүс | Файл |
|-----|------|
| Checkout | `src/app/(public)/checkout/page.tsx` |
| Order create API | `src/app/api/orders/create/route.ts` |
| MN/KR market | `src/context/MarketContext.tsx` |
| Address helpers | `src/lib/orderAddress.ts` |
| Admin orders | `src/app/admin/orders/page.tsx` |
| Admin backend | `src/lib/services/postgresAdminService.ts` |

## Environment variables

`.env.local` файлд тохируулна (git-д commit хийхгүй).

### Database (required)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/uj_cosmetic?schema=public
DIRECT_URL=postgresql://user:pass@localhost:5432/uj_cosmetic?schema=public
```

### App URL

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Firebase (auth)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server-side admin
FIREBASE_SERVICE_ACCOUNT_KEY=   # JSON string, эсвэл доорх тусдаа key-үүд
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### QPay (MN payments)

```env
QPAY_USERNAME=
QPAY_PASSWORD=
QPAY_INVOICE_CODE=
QPAY_ENDPOINT=https://merchant.qpay.mn   # optional
```

### Kakao (KR login)

```env
NEXT_PUBLIC_KAKAO_JS_KEY=
KAKAO_REST_API_KEY=
```

### Cloudinary (uploads)

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Email (Resend)

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ADMIN_EMAIL=
```

### Optional

```env
UPSTASH_REDIS_REST_URL=          # rate limiting (production)
UPSTASH_REDIS_REST_TOKEN=
GEMINI_API_KEY=                  # chat assistant
DELIVERY_API_TOKEN=              # delivery portal API
ADMIN_METRICS_REBUILD_SECRET=
```

## Dual market (MN / KR)

- **MN** — Mongolian address API (`/api/address/*`), 8-digit phone, MNT, QPay
- **KR** — Korean postcode (Daum), KRW display, bank account from admin settings, Kakao login
- Order model: `market`, `currency` fields; KR address snapshot `{ type: 'kr', zonecode, roadAddress, detail }`

Admin settings (`/admin/settings`) дээр KR bank, shipping, `mntPerKrw` тохируулна.

## Testing

```bash
npm test
```

Tests: `src/lib/__tests__/` (coupon rules, rate limit, …)

## Cursor / AI development

Token хэмнэх тохиргоо:

- `.cursorignore` — build/cache файлуудыг index-ээс хассан
- `.cursor/rules/` — project map, token efficiency, scoped rules
- `AGENTS.md` — agent-ийн товч гарын авлага

Prompt бичихдээ `@файл` зааж, богино, тодорхой асуулт асуу (жишээ нь: `admin orders: KR filter дээр MN dropdown харагдаж байна`).

## License

Private project.
