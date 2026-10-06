import { getStore, getDeployStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { poles } from './poles.mts';
import { streets } from './streets.mts';
export type Entry = { houseNumber: string; street: string; verifiedAddress: string; notes: string; visuallyVerified: boolean; updatedAt: string };
export function storeFor(context: Context) {
  return context.deploy.context === 'production'
    ? getStore({ name: 'dupont-light-poles', consistency: 'strong' })
    : getDeployStore({ name: 'dupont-light-poles', consistency: 'strong' });
}
export function validateEntry(input: unknown): Entry {
  if (!input || typeof input !== 'object') throw new Error('Invalid entry.');
  const e = input as Record<string, unknown>;
  if (typeof e.houseNumber !== 'string' || !/^[0-9A-Za-z /-]{0,30}$/.test(e.houseNumber) || typeof e.street !== 'string' || typeof e.notes !== 'string' || e.notes.length > 4000 || typeof e.visuallyVerified !== 'boolean') throw new Error('Check the address and notes.');
  const street = streets.find(s => s.toLowerCase() === (e.street as string).trim().toLowerCase()) || '';
  if ((e.street.trim() && !street) || (e.houseNumber.trim() && !street)) throw new Error('Check the address: select a street from the list.');
  const houseNumber = e.houseNumber.trim();
  if (e.visuallyVerified && (!street || !houseNumber)) throw new Error('An address is required for visual verification.');
  return { houseNumber, street, verifiedAddress: houseNumber && street ? `${houseNumber} ${street}, Dupont, PA 18641` : '', notes: e.notes.trim(), visuallyVerified: e.visuallyVerified, updatedAt: new Date().toISOString() };
}
export function validGrid(grid: unknown): grid is string { return typeof grid === 'string' && poles.some(p => p.grid === grid); }
export async function allEdits(store: ReturnType<typeof storeFor>) {
  const { blobs } = await store.list({ prefix: 'poles/' });
  const edits: Record<string, Entry> = {};
  for (let start = 0; start < blobs.length; start += 25) {
    await Promise.all(blobs.slice(start, start + 25).map(async b => {
      const grid = b.key.slice(6);
      if (!validGrid(grid)) return;
      const entry = await store.get(b.key, { type: 'json' });
      if (entry) edits[grid] = entry;
    }));
  }
  return edits;
}
export async function backup(store: ReturnType<typeof storeFor>) {
  return { system: 'Dupont Borough Light Pole Address Verification', version: 2, exportedAt: new Date().toISOString(), poleCount: poles.length, poles, edits: await allEdits(store) };
}
