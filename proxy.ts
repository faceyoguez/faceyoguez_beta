import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: object) {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: object) {
          request.cookies.set(name, '');
          response = NextResponse.next({ request });
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/student') ||
      request.nextUrl.pathname.startsWith('/instructor'))
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Role-based route protection
  if (user && request.nextUrl.pathname.startsWith('/instructor')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'instructor', 'staff'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/student/:path*', '/instructor/:path*'],
};
