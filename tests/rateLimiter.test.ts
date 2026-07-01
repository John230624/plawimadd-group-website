import { checkRateLimit } from '@/lib/rateLimiter';

describe('checkRateLimit', () => {
  const config = { windowMs: 1000, maxRequests: 3 };

  it('allows requests within the limit', () => {
    const key = 'test-key-1';
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it('blocks requests exceeding the limit', () => {
    const key = 'test-key-2';
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', async () => {
    const key = 'test-key-3';
    const shortConfig = { windowMs: 100, maxRequests: 1 };

    expect(checkRateLimit(key, shortConfig).allowed).toBe(true);
    expect(checkRateLimit(key, shortConfig).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(checkRateLimit(key, shortConfig).allowed).toBe(true);
  });
});
