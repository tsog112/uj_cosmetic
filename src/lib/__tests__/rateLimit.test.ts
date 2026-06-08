import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

function makeReq(ip = '1.2.3.4'): Request {
  return new Request('http://localhost/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('getClientIp', () => {
  it('reads first x-forwarded-for entry', () => {
    const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });
  it('falls back to unknown', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('checkRateLimit (memory backend)', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('allows up to the limit then blocks', async () => {
    const opts = { key: `t-${Math.random()}`, limit: 3, windowMs: 60_000 };
    const req = makeReq();
    expect((await checkRateLimit(req, opts)).ok).toBe(true);
    expect((await checkRateLimit(req, opts)).ok).toBe(true);
    expect((await checkRateLimit(req, opts)).ok).toBe(true);
    const blocked = await checkRateLimit(req, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('separates buckets per identifier', async () => {
    const opts = { key: `t-${Math.random()}`, limit: 1, windowMs: 60_000 };
    expect((await checkRateLimit(makeReq('5.5.5.5'), opts)).ok).toBe(true);
    expect((await checkRateLimit(makeReq('6.6.6.6'), opts)).ok).toBe(true);
    expect((await checkRateLimit(makeReq('5.5.5.5'), opts)).ok).toBe(false);
  });

  it('resets after the window elapses', async () => {
    vi.useFakeTimers();
    try {
      const opts = { key: `t-${Math.random()}`, limit: 1, windowMs: 1000 };
      const req = makeReq('7.7.7.7');
      expect((await checkRateLimit(req, opts)).ok).toBe(true);
      expect((await checkRateLimit(req, opts)).ok).toBe(false);
      vi.advanceTimersByTime(1500);
      expect((await checkRateLimit(req, opts)).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
