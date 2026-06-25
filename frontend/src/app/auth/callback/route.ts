import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-base-url';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state') || 'google';
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=No authorization code received`);
  }

  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/developer/auth/oauth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        provider: state,
        redirect_uri: `${requestUrl.origin}/auth/callback`,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'OAuth failed' }));
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(errData.detail || 'OAuth authentication failed')}`
      );
    }

    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`);

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=OAuth callback failed`
    );
  }
}
