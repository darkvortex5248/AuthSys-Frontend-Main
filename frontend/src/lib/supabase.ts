import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client.
 *
 * Used by the client side of the app (auth pages, dashboard) to sign in /
 * sign up / OAuth / password reset directly with Supabase Auth.
 *
 * Server-side cookies are handled separately (see lib/supabase-server.ts),
 * but the browser client syncs its session into cookies that the server
 * middleware can read.
 *
 * Env vars (must be NEXT_PUBLIC_* so they are exposed to the browser):
 *   NEXT_PUBLIC_SUPABASE_URL       e.g. https://vbnjhqnkmbjmvlfdlrpv.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  the anon (public) key
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // We log instead of throwing so that environments without the env vars
  // (e.g. legacy local dev) still render — auth calls will simply fail later.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Supabase auth will be unavailable until they are configured.'
  );
}

export const supabase = createBrowserClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
);
