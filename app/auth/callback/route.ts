import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  if (error) {
    console.error('OAuth Error Redirected from Supabase:', error, errorDescription);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // Determine proper role-based redirection
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role || 'student';
      
      console.log(`OAuth Success: User ${user?.id} logged in with role ${role}. Redirecting to /${role}/dashboard`);
      return NextResponse.redirect(`${origin}/${role}/dashboard`);
    } else {
      console.error('OAuth Exchange Code Error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/auth/login?error=ExchangeCodeError`);
    }
  }

  // If there's no code and no error param, something is wrong
  console.warn('OAuth Callback reached without code or error parameter.');
  return NextResponse.redirect(`${origin}/auth/login?error=OAuthNoCode`);
}
