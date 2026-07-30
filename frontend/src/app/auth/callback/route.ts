import { NextResponse } from 'next/server';

function getCallbackApiBaseUrl(requestUrl: URL): string {
  const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
  if (!isLocalhost) {
    return `${requestUrl.origin}/api/v1`;
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (envUrl) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`;
  }

  return 'http://127.0.0.1:8000/api/v1';
}

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
    const apiBase = getCallbackApiBaseUrl(requestUrl);
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

    const data = await res.json();
    const token = data.access_token;

    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`);

    // Save token as JS-accessible cookie so Zustand can read it on mount
    response.cookies.set('auth_token', token, {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: false,
      sameSite: 'lax',
      secure: requestUrl.protocol === 'https:',
    });

    // Forward httpOnly cookie too (for server-side session endpoints)
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      response.headers.append('set-cookie', setCookie);
    }

    return response;
  } catch {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=OAuth callback failed`
    );
  }
}
