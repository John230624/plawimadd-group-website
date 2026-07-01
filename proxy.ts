import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimiter';

const SENSITIVE_ROUTES = [
  { pattern: /^\/api\/users\/login/, windowMs: 60_000, maxRequests: 5 },
  { pattern: /^\/api\/users\/register/, windowMs: 60_000, maxRequests: 3 },
  { pattern: /^\/api\/users\/mot-de-passe-oublie/, windowMs: 60_000, maxRequests: 3 },
  { pattern: /^\/api\/users\/reinitialiser-mot-de-passe/, windowMs: 60_000, maxRequests: 5 },
  { pattern: /^\/api\/contact/, windowMs: 60_000, maxRequests: 3 },
  { pattern: /^\/api\/upload-image/, windowMs: 60_000, maxRequests: 10 },
];

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  for (const route of SENSITIVE_ROUTES) {
    if (route.pattern.test(path)) {
      const key = rateLimitKey(request);
      const result = checkRateLimit(key, {
        windowMs: route.windowMs,
        maxRequests: route.maxRequests,
      });

      if (!result.allowed) {
        return NextResponse.json(
          { message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(result.resetIn / 1000)),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/users/login',
    '/api/users/register',
    '/api/users/mot-de-passe-oublie',
    '/api/users/reinitialiser-mot-de-passe',
    '/api/contact',
    '/api/upload-image',
  ],
};
