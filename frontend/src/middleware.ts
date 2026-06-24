import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresh the Supabase auth session on every navigation.
 *
 * @supabase/ssr requires this middleware so that the access token cookies
 * stay fresh (they are short-lived). Without it, a logged-in user's session
 * can silently expire mid-browsing and the next API call returns 401.
 *
 * We intentionally do NOT enforce auth/redirects here — route protection is
 * handled by the dashboard layout (which calls useAuthStore.restoreSession).
 * Keeping this middleware read-only avoids interfering with public pages.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Skip if Supabase is not configured (legacy / local dev).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() refreshes the session cookies transparently.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT Next.js internals, static assets, and API
     * routes that don't need session refresh.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
