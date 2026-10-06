import type { Config } from '@netlify/functions';
import { body, secret, equal, env, issueToken, cookie, json, sameOrigin } from './_shared/security.mts';
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!sameOrigin(req)) return json({ error: 'Please sign in from this website.' }, 403);
  try {
    secret();
    const input = await body(req);
    if (typeof input.password !== 'string' || !equal(input.password, env('APP_PASSWORD'))) return json({ error: 'Incorrect password. Please try again.' }, 401);
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(issueToken()) });
  } catch (error) { return json({ error: error instanceof SyntaxError ? 'Invalid request.' : 'Login setup is incomplete. Contact the Borough Manager.' }, 503); }
};
export const config: Config = { path: '/api/login', rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
