import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ── In-memory rate limit map for API routes ──
const apiRateMap = new Map<string, { count: number; resetTime: number }>();
const API_RATE_LIMIT = 60;
const API_RATE_WINDOW = 60_000;

let lastCleanup = Date.now();
function cleanupMap() {
  const now = Date.now();
  if (now - lastCleanup < 120_000) return;
  lastCleanup = now;
  for (const [key, entry] of apiRateMap.entries()) {
    if (now > entry.resetTime) apiRateMap.delete(key);
  }
}

// Known attack tool user agents
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nessus/i, /havij/i, /w3af/i,
  /openvas/i, /masscan/i, /nmap/i, /dirbuster/i, /gobuster/i,
];

// Suspicious path patterns (pen-test probing)
const SUSPICIOUS_PATH_PATTERNS = [
  /\.\.\//, /\.\.\\/, /%2e%2e/i,
  /\0/, /%00/,
  /\/wp-admin/i, /\/wp-login/i,
  /\/\.env/i, /\/\.git/i,
  /\/phpmyadmin/i,
  /\/actuator/i,
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ua = request.headers.get('user-agent') || '';

  // ── Security Layer 1: Block known attack tools ──
  if (BLOCKED_UA_PATTERNS.some(p => p.test(ua))) {
    console.warn(`[SECURITY] Blocked attack tool: UA="${ua}" IP=${ip} Path=${pathname}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ── Security Layer 2: Block suspicious paths ──
  if (SUSPICIOUS_PATH_PATTERNS.some(p => p.test(pathname))) {
    console.warn(`[SECURITY] Suspicious path blocked: IP=${ip} Path=${pathname}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // ── Security Layer 3: Rate limit API routes ──
  if (pathname.startsWith('/api/')) {
    cleanupMap();
    const now = Date.now();
    const entry = apiRateMap.get(ip);

    if (!entry || now > entry.resetTime) {
      apiRateMap.set(ip, { count: 1, resetTime: now + API_RATE_WINDOW });
    } else if (entry.count >= API_RATE_LIMIT) {
      console.warn(`[SECURITY] Rate limit exceeded: IP=${ip} Path=${pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          },
        }
      );
    } else {
      entry.count += 1;
    }
  }

  // ── Security Layer 4: Request size guard ──
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return new NextResponse('Payload too large', { status: 413 });
  }

  // ── Auth: Supabase session management ──
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // AUTH CHECK: One round-trip to Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = ['/student', '/instructor', '/staff', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // PERFORMANCE HACK: Inject the user ID into the request headers.
  // This allows Server Components (like layout.tsx) to skip the redundant
  // supabase.auth.getUser() call, saving ~150-300ms of latency per navigation.
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);

    const newResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // IMPORTANT: Copy all cookies from supabaseResponse to the new response
    // so that refreshed auth tokens are not dropped.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      newResponse.cookies.set(cookie.name, cookie.value);
    });

    return newResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
