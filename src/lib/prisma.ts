import { PrismaClient } from '@prisma/client'

/**
 * Prisma singleton.
 *
 * Өндөр ачаалал / serverless дээр холболтын пул дуусахаас сэргийлэхийн тулд:
 *  - Instance бүрд ганц л PrismaClient үүсгэнэ (global cache).
 *  - DATABASE_URL нь pooler (PgBouncer/Supabase/Neon pooler) руу заасан байх ёстой,
 *    ж: `...?pgbouncer=true&connection_limit=1&pool_timeout=20`.
 *  - DIRECT_URL (schema.prisma доторх directUrl) нь migrate-д ашиглагдах шууд холболт.
 *
 * Эдгээр нь .env-ийн тохиргооны асуудал тул кодоос гадна тохируулна (.env.example үзнэ үү).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Production дээр ч мөн cache хийнэ — нэг instance дотор олон клиент үүсэхээс сэргийлнэ.
globalForPrisma.prisma = prisma
