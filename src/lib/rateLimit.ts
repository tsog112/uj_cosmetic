import { NextResponse } from 'next/server';

/**
 * Rate limiter — хоёр backend-тэй:
 *  1. Upstash Redis (REST) — UPSTASH_REDIS_REST_URL/TOKEN тохируулсан үед.
 *     Олон serverless instance дээр зохицуулагдсан, жинхэнэ хамгаалалт.
 *  2. Санах ой дээрх fallback — Redis тохируулаагүй үед (нэг instance хүртэл).
 *
 * Интерфэйс async тул дуудах талд `await enforceRateLimit(...)` гэж дуудна.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

function hasUpstash(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function checkMemory(id: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucketKey = `${options.key}:${id}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1, retryAfterSec: 0 };
  }

  if (existing.count >= options.limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true, remaining: options.limit - existing.count, retryAfterSec: 0 };
}

/**
 * Upstash REST дээрх fixed-window: INCR хийгээд эхний удаа EXPIRE тавина.
 * Pipeline ашиглан нэг хүсэлтээр гүйцэтгэнэ.
 */
async function checkRedis(id: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const windowStart = Math.floor(Date.now() / options.windowMs);
  const redisKey = `rl:${options.key}:${id}:${windowStart}`;
  const base = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const res = await fetch(`${base}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(windowSec), 'NX'],
    ]),
    // 2 секундын дотор хариу ирэхгүй бол fallback руу шилжинэ
    signal: AbortSignal.timeout(2000),
  });

  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(data?.[0]?.result || 0);

  if (count > options.limit) {
    return { ok: false, remaining: 0, retryAfterSec: windowSec };
  }
  return { ok: true, remaining: Math.max(0, options.limit - count), retryAfterSec: 0 };
}

export async function checkRateLimit(req: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const id = options.identifier || getClientIp(req);
  if (hasUpstash()) {
    try {
      return await checkRedis(id, options);
    } catch (error) {
      console.warn('Upstash rate limit failed, falling back to memory:', error);
    }
  }
  return checkMemory(id, options);
}

/**
 * Хязгаар хэтэрсэн бол 429 NextResponse, эс бөгөөс null буцаана.
 * Дуудлага: `const limited = await enforceRateLimit(req, {...}); if (limited) return limited;`
 */
export async function enforceRateLimit(req: Request, options: RateLimitOptions): Promise<NextResponse | null> {
  const result = await checkRateLimit(req, options);
  if (result.ok) return null;
  return NextResponse.json(
    { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } },
  );
}
