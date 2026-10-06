import { env } from './security.mts';
export function emailPayload(snapshot: unknown, day: string) {
  return { from: env('BACKUP_FROM'), to: ['drguariglia@hotmail.com'], subject: `Dupont light-pole backup — ${day}`,
    text: 'The attached JSON contains the Dupont Borough light-pole records and saved address verification entries. Keep it as a backup; use Import JSON in the app to merge entries if needed.',
    attachments: [{ filename: `Dupont_Light_Poles_${day}.json`, content: Buffer.from(JSON.stringify(snapshot, null, 2)).toString('base64'), content_type: 'application/json' }] };
}
export async function sendBackup(snapshot: unknown, day: string) {
  if (!env('RESEND_API_KEY') || !env('BACKUP_FROM')) throw new Error('Email setup incomplete: add RESEND_API_KEY and BACKUP_FROM.');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': `dupont-poles-${day}` }, body: JSON.stringify(emailPayload(snapshot, day)), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Email service rejected the backup (HTTP ${response.status}). Check the API key and verified sender in Resend.`);
  const result = await response.json();
  if (!result.id) throw new Error('Email service did not confirm receipt.');
  return result.id as string;
}
