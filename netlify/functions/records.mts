import type { Config, Context } from '@netlify/functions';
import { authenticated, sameOrigin, json, body, cookie, env } from './_shared/security.mts';
import { storeFor, allEdits, validGrid, validateEntry, backup } from './_shared/data.mts';
export default async (req: Request, context: Context) => {
  if (!authenticated(req)) return json({ error: 'Please sign in again. Your unsaved text remains in this window.' }, 401);
  if (req.method !== 'GET' && !sameOrigin(req)) return json({ error: 'Request blocked.' }, 403);
  const action = new URL(req.url).pathname.split('/').pop();
  try {
    if (action === 'logout' && req.method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    const store = storeFor(context);
    if (action === 'records' && req.method === 'GET') return json({ edits: await allEdits(store) });
    if (action === 'backup' && req.method === 'GET') return json(await backup(store), 200, { 'Content-Disposition': `attachment; filename="Dupont_Light_Poles_${new Date().toISOString().slice(0,10)}.json"` });
    if (action === 'status' && req.method === 'GET') return json({ configured: !!env('RESEND_API_KEY') && !!env('BACKUP_FROM'), last: await store.get('email/status', { type: 'json' }) });
    if (action === 'records' && req.method === 'POST') {
      const input = await body(req);
      if (!validGrid(input.grid)) return json({ error: 'Unknown pole number.' }, 400);
      const entry = validateEntry(input.entry);
      // Separate keys prevent a stale whole-page save from overwriting other poles.
      await store.setJSON('poles/' + input.grid, entry);
      return json({ entry });
    }
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && /Invalid entry|Check the address|address is required|too large/.test(error.message))) return json({ error: (error as Error).message }, 400);
    console.error('Pole operation failed', error);
    return json({ error: 'Could not reach shared storage. Keep this window open and try again.' }, 503);
  }
};
export const config: Config = { path: ['/api/records', '/api/backup', '/api/status', '/api/logout'] };
