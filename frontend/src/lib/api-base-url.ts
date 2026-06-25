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
    const hostname = window.location.hostname || 'localhost';
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api/v1';
    }
    const protocol = window.location.protocol.startsWith('http')
      ? window.location.protocol
      : 'http:';
    return `${protocol}//${hostname}:8000/api/v1`;
  }

  return 'http://127.0.0.1:8000/api/v1';
}
