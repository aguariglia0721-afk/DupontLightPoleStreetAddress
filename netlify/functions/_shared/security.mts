import { createHmac, createHash, timingSafeEqual, randomBytes } from 'node:crypto';

export function env(key: string) { return Netlify.env.get(key) || ''; }
export function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function secret() {
  const key = env('SESSION_SECRET');
  if (key.length < 32 || !env('APP_PASSWORD')) throw new Error('Login setup is incomplete. Set APP_PASSWORD and SESSION_SECRET in Netlify.');
  return key;
}
export function sign(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }
export function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 12 * 3600000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return payload + '.' + sign(payload);
}
export function authenticated(req: Request) {
  const token = req.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('dupont_session='))?.slice(15);
  if (!token) return false;
  try {
    const parts = token.split('.');
    return parts.length === 2 && equal(parts[1], sign(parts[0])) && JSON.parse(Buffer.from(parts[0], 'base64url').toString()).exp > Date.now();
  } catch { return false; }
}
export function cookie(value: string, age = 43200) { return `dupont_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`; }
export function sameOrigin(req: Request) { return req.headers.get('origin') === new URL(req.url).origin; }
export function headers(extra: Record<string, string> = {}) {
  return { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', ...extra };
}
export function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(data, { status, headers: headers(extra) });
}
export async function body(req: Request) {
  const raw = await req.text();
  if (raw.length > 16000) throw new Error('Entry is too large.');
  return JSON.parse(raw);
}
