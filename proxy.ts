import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
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

  const protectedRoutes = ['/student', '/instructor', '/staff'];
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
