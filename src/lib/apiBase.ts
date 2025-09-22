// Centralized API base resolution with development fallbacks.
// Priority:
// 1. Explicit NEXT_PUBLIC_API_URL
// 2. If running on localhost:3000 (both frontend + backend share 3000 in this requested setup)
// 3. Default/fallback to http://localhost:3000
// Optionally you can set NEXT_PUBLIC_API_FALLBACK_PORT to override secondary attempt.

let cached: string | null = null;

export function getApiBase() {
  if (cached) return cached;
  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envBase) {
    cached = envBase.replace(/\/$/, '');
    return cached;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost') {
      // Requested setup: backend fixed on 3000, frontend runs on 3001 (preferred) or possibly 3000.
      if (port === '3001') {
        cached = `${protocol}//localhost:3000`;
        return cached;
      }
      // If frontend also on 3000, we assume same origin until explicit NEXT_PUBLIC_API_URL provided.
      cached = `${protocol}//localhost:3000`;
      return cached;
    }
    cached = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return cached;
  }
  cached = 'http://localhost:3000';
  return cached;
}
