import { readFile } from 'node:fs/promises';
import type { Config } from '@netlify/functions';
import { authenticated, headers } from './_shared/security.mts';
export default async (req: Request) => {
  if (!authenticated(req)) return new Response(null, { status: 302, headers: headers({ Location: '/' }) });
  return new Response(await readFile('private/app.html', 'utf8'), { headers: headers({ 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'same-origin' }) });
};
export const config: Config = { path: '/app' };
