import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticated, issueToken, cookie } from '../netlify/functions/_shared/security.mts';
import { validateEntry, validGrid } from '../netlify/functions/_shared/data.mts';
import { emailPayload, sendBackup } from '../netlify/functions/_shared/email.mts';
import login from '../netlify/functions/login.mts';
import records from '../netlify/functions/records.mts';
import app from '../netlify/functions/app.mts';
import { poles } from '../netlify/functions/_shared/poles.mts';
import { streets } from '../netlify/functions/_shared/streets.mts';
const values: Record<string,string> = { APP_PASSWORD: 'test-password', SESSION_SECRET: 'test-session-secret-for-local-tests-only', BACKUP_FROM: 'test@example.test', RESEND_API_KEY: 'test-only' };
Object.assign(globalThis, { Netlify: { env: { get: (k: string) => values[k] } } });
test('all original poles retained, unique keys, standardized address enforced', () => {
  assert.equal(poles.length, 204); assert.equal(new Set(poles.map(p=>p.grid)).size,204);
  assert.equal(new Set(streets).size, streets.length); assert(streets.includes('Chestnut'));
  const e = validateEntry({ houseNumber:'600',street:'chestnut',notes:' test ',visuallyVerified:true });
  assert.equal(e.verifiedAddress,'600 Chestnut, Dupont, PA 18641');assert.equal(e.notes,'test');
  assert.throws(()=>validateEntry({houseNumber:'600',street:'Chesnutt',notes:'',visuallyVerified:true}));
  assert.throws(()=>validateEntry({houseNumber:'',street:'Chestnut',notes:'',visuallyVerified:true}));
  assert(!validGrid('../other-data'));
});
test('signed sessions reject tampering; cookie is secure and HTTP-only', () => {
  const token=issueToken();const request=(value:string)=>new Request('https://test.local/app',{headers:{cookie:cookie(value)}});
  assert(authenticated(request(token)));assert(!authenticated(request(token+'tampered')));assert(!authenticated(new Request('https://test.local/app')));
  assert(cookie(token).includes('HttpOnly; Secure; SameSite=Strict'));
});
test('login rejects wrong password and foreign origin', async()=>{
  const req=(password:string,origin='https://test.local')=>new Request('https://test.local/api/login',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({password})});
  assert.equal((await login(req('wrong'))).status,401);
  assert.equal((await login(req('test-password','https://foreign.test'))).status,403);
  const success=await login(req('test-password'));assert.equal(success.status,200);assert(success.headers.get('set-cookie'));
});
test('protected page and records reject unauthenticated requests before storage access',async()=>{
  assert.equal((await app(new Request('https://test.local/app'))).status,302);
  assert.equal((await records(new Request('https://test.local/api/records'),{} as never)).status,401);
});
test('backup attachment round-trips JSON to correct recipient; provider failures remain failures',async()=>{
  const snapshot={edits:{one:{notes:'Borough backup'}}};const payload=emailPayload(snapshot,'2026-10-06');
  assert.deepEqual(payload.to,['drguariglia@hotmail.com']);assert.deepEqual(JSON.parse(Buffer.from(payload.attachments[0].content,'base64').toString()),snapshot);
  const original=globalThis.fetch;
  try{globalThis.fetch=async()=>new Response('{}',{status:403});await assert.rejects(sendBackup(snapshot,'2026-10-06'));}finally{globalThis.fetch=original;}
});
