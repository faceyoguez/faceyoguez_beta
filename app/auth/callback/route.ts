import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRoleRedirectPath, fetchUserRole } from '@/lib/utils/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') || searchParams.get('redirectTo');

  if (error) {
    console.error('OAuth Error Redirected from Supabase:', error, errorDescription);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  // Handle password reset / email verification via token_hash (Supabase email flow)
  if (tokenHash && type) {
    const supabase = await createServerSupabaseClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'signup' | 'email' | 'invite' | 'magiclink' | 'email_change',
    });

    if (!verifyError) {
      const redirectPath = next || '/auth/reset-password';
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } else {
      console.error('Token verification error:', verifyError.message);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(verifyError.message)}`);
    }
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Determine proper role-based redirection
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(`${origin}/auth/login?error=UserNotFound`);
      }

      const role = await fetchUserRole(supabase, user.id);
      const redirectPath = getRoleRedirectPath(role);

      // Trigger welcome email if this is a new signup (account created < 5 mins ago)
      try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const { sendWelcomeEmail } = await import('@/lib/email/sender');
        const admin = createAdminClient();
        const { data: profile } = await admin.from('profiles').select('created_at, full_name, email').eq('id', user.id).single();

        const createdAt = new Date(profile?.created_at || user.created_at);
        const ageMs = Date.now() - createdAt.getTime();
        if (ageMs < 5 * 60 * 1000) {
          const rawName = profile?.full_name || user.user_metadata?.full_name || 'there';
          const firstName = rawName.split(' ')[0];
          const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
          const email = profile?.email || user.email;
          if (email) {
            await sendWelcomeEmail(email, capitalized).catch(err => console.error('[Welcome Email Error]:', err));
          }
        }
      } catch (err) {
        console.error('Failed to process welcome email in callback:', err);
      }

      console.log(`OAuth Success: User ${user.id} logged in as ${role}. Redirecting to ${redirectPath}`);
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } else {
      console.error('OAuth Exchange Code Error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/auth/login?error=ExchangeCodeError`);
    }
  }

  // If there's no code/token_hash and no error param, something is wrong
  console.warn('OAuth Callback reached without code or error parameter.');
  return NextResponse.redirect(`${origin}/auth/login?error=OAuthNoCode`);
}
