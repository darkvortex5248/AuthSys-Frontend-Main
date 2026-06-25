/**
 * Resolve the FastAPI `/api/v1` base URL for browser and server fetch calls.
 *
 * `NEXT_PUBLIC_API_URL` should be the API origin only (e.g. `https://api.example.com`
 * or empty for same-origin `/api/v1` behind a reverse proxy). Do not include `/api/v1`
 * unless you set the full path — we detect and avoid doubling it.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    const normalized = envUrl.replace(/\/$/, '');
    if (normalized.endsWith('/api/v1')) {
      return normalized;
    }
    return `${normalized}/api/v1`;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol.startsWith('http')
      ? window.location.protocol
      : 'http:';
    const hostname = window.location.hostname || 'localhost';
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api/v1';
    }
    return `${protocol}//${hostname}:8000/api/v1`;
  }

  return 'http://127.0.0.1:8000/api/v1';
}
