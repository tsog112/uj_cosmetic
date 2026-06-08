# uj_cosmetic — Agent guide

Cursor энэ файлыг автоматаар уншина. **Token хэмнэхийн тулд эхлээд энд, дараа нь зөвхөн холбоотой 1–2 файл.**

## Stack

Next.js 16 · React 19 · Prisma/Postgres · Firebase auth · QPay (MN)

## Хаана юу байдаг

| Асуулт | Эхлэх файл |
|--------|------------|
| Admin захиалга, шүүлтүүр | `src/app/admin/orders/page.tsx` |
| Admin API/filter SQL | `src/lib/services/postgresAdminService.ts` |
| Checkout UI | `src/app/(public)/checkout/page.tsx` |
| Захиалга үүсгэх | `src/app/api/orders/create/route.ts` |
| MN/KR market | `src/context/MarketContext.tsx` |
| Хаяг parse/format | `src/lib/orderAddress.ts` |
| Admin hook/query | `src/lib/hooks/useAdmin.ts` |
| Schema | `prisma/schema.prisma` |

## Prompt бичих (token бага)

1. **Бүс** — `admin orders`, `checkout`, `wishlist` г.м.
2. **Файл** (мэдвэл) — `@src/app/admin/orders/page.tsx`
3. **Алдаа** — юу буруу, юу харагдах ёстой (1–2 өгүүлбэр)

Жишээ:

```text
admin orders: 🇰🇷 сонгоход MN аймаг dropdown харагдаж байна — KR filter л үлдээгээрэй.
```

```text
checkout: KR сонгоход төлбөрийн дансны мэдээлэл settings-ээс ирэхгүй байна.
```

## Cursor тохиргоо (энэ repo)

- `.cursorignore` — `.next`, `node_modules` г.м. index-ээс хассан
- `.cursor/rules/token-efficiency.mdc` — agent-ийн token дүрэм
- `.cursor/rules/project-map.mdc` — модулийн газрын зураг
- File-scoped: `admin-orders.mdc`, `checkout-market.mdc`

## Команд

```bash
npm run dev
npm run build
npm test
npm run db:migrate
```

Commit/push-ийг agent автоматаар хийхгүй — хэрэглэгч хүссэн үед л.
