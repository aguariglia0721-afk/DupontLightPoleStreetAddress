import type { Config, Context } from '@netlify/functions';
import { storeFor, backup } from './_shared/data.mts';
import { sendBackup } from './_shared/email.mts';
export default async (_req: Request, context: Context) => {
  if (context.deploy.context !== 'production') return;
  const store = storeFor(context);
  const day = new Date().toISOString().slice(0, 10);
  try {
    if (await store.get('email/sent/' + day)) return;
    // Freeze the daily snapshot so an email retry uses the same attachment.
    let snapshot = await store.get('backups/' + day, { type: 'json' });
    if (!snapshot) { snapshot = await backup(store); await store.setJSON('backups/' + day, snapshot); }
    const id = await sendBackup(snapshot, day);
    await store.setJSON('email/sent/' + day, { id });
    await store.setJSON('email/status', { state: 'accepted', at: new Date().toISOString(), day, message: 'Email service accepted the daily backup. Check your inbox and junk folder.' });
  } catch (error) {
    await store.setJSON('email/status', { state: 'failed', at: new Date().toISOString(), day, message: error instanceof Error ? error.message : 'Email failed.' });
    throw error;
  }
};
// Morning backup at 10:00 UTC; retries at 11:00 and 12:00 only if not accepted.
export const config: Config = { schedule: '0 10,11,12 * * *' };
