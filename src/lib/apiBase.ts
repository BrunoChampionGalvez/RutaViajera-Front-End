// Centralized API base resolution.
// Development enforced convention:
//   - Backend: http://localhost:3000
//   - Frontend dev: http://localhost:3001 (script sets PORT=3001)
// Priority:
// 1. Explicit NEXT_PUBLIC_API_URL (always wins)
// 2. If running on localhost:* -> force backend 3000
// 3. Fallback: http://localhost:3000

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
    // Production guidance: if we're in production (heuristic: vercel.app domain) and no explicit env var, warn developer.
    if (process.env.NODE_ENV === 'production' && /vercel\.app$/.test(hostname)) {
      // This warning only appears in browser console; helps diagnose misconfiguration.
      // Without NEXT_PUBLIC_API_URL the frontend will call itself instead of the backend.
      // eslint-disable-next-line no-console
      console.warn('[apiBase] Falta NEXT_PUBLIC_API_URL en entorno de producción. Configura esta variable para apuntar al backend (por ejemplo https://rutaviajera-back-end-production.up.railway.app)');
    }
    if (hostname === 'localhost') {
      // Always point to backend 3000 in local dev (frontend should be on 3001)
      cached = `${protocol}//localhost:3000`;
      return cached;
    }
    cached = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return cached;
  }
  cached = 'http://localhost:3000';
  return cached;
}
