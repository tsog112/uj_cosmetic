# Өгөгдлийн эх сурвалж ба синхрончлолын бодлого

UJ Cosmetic нь **Postgres (Prisma)** руу шилжиж буй бөгөөд **Firestore**-ийг
түр зэрэгцүүлэн (fallback) ажиллуулж байна. Давхар ажиллагаанаас үүсэх
зөрчлийг багасгахын тулд дараах дүрмийг баримтлана.

## Эх сурвалжийн дүрэм (source of truth)

| Домэйн | Үндсэн эх сурвалж | Fallback / sync |
| --- | --- | --- |
| Захиалга үүсгэх | **Postgres** | — |
| Захиалга унших/шинэчлэх (админ, хүргэлт, QPay) | **Postgres-first** | Postgres-д олдохгүй (хуучин) бол Firestore |
| Хэрэглэгч (бүртгэл, профайл) | **Postgres** | Нэвтрэх бүрт `/api/auth/sync`-ээр Postgres руу upsert; Firestore-д мөн хадгална |
| Админ эрх (role) | **Postgres-first** унших (`serverAuth`) | `/api/admin/users` PATCH Postgres + Firestore хоёуланд бичнэ |
| Тохиргоо (settings, coupons) | **Postgres** (`Setting` table) | — |
| Wishlist | **Postgres** (`Wishlist` table, `/api/wishlist`) | — |
| Review like | **Postgres** (`ReviewLike` table) | — |

## Гол урсгалууд

### Шинэ хэрэглэгч
1. Firebase Auth дээр бүртгэгдэнэ.
2. `authService` → `syncUserToFirestore` (Firestore) **ба** `/api/auth/sync` (Postgres upsert).
3. Postgres `User.id === Firebase uid` тул админ жагсаалт, эрх, захиалга бүгд таарна.
4. Role-ийг sync **хэзээ ч дарж бичихгүй** — зөвхөн анх үүсгэхэд `customer`.

### Админ эрх олгох/хасах
- Зөвхөн `/api/admin/users` PATCH-аар явагдана (admin token шаардана).
- Postgres + Firestore хоёуланд бичнэ.
- **Сүүлийн админыг хасахаас хамгаална** (Postgres + Firestore-оос админуудыг нэгтгэн тоолно).
- Нэвтрэх эрхийг `serverAuth.resolveUserRole` Postgres-first, дараа нь Firestore-оос уншина.

### Хүргэлт / QPay
- Хүргэлтийн жагсаалт: Postgres-ийн `shipped` захиалга + Firestore-ийн хуучин захиалгуудыг id-аар нэгтгэнэ (Postgres давуу).
- "Хүргэгдсэн" болгох: Postgres-first, олдохгүй бол Firestore.
- QPay `check`/`callback`: Postgres-first, хуучин захиалга Firestore.

### Купон
- Эх сурвалж: `Setting` table доторх `coupons` массив (админ тохиргооноос удирдана).
- Хоосон бол `src/lib/coupons.ts` доторх `DEFAULT_COUPONS` (WELCOME10) ажиллана.
- Хөнгөлөлтийг **сервер талд** `resolveCoupon`-оор дахин тооцоолно — клиентэд хэзээ ч итгэхгүй.

## Аюулгүй байдал

- Бүх `/api/admin/*` — `authorizeAdminRequest` (Bearer + role).
- Хэрэглэгчийн API-ууд — `authorizeUserRequest` (IDOR-аас хамгаална).
- Rate limit (`src/lib/rateLimit.ts`): chat, contact, upload, qpay/check, forgot-password,
  email-verification, orders/create, coupons/validate, delivery, auth/sync, wishlist, review-like.
  Upstash Redis тохируулсан бол distributed, эс бөгөөс санах ой дээрх fallback.
- `/api/upload` — нэвтэрсэн хэрэглэгч + файл хэмжээ/төрөл шалгана.

## Өндөр ачаалал (concurrency)

- **Захиалгын дугаар**: Postgres sequence (`order_seq_<year>`)-ээр атомик үүсгэнэ — давхцахгүй.
- **Нөөц**: атомик нөхцөлт UPDATE (`stockQuantity >= q` бол decrement) — oversell болохгүй.
- **DB холболт**: `DATABASE_URL`-ийг ЗААВАЛ pooler (PgBouncer) руу заа, эс бөгөөс олон
  concurrent үед холболт дуусна. `prisma.ts` нь instance бүрд ганц client cache хийнэ.
- **Rate limit**: олон instance дээр Upstash Redis ашиглана (env тохируулна).
- **Ачааллын тест**: `npm run loadtest` (PRODUCT_ID, REGION_ID, ... орчны хувьсагчтай).
- **Unit тест**: `npm test` (купон + rate limit-ийн цэвэр логик).

## Production процесс

1. `.env.example`-ийн дагуу бүх env-ийг тохируулна.
2. Schema нийлүүлэх:
   ```bash
   npx prisma migrate deploy
   ```
3. (Анх удаа) Firestore → Postgres шилжүүлэх:
   ```bash
   npx tsx src/scripts/migrateFirestoreToPostgres.ts
   ```
4. Build:
   ```bash
   npm run build
   ```
5. Метрик кэш (сонголт, cron-оор): `ADMIN_METRICS_REBUILD_SECRET`-ийг тохируулж
   `/api/admin/metrics/rebuild`-ийг secret header-тэй дуудна.
6. Хүргэлтийн token-ийг админ тохиргоо (`settings.deliveryToken`) эсвэл
   `DELIVERY_API_TOKEN` env-ээс тохируулна.

## Дараагийн ажил (deferred)

- Firestore-оос бүрэн салах (бүх унших/бичих Postgres болсны дараа).
- Хуучин Firestore wishlist / review_likes өгөгдлийг Postgres руу нэг удаагийн backfill (хүсвэл).
