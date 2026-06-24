import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * OAuth callback handler.
 *
 * After a Supabase OAuth sign-in (Google / GitHub / Discord), Supabase
 * redirects here with a `code` query param. We exchange it for a session,
 * which sets the auth cookies, then redirect into the dashboard.
 *
 * For email confirmation / password-reset flows that include `type` and
 * a hash, Supabase redirects here too; we forward to the appropriate page.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const supabase = await createSupabaseServerClient();

  // Password reset / email confirmation redirects to a dedicated page.
  if (type === 'recovery') {
    return NextResponse.redirect(`${requestUrl.origin}/reset-password`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Surface the error on the login page so the user sees what happened.
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
